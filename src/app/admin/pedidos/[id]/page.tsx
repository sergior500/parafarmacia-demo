import {
  ArrowLeft,
  CircleAlert,
  Clock3,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { CancelOrderForm } from "@/features/admin/cancel-order-form";
import { FulfillOrderForm } from "@/features/admin/fulfill-order-form";
import {
  financialStatusLabel,
  formatShopifyDate,
  formatShopifyMoney,
  fulfillmentStatusLabel,
} from "@/features/admin/shopify-order-format";
import {
  hasAdminCapability,
  requireAdminCapability,
} from "@/server/admin-auth";
import {
  canCancelShopifyOrder,
  canFulfillShopifyOrder,
  getShopifyOrder,
  orderHasCapturedPayment,
} from "@/server/shopify/orders";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const actor = await requireAdminCapability(
    "orders:read",
    `/admin/pedidos/${id}`,
  );

  let order;
  try {
    order = await getShopifyOrder(id);
  } catch (error) {
    return (
      <>
        <BackToOrders />
        <Card className="mt-6 border-red-200 bg-red-50 p-7 md:p-10">
          <CircleAlert className="size-8 text-red-700" />
          <h1 className="mt-5 text-2xl font-black text-red-900">
            No se pudo consultar este pedido
          </h1>
          <p className="mt-3 text-sm text-red-800">
            {error instanceof Error
              ? error.message
              : "Shopify no ha devuelto la información del pedido."}
          </p>
        </Card>
      </>
    );
  }
  if (!order) notFound();

  return (
    <>
      <BackToOrders />
      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Pedido de Shopify</p>
          <h1 className="display-title text-forest mt-2 text-5xl">
            {order.name}
          </h1>
          <p className="text-ink-muted mt-2 inline-flex items-center gap-2 text-sm">
            <Clock3 className="size-4" /> {formatShopifyDate(order.createdAt)}
          </p>
        </div>
        <strong className="text-forest text-3xl font-black">
          {formatShopifyMoney(order.amount, order.currencyCode)}
        </strong>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-forest/10 bg-sage/45 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
              <div>
                <p className="eyebrow">Contenido</p>
                <h2 className="text-forest mt-1 text-xl font-black">
                  Productos del pedido
                </h2>
              </div>
              <span className="text-ink-muted text-xs font-bold">
                {order.itemCount} unidades
              </span>
            </div>
            <div className="divide-forest/10 divide-y">
              {order.lineItems.map((item) => (
                <div
                  className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7"
                  key={item.id}
                >
                  <div>
                    <strong className="text-forest block">{item.name}</strong>
                    <span className="text-ink-muted text-xs">
                      {item.variantTitle ? `${item.variantTitle} · ` : ""}
                      {item.sku ? `SKU ${item.sku} · ` : ""}
                      {item.quantity} ×{" "}
                      {formatShopifyMoney(item.unitPrice, order.currencyCode)}
                    </span>
                  </div>
                  <strong className="text-forest">
                    {formatShopifyMoney(item.total, order.currencyCode)}
                  </strong>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <ReceiptText className="text-coral size-6" />
              <h2 className="text-forest text-xl font-black">
                Resumen económico
              </h2>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              {[
                ["Subtotal", order.subtotal],
                ["Descuentos", -order.discounts],
                ["Envío", order.shipping],
                ["Impuestos incluidos", order.taxes],
              ].map(([label, amount]) => (
                <div className="flex justify-between gap-4" key={String(label)}>
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-forest font-bold">
                    {formatShopifyMoney(Number(amount), order.currencyCode)}
                  </dd>
                </div>
              ))}
              <div className="border-forest/10 flex justify-between gap-4 border-t pt-4 text-base">
                <dt className="text-forest font-black">Total actual</dt>
                <dd className="text-forest font-black">
                  {formatShopifyMoney(order.amount, order.currencyCode)}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <PackageCheck className="text-forest size-7" />
            <h2 className="text-forest mt-4 text-xl font-black">Estado</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-ink-muted text-xs font-bold uppercase">
                  Pago
                </dt>
                <dd className="text-forest mt-1 font-black">
                  {financialStatusLabel(order.financialStatus)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted text-xs font-bold uppercase">
                  Preparación
                </dt>
                <dd className="text-forest mt-1 font-black">
                  {fulfillmentStatusLabel(order.fulfillmentStatus)}
                </dd>
              </div>
              {order.cancelled ? (
                <div className="rounded-2xl bg-red-50 p-4 text-red-800">
                  <strong className="block">Pedido cancelado</strong>
                  {order.cancelReason ? (
                    <span className="mt-1 block text-xs">
                      Motivo: {order.cancelReason}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </dl>
          </Card>

          {canFulfillShopifyOrder(order) ? (
            <FulfillOrderForm
              fulfillmentOrders={order.fulfillmentOrders}
              orderId={order.legacyId}
            />
          ) : null}

          {hasAdminCapability(actor, "orders:cancel") &&
          canCancelShopifyOrder(order) ? (
            <CancelOrderForm
              orderId={order.legacyId}
              orderName={order.name}
              requiresRefund={orderHasCapturedPayment(order)}
            />
          ) : null}

          {!order.cancelled &&
          !order.fullyPaid &&
          order.fulfillmentOrders.length ? (
            <Card className="border-amber-200 bg-amber-50 p-6 text-amber-950">
              <CircleAlert className="size-6" />
              <h2 className="mt-3 font-black">Envío bloqueado</h2>
              <p className="mt-2 text-sm leading-6">
                El pago aún no está confirmado. El panel habilitará la
                preparación cuando Shopify indique que el pedido está pagado.
              </p>
            </Card>
          ) : null}

          <Card className="p-6">
            <UserRound className="text-coral size-7" />
            <h2 className="text-forest mt-4 text-xl font-black">Cliente</h2>
            <p className="text-forest mt-4 font-bold">{order.customerName}</p>
            <div className="text-ink-muted mt-3 space-y-2 text-sm">
              {order.customerEmail ? (
                <p className="flex items-start gap-2 break-all">
                  <Mail className="mt-0.5 size-4 shrink-0" />{" "}
                  {order.customerEmail}
                </p>
              ) : null}
              {order.phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4" /> {order.phone}
                </p>
              ) : null}
            </div>
          </Card>

          {order.address ? (
            <Card className="p-6">
              <MapPin className="text-coral size-7" />
              <h2 className="text-forest mt-4 text-xl font-black">Entrega</h2>
              <address className="text-ink-muted mt-4 text-sm leading-6 not-italic">
                {order.address.name ? (
                  <strong className="text-forest block">
                    {order.address.name}
                  </strong>
                ) : null}
                {order.address.lines.map((line) => (
                  <span className="block" key={line}>
                    {line}
                  </span>
                ))}
                {order.address.phone ? (
                  <span className="mt-2 block">{order.address.phone}</span>
                ) : null}
              </address>
            </Card>
          ) : null}

          {order.note ? (
            <Card className="p-6">
              <h2 className="text-forest font-black">Nota del pedido</h2>
              <p className="text-ink-muted mt-3 text-sm leading-6">
                {order.note}
              </p>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function BackToOrders() {
  return (
    <Link
      className="text-coral inline-flex items-center gap-2 text-sm font-bold"
      href="/admin/pedidos"
    >
      <ArrowLeft className="size-4" /> Volver a pedidos
    </Link>
  );
}
