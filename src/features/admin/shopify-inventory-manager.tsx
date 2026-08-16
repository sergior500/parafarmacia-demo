"use client";

import {
  Boxes,
  CircleAlert,
  LoaderCircle,
  MapPin,
  PackageMinus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import type {
  ShopifyInventoryItem,
  ShopifyInventoryReport,
} from "@/server/shopify/inventory";

interface InventoryResponse {
  report?: ShopifyInventoryReport;
  result?: { quantity: number };
  error?: string;
}

function inventoryKey(itemId: string, locationId: string) {
  return `${itemId}:${locationId}`;
}

function clampQuantity(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 999_999
    ? parsed
    : null;
}

export function ShopifyInventoryManager({
  initialReport,
}: {
  initialReport: ShopifyInventoryReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [query, setQuery] = useState("");
  const [locationId, setLocationId] = useState(
    initialReport.locations.find((location) => location.isActive)?.id ?? "all",
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeLocations = report.locations.filter(
    (location) => location.isActive,
  );
  const selectedActivationLocation =
    activeLocations.find((location) => location.id === locationId) ??
    activeLocations[0];
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visibleItems = useMemo(
    () =>
      report.items.filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          `${item.productTitle} ${item.variantTitle} ${item.sku ?? ""}`
            .toLocaleLowerCase("es")
            .includes(normalizedQuery);
        const matchesLocation =
          locationId === "all" ||
          item.levels.some((level) => level.locationId === locationId) ||
          !item.tracked;
        return matchesQuery && matchesLocation;
      }),
    [locationId, normalizedQuery, report.items],
  );

  async function refreshInventory() {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/inventory", {
        cache: "no-store",
      });
      const body = (await response.json()) as InventoryResponse;
      if (!response.ok || !body.report) {
        throw new Error(body.error || "No se pudo actualizar el inventario.");
      }
      setReport(body.report);
      setValues({});
      setNotice("Inventario actualizado con los últimos datos de Shopify.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el inventario.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function updateQuantity(
    item: ShopifyInventoryItem,
    level: ShopifyInventoryItem["levels"][number],
  ) {
    const key = inventoryKey(item.id, level.locationId);
    const nextQuantity = clampQuantity(values[key] ?? String(level.available));
    if (nextQuantity === null) {
      setError("Introduce una cantidad entera entre 0 y 999.999.");
      return;
    }
    if (nextQuantity === level.available) {
      setNotice("El stock ya tiene esa cantidad.");
      return;
    }
    await submitInventoryChange(key, {
      action: "set",
      inventoryItemId: item.id,
      locationId: level.locationId,
      quantity: nextQuantity,
      compareQuantity: level.available,
    });
  }

  async function activateTracking(item: ShopifyInventoryItem) {
    if (!selectedActivationLocation) {
      setError("Shopify no tiene ninguna ubicación activa.");
      return;
    }
    const key = inventoryKey(item.id, selectedActivationLocation.id);
    const nextQuantity = clampQuantity(values[key] ?? "0");
    if (nextQuantity === null) {
      setError("Introduce una cantidad inicial entera entre 0 y 999.999.");
      return;
    }
    await submitInventoryChange(key, {
      action: "activate",
      inventoryItemId: item.id,
      locationId: selectedActivationLocation.id,
      quantity: nextQuantity,
    });
  }

  async function submitInventoryChange(
    key: string,
    payload: Record<string, string | number>,
  ) {
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as InventoryResponse;
      if (!response.ok) {
        throw new Error(
          body.error ||
            "No se pudo guardar. Actualiza los datos antes de volver a intentarlo.",
        );
      }
      await refreshInventory();
      setNotice("Stock guardado correctamente.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el inventario.",
      );
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Boxes}
          label="Variantes"
          value={report.metrics.totalItems}
        />
        <Metric
          icon={ShieldCheck}
          label="Con seguimiento"
          value={report.metrics.trackedItems}
        />
        <Metric
          icon={PackageMinus}
          label="Stock bajo"
          value={report.metrics.lowStockLevels}
          tone="amber"
        />
        <Metric
          icon={CircleAlert}
          label="Agotadas"
          value={report.metrics.outOfStockLevels}
          tone="red"
        />
      </section>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem_auto] lg:items-end">
          <label className="block">
            <span className="text-forest text-xs font-black tracking-wider uppercase">
              Buscar producto o SKU
            </span>
            <span className="border-forest/15 mt-2 flex min-h-12 items-center gap-3 rounded-2xl border bg-white px-4">
              <Search className="text-ink-muted size-4" />
              <input
                className="text-forest min-w-0 flex-1 bg-transparent text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. sérum o SKU-001"
                type="search"
                value={query}
              />
            </span>
          </label>
          <label className="block">
            <span className="text-forest text-xs font-black tracking-wider uppercase">
              Ubicación
            </span>
            <select
              className="border-forest/15 text-forest mt-2 min-h-12 w-full rounded-2xl border bg-white px-4 text-sm font-bold"
              onChange={(event) => setLocationId(event.target.value)}
              value={locationId}
            >
              <option value="all">Todas las ubicaciones</option>
              {activeLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="border-forest/15 text-forest hover:bg-sage inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-black disabled:opacity-50"
            disabled={refreshing}
            onClick={refreshInventory}
            type="button"
          >
            {refreshing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            Actualizar
          </button>
        </div>
        {notice ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
        {report.hasMore ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Shopify tiene más de 250 variantes. Esta primera versión muestra las
            250 más recientes.
          </p>
        ) : null}
      </Card>

      <section className="space-y-4">
        {visibleItems.map((item) => (
          <Card className="overflow-hidden" key={item.id}>
            <div className="border-forest/10 bg-sage/35 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-forest font-black">{item.productTitle}</h2>
                <p className="text-ink-muted mt-1 text-xs">
                  {item.variantTitle}
                  {item.sku ? ` · SKU ${item.sku}` : " · Sin SKU"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  item.tracked
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {item.tracked ? "Stock controlado" : "Sin seguimiento"}
              </span>
            </div>
            {item.tracked && item.levels.length ? (
              <div className="divide-forest/10 divide-y">
                {item.levels
                  .filter(
                    (level) =>
                      level.isActive &&
                      (locationId === "all" || level.locationId === locationId),
                  )
                  .map((level) => {
                    const key = inventoryKey(item.id, level.locationId);
                    const currentValue = values[key] ?? String(level.available);
                    return (
                      <div
                        className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                        key={level.id}
                      >
                        <div>
                          <p className="text-forest inline-flex items-center gap-2 font-bold">
                            <MapPin className="text-coral size-4" />
                            {level.locationName}
                          </p>
                          <p className="text-ink-muted mt-1 text-xs">
                            En almacén: {level.onHand} · Comprometidas:{" "}
                            {level.committed}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className="sr-only"
                            htmlFor={`quantity-${key}`}
                          >
                            Stock disponible en {level.locationName}
                          </label>
                          <input
                            className="border-forest/15 text-forest h-11 w-28 rounded-xl border px-3 text-center font-black"
                            id={`quantity-${key}`}
                            inputMode="numeric"
                            min={0}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            type="number"
                            value={currentValue}
                          />
                          <button
                            className="bg-forest inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-50"
                            disabled={busyKey === key}
                            onClick={() => updateQuantity(item, level)}
                            type="button"
                          >
                            {busyKey === key ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : null}
                            Guardar
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                <div>
                  <p className="text-forest font-bold">
                    Activar control de existencias
                  </p>
                  <p className="text-ink-muted mt-1 text-xs">
                    {selectedActivationLocation
                      ? `Cantidad inicial en ${selectedActivationLocation.name}`
                      : "No hay ninguna ubicación activa"}
                  </p>
                </div>
                {selectedActivationLocation ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      aria-label={`Cantidad inicial de ${item.productTitle}`}
                      className="border-forest/15 text-forest h-11 w-28 rounded-xl border px-3 text-center font-black"
                      inputMode="numeric"
                      min={0}
                      onChange={(event) => {
                        const key = inventoryKey(
                          item.id,
                          selectedActivationLocation.id,
                        );
                        setValues((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }));
                      }}
                      type="number"
                      value={
                        values[
                          inventoryKey(item.id, selectedActivationLocation.id)
                        ] ?? "0"
                      }
                    />
                    <button
                      className="bg-forest inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-50"
                      disabled={
                        busyKey ===
                        inventoryKey(item.id, selectedActivationLocation.id)
                      }
                      onClick={() => activateTracking(item)}
                      type="button"
                    >
                      {busyKey ===
                      inventoryKey(item.id, selectedActivationLocation.id) ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      Activar
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        ))}
        {!visibleItems.length ? (
          <Card className="p-8 text-center">
            <Search className="text-coral mx-auto size-8" />
            <p className="text-forest mt-4 font-black">No hay coincidencias</p>
            <p className="text-ink-muted mt-2 text-sm">
              Prueba con otro nombre, SKU o ubicación.
            </p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "green",
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  tone?: "green" | "amber" | "red";
}) {
  const color =
    tone === "red"
      ? "bg-red-50 text-red-800"
      : tone === "amber"
        ? "bg-amber-50 text-amber-900"
        : "bg-sage/55 text-forest";
  return (
    <Card className="p-5">
      <div className={`inline-flex rounded-2xl p-2.5 ${color}`}>
        <Icon className="size-5" />
      </div>
      <strong className="text-forest mt-4 block text-3xl font-black">
        {value}
      </strong>
      <span className="text-ink-muted text-sm font-bold">{label}</span>
    </Card>
  );
}
