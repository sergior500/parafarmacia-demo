"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  canViewOrder,
  type OrderStatus,
  orderStatusLabels,
} from "@/domain/order/order";
import { useDemo } from "@/features/demo/demo-provider";
import { formatDate, formatMoney } from "@/lib/format";

export function OrdersTable() {
  const { orders, role } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");

  const filtered = useMemo(
    () =>
      orders
        .filter(() => canViewOrder(role))
        .filter((order) =>
          query
            ? order.reference.toLowerCase().includes(query.toLowerCase())
            : true,
        )
        .filter((order) => (status ? order.status === status : true)),
    [orders, query, role, status],
  );

  if (!canViewOrder(role)) {
    return (
      <Card className="p-8">
        <p className="font-display text-forest text-3xl">
          Este rol no puede consultar pedidos
        </p>
        <p className="text-ink-muted mt-2">
          Los perfiles de catálogo y técnica no acceden a datos de clientes.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 rounded-3xl bg-white p-5 md:grid-cols-[1fr_18rem]">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-ink-muted absolute top-3.5 left-4 size-4"
          />
          <Input
            className="pl-11"
            placeholder="Buscar por referencia"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar pedidos por estado"
          className="border-forest/20 focus:ring-sage min-h-11 rounded-xl border bg-white px-4 text-sm outline-none focus:ring-3"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as OrderStatus | "")
          }
        >
          <option value="">Todos los estados</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead className="bg-sage/60 text-forest">
              <tr>
                <th className="px-5 py-4">Referencia</th>
                <th className="px-5 py-4">Cliente ficticio</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr className="border-forest/10 border-t" key={order.id}>
                  <td className="text-forest px-5 py-4 font-bold">
                    {order.reference}
                  </td>
                  <td className="px-5 py-4">
                    {order.customer.firstName} {order.customer.lastName}
                  </td>
                  <td className="text-ink-muted px-5 py-4">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-cream-dark text-forest rounded-full px-3 py-1 text-xs font-bold">
                      {orderStatusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold">
                    {formatMoney(order.totalInCents)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      className="text-coral font-bold underline underline-offset-4"
                      href={`/admin/pedidos/${order.id}`}
                    >
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <div className="border-forest/10 text-ink-muted border-t p-12 text-center">
            No hay pedidos para estos filtros y permisos.
          </div>
        ) : null}
      </Card>
    </>
  );
}
