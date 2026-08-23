import {
  BadgeEuro,
  CalendarDays,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatShopifyMoney } from "@/features/admin/shopify-order-format";
import { ShopifyOrdersList } from "@/features/admin/shopify-orders-list";
import type { ShopifyOrdersReport } from "@/server/shopify/orders";

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
            <span
              className={`grid size-10 place-items-center rounded-xl ${tone}`}
            >
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

            <ShopifyOrdersList orders={report.orders} />
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
          <Clock3 className="size-4" /> Datos leídos en tiempo real desde
          Shopify
        </span>
        <span>
          Ventana disponible: últimos {report.periodDays} días
          {report.hasMore ? " · Hay más pedidos fuera de esta vista" : ""}
        </span>
      </div>
    </div>
  );
}
