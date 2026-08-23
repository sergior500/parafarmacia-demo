"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import type { ShopifyOrderCancelReason } from "@/server/shopify/orders";

const REASONS: Array<{ value: ShopifyOrderCancelReason; label: string }> = [
  { value: "CUSTOMER", label: "Solicitud del cliente" },
  { value: "INVENTORY", label: "Falta de stock" },
  { value: "DECLINED", label: "Pago rechazado" },
  { value: "FRAUD", label: "Posible fraude" },
  { value: "STAFF", label: "Error del equipo" },
  { value: "OTHER", label: "Otro motivo" },
];

export function CancelOrderForm({
  orderId,
  orderName,
  requiresRefund,
}: {
  orderId: string;
  orderName: string;
  requiresRefund: boolean;
}) {
  const router = useRouter();
  const operationId = useRef("");
  const [reason, setReason] = useState<ShopifyOrderCancelReason>("CUSTOMER");
  const [staffNote, setStaffNote] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [restock, setRestock] = useState(true);
  const [confirmation, setConfirmation] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const ready =
    confirmed &&
    confirmation === orderName &&
    staffNote.trim().length >= 10 &&
    !submitting;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      setError(
        `Completa el motivo y escribe ${orderName} exactamente antes de cancelar.`,
      );
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      operationId.current ||= crypto.randomUUID();
      const response = await secureAdminFetch(
        `/api/admin/orders/${orderId}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            confirmed: true,
            operationId: operationId.current,
            confirmation,
            reason,
            staffNote,
            notifyCustomer,
            restock,
            refundOriginalPaymentMethods: requiresRefund,
          }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        result?: { alreadyCancelled?: boolean; job?: { done: boolean } };
      };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo cancelar el pedido.");
      }
      setSuccess(
        body.result?.alreadyCancelled
          ? "El pedido ya estaba cancelado."
          : body.result?.job?.done
            ? "Pedido cancelado correctamente."
            : "Shopify ha aceptado la cancelación. El estado se actualizará en unos segundos.",
      );
      operationId.current = "";
      setTimeout(() => router.refresh(), 1_500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo cancelar el pedido.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden border-red-200">
      <div className="bg-red-950 p-6 text-white">
        <CircleX className="size-7" />
        <h2 className="mt-4 text-xl font-black">Cancelar pedido</h2>
        <p className="mt-2 text-sm text-red-100/80">
          Acción irreversible sobre un pedido aún no enviado. No crea una
          devolución de producto.
        </p>
      </div>
      <form className="space-y-5 p-6" onSubmit={submit}>
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-950">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">
            {requiresRefund
              ? "Al cancelar se devolverá todo el importe cobrado al método de pago original."
              : "Shopify liberará cualquier autorización de pago pendiente."}
          </p>
        </div>

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Motivo
          </span>
          <select
            className="border-forest/15 text-forest mt-2 min-h-11 w-full rounded-xl border bg-white px-3 text-sm"
            onChange={(event) =>
              setReason(event.target.value as ShopifyOrderCancelReason)
            }
            value={reason}
          >
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Nota interna
          </span>
          <textarea
            className="border-forest/15 text-forest mt-2 min-h-24 w-full rounded-xl border px-3 py-3 text-sm"
            maxLength={255}
            minLength={10}
            onChange={(event) => setStaffNote(event.target.value)}
            placeholder="Explica quién solicita la cancelación y por qué."
            required
            value={staffNote}
          />
          <span className="text-ink-muted mt-1 block text-xs">
            Solo será visible para el equipo. {staffNote.length}/255
          </span>
        </label>

        <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
          <input
            checked={restock}
            className="accent-forest mt-0.5 size-4"
            onChange={(event) => setRestock(event.target.checked)}
            type="checkbox"
          />
          Reponer las unidades canceladas en el inventario
        </label>
        <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
          <input
            checked={notifyCustomer}
            className="accent-forest mt-0.5 size-4"
            onChange={(event) => setNotifyCustomer(event.target.checked)}
            type="checkbox"
          />
          Enviar al cliente la notificación de cancelación
        </label>

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Escribe {orderName} para confirmar
          </span>
          <input
            autoComplete="off"
            className="border-forest/15 text-forest mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={orderName}
            value={confirmation}
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-950">
          <input
            checked={confirmed}
            className="mt-0.5 size-4 accent-red-900"
            onChange={(event) => setConfirmed(event.target.checked)}
            type="checkbox"
          />
          Comprendo que esta cancelación no puede deshacerse
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {success}
          </p>
        ) : null}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-red-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!ready}
          type="submit"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CircleX className="size-4" />
          )}
          Cancelar definitivamente
        </button>
      </form>
    </Card>
  );
}
