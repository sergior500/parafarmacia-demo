"use client";

import {
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  PauseCircle,
  PlayCircle,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import type { ShopifyDiscountSummary } from "@/server/shopify/discounts";

import { formatShopifyDate } from "./shopify-order-format";

export function DiscountsManager({
  discounts,
  canWrite,
}: {
  discounts: ShopifyDiscountSummary[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [changingId, setChangingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function createDiscount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError("");
    setSuccess("");
    const form = new FormData(formElement);
    const rawEnd = String(form.get("endsAt") ?? "");
    try {
      const response = await secureAdminFetch("/api/admin/discounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationId: crypto.randomUUID(),
          title: String(form.get("title") ?? ""),
          code: String(form.get("code") ?? "").toUpperCase(),
          kind: String(form.get("kind") ?? "percentage"),
          value: Number(form.get("value")),
          endsAt: rawEnd ? new Date(rawEnd).toISOString() : undefined,
          usageLimit: form.get("usageLimit")
            ? Number(form.get("usageLimit"))
            : undefined,
          appliesOncePerCustomer: form.get("once") === "on",
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "No se pudo crear.");
      formElement.reset();
      setSuccess("Promoción creada en Shopify.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo crear la promoción.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(discount: ShopifyDiscountSummary) {
    const active = discount.status !== "ACTIVE";
    setChangingId(discount.id);
    setError("");
    setSuccess("");
    try {
      const response = await secureAdminFetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationId: crypto.randomUUID(),
          discountId: discount.id,
          active,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo cambiar el estado.");
      }
      setSuccess(active ? "Promoción activada." : "Promoción pausada.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cambiar la promoción.",
      );
    } finally {
      setChangingId("");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[23rem_1fr]">
      {canWrite ? (
        <Card className="h-fit p-6">
          <BadgePercent className="text-coral size-7" />
          <h2 className="text-forest mt-4 text-2xl font-black">Crear código</h2>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Descuento general con límites claros. No se combina con otras
            promociones.
          </p>
          <form className="mt-6 space-y-4" onSubmit={createDiscount}>
            <Field label="Nombre interno">
              <input
                className="admin-input"
                maxLength={80}
                minLength={3}
                name="title"
                placeholder="Campaña septiembre"
                required
              />
            </Field>
            <Field label="Código para el cliente">
              <input
                className="admin-input uppercase"
                maxLength={32}
                minLength={3}
                name="code"
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}"
                placeholder="PICUAL10"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select className="admin-input" name="kind">
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Importe fijo</option>
                </select>
              </Field>
              <Field label="Valor">
                <input
                  className="admin-input"
                  max="10000"
                  min="0.01"
                  name="value"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
            </div>
            <Field label="Finaliza (opcional)">
              <input
                className="admin-input"
                name="endsAt"
                type="datetime-local"
              />
            </Field>
            <Field label="Usos máximos (opcional)">
              <input
                className="admin-input"
                max="1000000"
                min="1"
                name="usageLimit"
                type="number"
              />
            </Field>
            <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
              <input
                className="accent-forest mt-0.5 size-4"
                name="once"
                type="checkbox"
              />
              Un solo uso por cliente
            </label>
            <button
              className="bg-forest inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Crear promoción
            </button>
          </form>
        </Card>
      ) : null}

      <Card className="h-fit overflow-hidden">
        <div className="border-forest/10 border-b p-5 sm:p-6">
          <p className="eyebrow">Códigos de Shopify</p>
          <h2 className="text-forest mt-1 text-2xl font-black">
            Promociones configuradas
          </h2>
        </div>
        {(error || success) && (
          <div className="border-forest/10 border-b p-4">
            {error ? (
              <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="size-4" />
                {success}
              </p>
            ) : null}
          </div>
        )}
        <div className="divide-forest/10 divide-y">
          {discounts.map((discount) => (
            <article
              className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"
              key={discount.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-forest">{discount.title}</strong>
                  <code className="bg-sage/60 text-forest rounded-lg px-2 py-1 text-xs font-black">
                    {discount.code}
                  </code>
                </div>
                <p className="text-ink-muted mt-2 text-sm">
                  {discount.summary}
                </p>
                <p className="text-ink-muted mt-2 flex items-center gap-2 text-xs">
                  <CalendarClock className="size-3.5" /> Desde{" "}
                  {formatShopifyDate(discount.startsAt)}
                  {discount.endsAt
                    ? ` · hasta ${formatShopifyDate(discount.endsAt)}`
                    : " · sin fecha final"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${discount.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}
                >
                  {discount.status === "ACTIVE"
                    ? "Activa"
                    : discount.status === "SCHEDULED"
                      ? "Programada"
                      : "Inactiva"}
                </span>
                {canWrite ? (
                  <button
                    aria-label={
                      discount.status === "ACTIVE"
                        ? `Pausar ${discount.title}`
                        : `Activar ${discount.title}`
                    }
                    className="border-forest/15 text-forest hover:bg-sage inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs font-black disabled:opacity-50"
                    disabled={changingId === discount.id}
                    onClick={() => changeStatus(discount)}
                    type="button"
                  >
                    {changingId === discount.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : discount.status === "ACTIVE" ? (
                      <PauseCircle className="size-4" />
                    ) : (
                      <PlayCircle className="size-4" />
                    )}
                    {discount.status === "ACTIVE" ? "Pausar" : "Activar"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {discounts.length === 0 ? (
            <div className="p-10 text-center">
              <BadgePercent className="text-coral mx-auto size-8" />
              <p className="text-forest mt-3 font-black">
                Todavía no hay promociones
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                Crea el primer código desde este panel.
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-forest text-xs font-black tracking-wider uppercase">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
