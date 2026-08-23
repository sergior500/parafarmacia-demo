"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ShopifyOrderSummary } from "@/server/shopify/orders";

import {
  financialStatusLabel,
  formatShopifyDate,
  formatShopifyMoney,
  fulfillmentStatusLabel,
} from "./shopify-order-format";

type OrderFilter = "all" | "prepare" | "paid" | "cancelled";

function matchesFilter(order: ShopifyOrderSummary, filter: OrderFilter) {
  if (filter === "cancelled") return order.cancelled;
  if (filter === "paid") return !order.cancelled && order.fullyPaid;
  if (filter === "prepare") {
    return (
      !order.cancelled &&
      order.fullyPaid &&
      !["FULFILLED", "RESTOCKED"].includes(order.fulfillmentStatus)
    );
  }
  return true;
}

function statusClasses(order: ShopifyOrderSummary) {
  if (order.cancelled) return "bg-red-100 text-red-800";
  if (order.fulfillmentStatus === "FULFILLED") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (!order.fullyPaid) return "bg-amber-100 text-amber-900";
  return "bg-sky-100 text-sky-800";
}

function statusLabel(order: ShopifyOrderSummary) {
  if (order.cancelled) return "Cancelado";
  if (order.fulfillmentStatus === "FULFILLED") return "Enviado";
  if (!order.fullyPaid) {
    return financialStatusLabel(order.financialStatus);
  }
  return fulfillmentStatusLabel(order.fulfillmentStatus);
}

export function ShopifyOrdersList({
  orders,
}: {
  orders: ShopifyOrderSummary[];
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        const haystack =
          `${order.name} ${order.customerName} ${order.customerEmail ?? ""} ${order.destination}`.toLocaleLowerCase(
            "es",
          );
        return (
          matchesFilter(order, filter) &&
          (!normalizedQuery || haystack.includes(normalizedQuery))
        );
      }),
    [filter, normalizedQuery, orders],
  );
  const filters: Array<{ id: OrderFilter; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "prepare", label: "Por preparar" },
    { id: "paid", label: "Pagados" },
    { id: "cancelled", label: "Cancelados" },
  ];

  return (
    <>
      <div className="border-forest/10 grid gap-4 border-b p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="border-forest/15 flex min-h-11 items-center gap-3 rounded-2xl border bg-white px-4">
          <Search className="text-ink-muted size-4" />
          <span className="sr-only">Buscar pedido</span>
          <input
            className="text-forest min-w-0 flex-1 bg-transparent text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pedido, cliente, email o destino"
            type="search"
            value={query}
          />
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar pedidos"
        >
          {filters.map((item) => (
            <button
              className={`min-h-10 rounded-full px-4 text-xs font-black transition-colors ${
                filter === item.id
                  ? "bg-forest text-white"
                  : "border-forest/15 text-forest hover:bg-sage border bg-white"
              }`}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-forest/10 divide-y">
        {visibleOrders.map((order) => (
          <article
            className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.1fr_1fr_auto_auto] lg:items-center"
            key={order.id}
          >
            <div>
              <strong className="text-forest block">{order.name}</strong>
              <span className="text-ink-muted text-xs">
                {formatShopifyDate(order.createdAt)} · {order.itemCount} uds.
              </span>
            </div>
            <div>
              <strong className="text-forest block text-sm">
                {order.customerName}
              </strong>
              <span className="text-ink-muted text-xs">
                {order.destination}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${statusClasses(order)}`}
              >
                {statusLabel(order)}
              </span>
              <strong className="text-forest lg:mt-2 lg:block">
                {formatShopifyMoney(order.amount, order.currencyCode)}
              </strong>
            </div>
            <Link
              className="text-coral inline-flex min-h-10 items-center justify-center gap-1 rounded-full font-bold lg:px-3"
              href={`/admin/pedidos/${order.legacyId}`}
            >
              Abrir <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
        {visibleOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="text-coral mx-auto size-7" />
            <p className="text-forest mt-3 font-black">No hay coincidencias</p>
            <p className="text-ink-muted mt-1 text-sm">
              Cambia el filtro o prueba con otra búsqueda.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
