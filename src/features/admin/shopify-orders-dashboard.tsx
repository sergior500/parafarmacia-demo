import {
  ArrowRight,
  BadgeEuro,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type {
  ShopifyOrdersReport,
  ShopifyOrderSummary,
} from "@/server/shopify/orders";

const financialLabels: Record<string, string> = {
  AUTHORIZED: "Autorizado",
  EXPIRED: "Caducado",
  PAID: "Pagado",
  PARTIALLY_PAID: "Pago parcial",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  PENDING: "Pago pendiente",
  REFUNDED: "Reembolsado",
  VOIDED: "Anulado",
  UNKNOWN: "Sin información",
};

const fulfillmentLabels: Record<string, string> = {
  FULFILLED: "Enviado",
  IN_PROGRESS: "En preparación",
  ON_HOLD: "En espera",
  OPEN: "Por preparar",
  PARTIALLY_FULFILLED: "Envío parcial",
  PENDING_FULFILLMENT: "Preparación pendiente",
  REQUEST_DECLINED: "Preparación rechazada",
  RESTOCKED: "Repuesto",
  SCHEDULED: "Programado",
  UNFULFILLED: "Por preparar",
};

export function formatShopifyMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function formatShopifyDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export function financialStatusLabel(status: string) {
  return financialLabels[status] ?? status;
}

export function fulfillmentStatusLabel(status: string) {
  return fulfillmentLabels[status] ?? status;
}

function financialTone(status: string) {
  if (["PAID", "PARTIALLY_PAID"].includes(status)) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (["REFUNDED", "VOIDED", "EXPIRED"].includes(status)) {
    return "bg-stone-100 text-stone-700";
  }
  return "bg-amber-100 text-amber-800";
}

function fulfillmentTone(status: string) {
  if (status === "FULFILLED") return "bg-emerald-100 text-emerald-800";
  if (["IN_PROGRESS", "PARTIALLY_FULFILLED"].includes(status)) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-amber-100 text-amber-800";
}

function OrderStatus({ order }: { order: ShopifyOrderSummary }) {
  if (order.cancelled) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-800">
        Cancelado
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${financialTone(order.financialStatus)}`}
      >
        {financialStatusLabel(order.financialStatus)}
      </span>
      <span
        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${fulfillmentTone(order.fulfillmentStatus)}`}
      >
        {fulfillmentStatusLabel(order.fulfillmentStatus)}
      </span>
    </div>
  );
}

export function ShopifyOrdersDashboard({
  report,
}: {
  report: ShopifyOrdersReport;
}) {
  const metrics = [
    {
      label: "Ventas hoy",
      value: formatShopifyMoney(report.metrics.todaySales, report.currencyCode),
      detail: "Pagos capturados",
      icon: BadgeEuro,
      tone: "bg-[#dff1e9] text-[#1d806d]",
    },
    {
      label: "Esta semana",
      value: formatShopifyMoney(report.metrics.weekSales, report.currencyCode),
      detail: "Desde el lunes",
      icon: TrendingUp,
      tone: "bg-[#e7eef8] text-[#3d6fa8]",
    },
    {
      label: "Este mes",
      value: formatShopifyMoney(report.metrics.monthSales, report.currencyCode),
      detail: `${report.metrics.monthOrders} pedidos`,
      icon: CalendarDays,
      tone: "bg-[#f0e9f7] text-[#7b5aa6]",
    },
    {
      label: "Por preparar",
      value: String(report.metrics.pendingPreparation),
      detail: "Pedidos no completados",
      icon: PackageCheck,
      tone: "bg-[#fff0e7] text-[#c7653c]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card className="p-5" key={label}>
            <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <strong className="text-forest mt-5 block text-3xl font-black tracking-[-0.04em]">
              {value}
            </strong>
            <p className="text-ink-muted mt-1 text-sm">{label}</p>
            <p className="text-ink-muted mt-3 text-xs font-bold">{detail}</p>
          </Card>
        ))}
      </section>

      {report.orders.length === 0 ? (
        <Card className="p-7 md:p-10">
          <span className="bg-sage text-forest grid size-12 place-items-center rounded-2xl">
            <CheckCircle2 className="size-6" />
          </span>
          <h2 className="font-display text-forest mt-6 text-3xl">
            Conexión activa, todavía sin pedidos
          </h2>
          <p className="text-ink-muted mt-3 max-w-2xl leading-7">
            El panel ya está leyendo Shopify. Cuando llegue la primera compra,
            aparecerán aquí el importe, el pago, la preparación y los productos
            vendidos sin tener que configurar nada más.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <Card className="overflow-hidden">
            <div className="border-forest/10 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
              <div>
                <p className="eyebrow">Actividad reciente</p>
                <h2 className="text-forest mt-1 text-xl font-black">
                  Últimos pedidos
                </h2>
              </div>
              <span className="text-ink-muted text-xs font-bold">
                {report.orders.length} recuperados
              </span>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-sage/60 text-forest">
                  <tr>
                    <th className="px-5 py-4">Pedido</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4 text-right">Total</th>
                    <th className="px-5 py-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((order) => (
                    <tr className="border-forest/10 border-t" key={order.id}>
                      <td className="px-5 py-4">
                        <strong className="text-forest block">{order.name}</strong>
                        <span className="text-ink-muted text-xs">
                          {formatShopifyDate(order.createdAt)} · {order.itemCount}{" "}
                          uds.
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <strong className="text-forest block text-xs">
                          {order.customerName}
                        </strong>
                        <span className="text-ink-muted text-xs">
                          {order.destination}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatus order={order} />
                      </td>
                      <td className="px-5 py-4 text-right font-black">
                        {formatShopifyMoney(order.amount, order.currencyCode)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          className="text-coral inline-flex items-center gap-1 font-bold"
                          href={`/admin/pedidos/${order.legacyId}`}
                        >
                          Abrir <ArrowRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-forest/10 divide-y md:hidden">
              {report.orders.map((order) => (
                <article className="p-5" key={order.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <strong className="text-forest block">{order.name}</strong>
                      <span className="text-ink-muted text-xs">
                        {formatShopifyDate(order.createdAt)}
                      </span>
                    </div>
                    <strong className="text-forest">
                      {formatShopifyMoney(order.amount, order.currencyCode)}
                    </strong>
                  </div>
                  <p className="text-ink-muted mt-3 text-sm">
                    {order.customerName} · {order.itemCount} uds.
                  </p>
                  <div className="mt-3">
                    <OrderStatus order={order} />
                  </div>
                  <Link
                    className="text-coral mt-4 inline-flex items-center gap-1 text-sm font-bold"
                    href={`/admin/pedidos/${order.legacyId}`}
                  >
                    Ver pedido <ArrowRight className="size-4" />
                  </Link>
                </article>
              ))}
            </div>
          </Card>

          <Card className="h-fit p-6">
            <span className="bg-coral-light text-coral grid size-11 place-items-center rounded-xl">
              <Sparkles className="size-5" />
            </span>
            <p className="eyebrow mt-6">Productos destacados</p>
            <h2 className="font-display text-forest mt-2 text-3xl">
              Más vendidos
            </h2>
            {report.topProducts.length ? (
              <ol className="mt-5 space-y-3">
                {report.topProducts.map((product, index) => (
                  <li
                    className="border-forest/10 flex items-center gap-3 border-b pb-3 last:border-0"
                    key={product.name}
                  >
                    <span className="bg-sage text-forest grid size-8 shrink-0 place-items-center rounded-full text-xs font-black">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <strong className="text-forest block truncate text-sm">
                        {product.name}
                      </strong>
                      <span className="text-ink-muted text-xs">
                        {product.quantity} unidades
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-ink-muted mt-4 text-sm">
                Aparecerán cuando existan ventas.
              </p>
            )}
          </Card>
        </div>
      )}

      <div className="border-forest/10 bg-cream text-ink-muted flex flex-col gap-2 rounded-2xl border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="size-4" /> Datos leídos en tiempo real desde Shopify
        </span>
        <span>
          Ventana disponible: últimos {report.periodDays} días
          {report.hasMore ? " · Hay más pedidos fuera de esta vista" : ""}
        </span>
      </div>
    </div>
  );
}
