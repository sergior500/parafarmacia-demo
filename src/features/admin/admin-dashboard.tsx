"use client";

import {
  ArrowUpRight,
  Boxes,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { canViewOrder, orderStatusLabels } from "@/domain/order/order";
import { useDemo } from "@/features/demo/demo-provider";
import { formatDate, formatMoney } from "@/lib/format";
import { products } from "@/mocks/products";

const excludedFromSales = new Set(["draft", "cancelled", "refunded"]);

export function AdminDashboard() {
  const { orders, role } = useDemo();

  if (role === "technical_admin") {
    return (
      <Card className="p-8">
        <h2 className="font-display text-forest text-3xl">
          Área técnica restringida
        </h2>
        <p className="text-ink-muted mt-3 max-w-2xl">
          Este perfil gestiona integraciones y configuración, sin acceso a
          ventas ni datos de clientes.
        </p>
      </Card>
    );
  }

  const salesOrders = orders.filter(
    (order) => !excludedFromSales.has(order.status),
  );
  const referenceDate = new Date(
    Math.max(...orders.map((order) => new Date(order.createdAt).getTime())),
  );
  const weekStart = new Date(referenceDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  weekStart.setUTCHours(0, 0, 0, 0);
  const referenceMonth = referenceDate.toISOString().slice(0, 7);
  const weeklyOrders = salesOrders.filter(
    (order) => new Date(order.createdAt) >= weekStart,
  );
  const monthlyOrders = salesOrders.filter((order) =>
    order.createdAt.startsWith(referenceMonth),
  );
  const weeklySales = weeklyOrders.reduce(
    (total, order) => total + order.totalInCents,
    0,
  );
  const monthlySales = monthlyOrders.reduce(
    (total, order) => total + order.totalInCents,
    0,
  );
  const averageTicket = monthlyOrders.length
    ? Math.round(monthlySales / monthlyOrders.length)
    : 0;

  const productPerformance = new Map<
    string,
    { name: string; units: number; revenue: number }
  >();
  for (const order of monthlyOrders) {
    for (const line of order.lines) {
      const current = productPerformance.get(line.product.id) ?? {
        name: line.product.name,
        units: 0,
        revenue: 0,
      };
      current.units += line.quantity;
      current.revenue += line.product.priceInCents * line.quantity;
      productPerformance.set(line.product.id, current);
    }
  }
  const topProducts = [...productPerformance.values()]
    .toSorted((left, right) => right.units - left.units)
    .slice(0, 5);
  const topProduct = topProducts[0];
  const lowStock = products
    .filter((product) => product.status === "active" && product.stock <= 10)
    .toSorted((left, right) => left.stock - right.stock);

  const daySales = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      value: weeklyOrders
        .filter((order) => order.createdAt.startsWith(key))
        .reduce((total, order) => total + order.totalInCents, 0),
    };
  });
  const maxDaySales = Math.max(...daySales.map((day) => day.value), 1);
  const showOrderDetails = canViewOrder(role);

  const metrics = [
    {
      label: "Ventas esta semana",
      value: formatMoney(weeklySales),
      detail: `${weeklyOrders.length} pedidos`,
      icon: ShoppingBag,
      tone: "bg-[#dff1e9] text-[#1d806d]",
    },
    {
      label: "Ventas este mes",
      value: formatMoney(monthlySales),
      detail: `${monthlyOrders.length} pedidos`,
      icon: ReceiptText,
      tone: "bg-[#e7eef8] text-[#3d6fa8]",
    },
    {
      label: "Ticket medio",
      value: formatMoney(averageTicket),
      detail: "Periodo demo",
      icon: PackageCheck,
      tone: "bg-[#fff0e7] text-[#c7653c]",
    },
    {
      label: "Producto líder",
      value: topProduct?.name ?? "Sin datos",
      detail: topProduct ? `${topProduct.units} unidades` : "Periodo demo",
      icon: Boxes,
      tone: "bg-[#f0e9f7] text-[#7b5aa6]",
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card className="p-5" key={label}>
            <span
              className={`grid size-10 place-items-center rounded-xl ${tone}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <p className="text-forest mt-5 line-clamp-2 text-2xl font-black tracking-[-0.04em]">
              {value}
            </p>
            <p className="text-ink-muted mt-1 text-sm">{label}</p>
            <p className="text-ink-muted mt-3 text-xs font-bold">{detail}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Últimos siete días</p>
              <h2 className="font-display text-forest mt-2 text-3xl">
                Evolución de ventas
              </h2>
            </div>
            <strong className="text-forest text-xl">
              {formatMoney(weeklySales)}
            </strong>
          </div>
          <div className="mt-8 grid h-56 grid-cols-7 items-end gap-2 sm:gap-4">
            {daySales.map((day) => (
              <div
                className="grid h-full grid-rows-[1fr_auto] gap-3"
                key={day.key}
              >
                <div className="flex items-end">
                  <div
                    className="bg-forest hover:bg-forest-light w-full rounded-t-xl transition-colors"
                    style={{
                      height: `${Math.max(8, (day.value / maxDaySales) * 100)}%`,
                    }}
                    title={`${day.label}: ${formatMoney(day.value)}`}
                  />
                </div>
                <span className="text-ink-muted text-center text-[0.65rem] font-bold uppercase">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Inventario</p>
              <h2 className="font-display text-forest mt-2 text-3xl">
                Stock bajo
              </h2>
            </div>
            <span className="bg-coral-light text-coral grid size-10 place-items-center rounded-xl">
              <TriangleAlert aria-hidden="true" className="size-5" />
            </span>
          </div>
          <div className="mt-6 grid gap-3">
            {lowStock.map((product) => (
              <div
                className="border-forest/8 flex items-center justify-between gap-3 rounded-2xl border p-3"
                key={product.id}
              >
                <span className="min-w-0">
                  <strong className="text-forest block truncate text-sm">
                    {product.name}
                  </strong>
                  <span className="text-ink-muted text-xs">
                    {product.brandOrLaboratory}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-black text-amber-700">
                  {product.stock} ud.
                </span>
              </div>
            ))}
          </div>
          <Link
            className="text-coral mt-5 inline-flex items-center gap-1 text-sm font-bold"
            href="/admin/productos"
          >
            Ver inventario{" "}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-6 md:p-8">
          <p className="eyebrow">Rendimiento</p>
          <h2 className="font-display text-forest mt-2 text-3xl">
            Más vendidos
          </h2>
          <ol className="mt-6 grid gap-4">
            {topProducts.map((product, index) => (
              <li className="flex items-center gap-3" key={product.name}>
                <span className="bg-sage text-forest grid size-8 shrink-0 place-items-center rounded-full text-xs font-black">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="text-forest block truncate text-sm">
                    {product.name}
                  </strong>
                  <span className="text-ink-muted text-xs">
                    {formatMoney(product.revenue)}
                  </span>
                </span>
                <strong className="text-forest text-sm">
                  {product.units} ud.
                </strong>
              </li>
            ))}
          </ol>
        </Card>

        {showOrderDetails ? (
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Operación</p>
                <h2 className="font-display text-forest mt-2 text-3xl">
                  Pedidos recientes
                </h2>
              </div>
              <Link
                className="text-coral text-sm font-bold"
                href="/admin/pedidos"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-6 grid gap-3">
              {orders.slice(0, 5).map((order) => (
                <Link
                  className="border-forest/8 hover:bg-cream flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
                  href={`/admin/pedidos/${order.id}`}
                  key={order.id}
                >
                  <span>
                    <strong className="text-forest block">
                      {order.reference}
                    </strong>
                    <span className="text-ink-muted text-xs">
                      {formatDate(order.createdAt)} ·{" "}
                      {formatMoney(order.totalInCents)}
                    </span>
                  </span>
                  <span className="bg-sage text-forest rounded-full px-3 py-1 text-xs font-bold">
                    {orderStatusLabels[order.status]}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <h2 className="font-display text-forest text-3xl">
              Datos de clientes protegidos
            </h2>
            <p className="text-ink-muted mt-3 max-w-xl text-sm">
              El perfil de catálogo puede consultar rendimiento agregado sin
              acceder a pedidos individuales ni datos personales.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
