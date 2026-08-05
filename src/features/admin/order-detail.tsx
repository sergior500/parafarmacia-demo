"use client";

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RotateCcw,
  Send,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  canViewOrder,
  type OrderStatus,
  orderStatusLabels,
} from "@/domain/order/order";
import { useDemo } from "@/features/demo/demo-provider";
import { formatDate, formatMoney } from "@/lib/format";

export function OrderDetail({ orderId }: { orderId: string }) {
  const { orders, role, transitionOrder, addOrderNote } = useDemo();
  const order = orders.find((item) => item.id === orderId);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <Card className="p-8">
        <h1 className="font-display text-forest text-3xl">
          Pedido no encontrado
        </h1>
        <Button asChild className="mt-5">
          <Link href="/admin/pedidos">Volver a pedidos</Link>
        </Button>
      </Card>
    );
  }

  if (!canViewOrder(role)) {
    return (
      <Card className="p-8">
        <h1 className="font-display text-forest text-3xl">
          No tienes acceso a este pedido
        </h1>
        <p className="text-ink-muted mt-3">
          Los perfiles de catálogo y administración técnica no consultan datos
          personales de clientes.
        </p>
      </Card>
    );
  }

  const orderManagementAllowed = role === "owner" || role === "order_manager";
  const refundAllowed = role === "owner" || role === "customer_support";

  async function perform(to: OrderStatus, reasonRequired = false) {
    setFeedback("");
    if (reasonRequired && !reason.trim()) {
      setFeedback("Indica un motivo para completar esta acción.");
      return;
    }
    setBusy(true);
    try {
      await transitionOrder(orderId, to, reason, note);
      setFeedback("Acción registrada en la auditoría.");
      setReason("");
      setNote("");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No se pudo realizar la acción.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setFeedback("");
    setBusy(true);
    try {
      await addOrderNote(orderId, note);
      setFeedback("Nota interna registrada.");
      setNote("");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canCancel = ["confirmed", "preparing"].includes(order.status);
  const canRefund = ["shipped", "delivered"].includes(order.status);

  return (
    <>
      <Link
        className="text-coral inline-flex items-center gap-2 text-sm font-bold"
        href="/admin/pedidos"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a pedidos
      </Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pedido de demostración</p>
          <h1 className="display-title text-forest mt-2 text-5xl">
            {order.reference}
          </h1>
          <p className="text-ink-muted mt-2 text-sm">
            Creado el {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="bg-sage text-forest rounded-full px-4 py-2 text-sm font-black">
          {orderStatusLabels[order.status]}
        </span>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_23rem]">
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="font-display text-forest text-3xl">
              Productos y cantidades
            </h2>
            <div className="divide-forest/10 mt-5 divide-y">
              {order.lines.map((line) => (
                <div
                  className="flex items-center justify-between gap-4 py-4"
                  key={line.product.id}
                >
                  <div>
                    <p className="text-forest font-bold">{line.product.name}</p>
                    <p className="text-ink-muted text-sm">
                      {line.quantity} × {formatMoney(line.product.priceInCents)}
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatMoney(line.product.priceInCents * line.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <dl className="border-forest/10 mt-4 ml-auto grid max-w-xs gap-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Base</dt>
                <dd>{formatMoney(order.subtotalInCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Impuestos</dt>
                <dd>{formatMoney(order.taxInCents)}</dd>
              </div>
              <div className="text-forest flex justify-between text-lg font-black">
                <dt>Total</dt>
                <dd>{formatMoney(order.totalInCents)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-forest text-3xl">
              Datos del cliente ficticio
            </h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Nombre</dt>
                <dd className="font-bold">
                  {order.customer.firstName} {order.customer.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Contacto</dt>
                <dd className="font-bold">
                  {order.customer.email}
                  <br />
                  {order.customer.phone}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Dirección ficticia</dt>
                <dd className="font-bold">
                  {order.customer.address}, {order.customer.postalCode}{" "}
                  {order.customer.city}, {order.customer.province}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-forest text-3xl">
              Historial y auditoría
            </h2>
            <ol className="mt-6 grid gap-5">
              {order.auditTrail.toReversed().map((entry) => (
                <li className="relative flex gap-4" key={entry.id}>
                  <span className="bg-sage text-forest grid size-9 shrink-0 place-items-center rounded-full">
                    <Clock3 aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="text-forest font-bold">
                      {entry.action === "note_added"
                        ? "Nota interna añadida"
                        : `${entry.previousStatus ? orderStatusLabels[entry.previousStatus] : "Inicio"} → ${orderStatusLabels[entry.newStatus]}`}
                    </p>
                    <p className="text-ink-muted text-xs">
                      {formatDate(entry.createdAt)} · {entry.userName}
                    </p>
                    {entry.reason ? (
                      <p className="bg-cream-dark mt-2 rounded-xl p-3 text-sm">
                        {entry.reason}
                      </p>
                    ) : null}
                    {entry.internalNote ? (
                      <p className="text-ink-muted mt-2 text-sm">
                        Nota: {entry.internalNote}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-28 p-6">
            <h2 className="font-display text-forest text-3xl">
              Gestionar pedido
            </h2>
            {!orderManagementAllowed &&
            ["confirmed", "preparing", "shipped"].includes(order.status) ? (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Este perfil puede consultar el pedido, pero no gestionar su
                preparación o envío.
              </p>
            ) : null}

            {order.status === "confirmed" ? (
              <Button
                className="mt-5 w-full"
                data-testid="start-preparation"
                disabled={busy || !orderManagementAllowed}
                onClick={() => perform("preparing")}
              >
                <PackageCheck aria-hidden="true" className="size-4" />
                Iniciar preparación
              </Button>
            ) : null}

            {order.status === "preparing" ? (
              <Button
                className="mt-5 w-full"
                data-testid="ship-order"
                disabled={busy || !orderManagementAllowed}
                onClick={() => perform("shipped")}
              >
                <Truck aria-hidden="true" className="size-4" />
                Marcar como enviado
              </Button>
            ) : null}

            {order.status === "shipped" ? (
              <Button
                className="mt-5 w-full"
                data-testid="deliver-order"
                disabled={busy || !orderManagementAllowed}
                onClick={() => perform("delivered")}
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Marcar como entregado
              </Button>
            ) : null}

            {canCancel || canRefund ? (
              <div className="border-forest/10 mt-6 border-t pt-5">
                <label>
                  <span className="field-label">
                    Motivo de {canCancel ? "cancelación" : "reembolso"}
                  </span>
                  <Textarea
                    placeholder="Obligatorio para completar la acción"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                {canCancel ? (
                  <Button
                    className="mt-3 w-full"
                    data-testid="cancel-order"
                    disabled={busy || !orderManagementAllowed}
                    variant="danger"
                    onClick={() => perform("cancelled", true)}
                  >
                    <Ban aria-hidden="true" className="size-4" />
                    Cancelar pedido
                  </Button>
                ) : (
                  <Button
                    className="mt-3 w-full"
                    data-testid="refund-order"
                    disabled={busy || !refundAllowed}
                    variant="outline"
                    onClick={() => perform("refunded", true)}
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Registrar reembolso
                  </Button>
                )}
              </div>
            ) : null}

            <div className="border-forest/10 mt-7 border-t pt-6">
              <label>
                <span className="field-label">Nota interna</span>
                <Textarea
                  placeholder="Visible solo en el panel demo"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <Button
                className="mt-3 w-full"
                disabled={busy || !note.trim()}
                variant="secondary"
                onClick={saveNote}
              >
                <Send aria-hidden="true" className="size-4" />
                Añadir nota
              </Button>
            </div>
            {feedback ? (
              <p
                className="bg-cream-dark mt-4 rounded-xl p-3 text-sm"
                role="status"
              >
                {feedback}
              </p>
            ) : null}
          </Card>
        </aside>
      </div>
    </>
  );
}
