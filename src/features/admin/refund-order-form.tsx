"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import type { ShopifyOrderDetail } from "@/server/shopify/orders";

export function RefundOrderForm({
  orderId,
  orderName,
  lineItems,
}: {
  orderId: string;
  orderName: string;
  lineItems: ShopifyOrderDetail["lineItems"];
}) {
  const router = useRouter();
  const operationId = useRef("");
  const refundableItems = useMemo(
    () => lineItems.filter((item) => item.refundableQuantity > 0),
    [lineItems],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [restock, setRestock] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestion, setSuggestion] = useState<{
    amount: number;
    maximumRefundable: number;
    currencyCode: string;
    signature: string;
  } | null>(null);
  const selectedLines = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([lineItemId, quantity]) => ({ lineItemId, quantity }))
    .sort((left, right) => left.lineItemId.localeCompare(right.lineItemId));
  const selectionSignature = JSON.stringify(selectedLines);
  const selectedUnits = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const ready =
    selectedUnits > 0 &&
    suggestion?.signature === selectionSignature &&
    note.trim().length >= 10 &&
    confirmation === orderName &&
    confirmed &&
    !submitting;

  async function calculateRefund() {
    if (!selectedLines.length) {
      setError("Selecciona al menos una unidad.");
      return;
    }
    setCalculating(true);
    setError("");
    setSuccess("");
    try {
      const response = await secureAdminFetch(
        `/api/admin/orders/${orderId}/refund/preview`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lines: selectedLines }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        suggestion?: {
          amount: number;
          maximumRefundable: number;
          currencyCode: string;
        };
      };
      if (!response.ok || !body.suggestion) {
        throw new Error(body.error || "No se pudo calcular el importe.");
      }
      setSuggestion({ ...body.suggestion, signature: selectionSignature });
    } catch (requestError) {
      setSuggestion(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo calcular el importe.",
      );
    } finally {
      setCalculating(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) {
      setError("Selecciona unidades, explica el motivo y confirma el pedido.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      operationId.current ||= crypto.randomUUID();
      const response = await secureAdminFetch(
        `/api/admin/orders/${orderId}/refund`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            confirmed: true,
            operationId: operationId.current,
            confirmation,
            note,
            notifyCustomer,
            restock,
            lines: selectedLines,
          }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        result?: {
          amount: number;
          currencyCode: string;
          transactionStatus: string;
        };
      };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo procesar el reembolso.");
      }
      const formatter = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: body.result?.currencyCode ?? "EUR",
      });
      setSuccess(
        body.result?.transactionStatus === "SUCCESS"
          ? `Reembolso de ${formatter.format(body.result.amount)} completado.`
          : `Shopify ha aceptado el reembolso de ${formatter.format(body.result?.amount ?? 0)}. El pago sigue procesándose.`,
      );
      operationId.current = "";
      setTimeout(() => router.refresh(), 1_500);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo procesar el reembolso.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden border-amber-300">
      <div className="bg-amber-950 p-6 text-white">
        <RotateCcw className="size-7" />
        <h2 className="mt-4 text-xl font-black">
          Devolución o reembolso parcial
        </h2>
        <p className="mt-2 text-sm text-amber-100/80">
          Shopify calcula descuentos e impuestos y devuelve el importe al método
          de pago original.
        </p>
      </div>
      <form className="space-y-5 p-6" onSubmit={submit}>
        <div className="space-y-3">
          {refundableItems.map((item) => (
            <label
              className="border-forest/10 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_6rem] sm:items-center"
              key={item.id}
            >
              <span>
                <strong className="text-forest block text-sm">
                  {item.name}
                </strong>
                <span className="text-ink-muted text-xs">
                  Hasta {item.refundableQuantity} unidades
                </span>
              </span>
              <span>
                <span className="sr-only">Cantidad de {item.name}</span>
                <input
                  className="admin-input"
                  max={item.refundableQuantity}
                  min="0"
                  onChange={(event) => {
                    setSuggestion(null);
                    setQuantities((current) => ({
                      ...current,
                      [item.id]: Math.max(
                        0,
                        Math.min(
                          item.refundableQuantity,
                          Number(event.target.value) || 0,
                        ),
                      ),
                    }));
                  }}
                  type="number"
                  value={quantities[item.id] ?? 0}
                />
              </span>
            </label>
          ))}
        </div>

        <button
          className="border-forest/15 text-forest hover:bg-sage inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-black disabled:opacity-50"
          disabled={!selectedUnits || calculating || submitting}
          onClick={calculateRefund}
          type="button"
        >
          {calculating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Calcular importe exacto
        </button>
        {suggestion?.signature === selectionSignature ? (
          <div className="bg-sage/60 border-forest/10 rounded-2xl border p-4">
            <span className="text-ink-muted block text-xs font-bold uppercase">
              Shopify devolverá
            </span>
            <strong className="text-forest mt-1 block text-2xl">
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: suggestion.currencyCode,
              }).format(suggestion.amount)}
            </strong>
            <span className="text-ink-muted mt-1 block text-xs">
              Importe calculado con descuentos e impuestos actuales.
            </span>
          </div>
        ) : (
          <p className="text-ink-muted text-xs font-bold">
            Calcula el importe antes de habilitar la confirmación final.
          </p>
        )}

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Motivo interno
          </span>
          <textarea
            className="border-forest/15 text-forest mt-2 min-h-24 w-full rounded-xl border px-3 py-3 text-sm"
            maxLength={255}
            minLength={10}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Indica si es desistimiento, defecto, error de preparación o daño de transporte."
            required
            value={note}
          />
          <span className="text-ink-muted mt-1 block text-xs">
            {note.length}/255 · queda registrado en Shopify y en la auditoría.
          </span>
        </label>

        <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
          <input
            checked={restock}
            className="accent-forest mt-0.5 size-4"
            onChange={(event) => setRestock(event.target.checked)}
            type="checkbox"
          />
          Reponer únicamente unidades físicamente recuperadas y aptas para la
          venta
        </label>
        <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
          <input
            checked={notifyCustomer}
            className="accent-forest mt-0.5 size-4"
            onChange={(event) => setNotifyCustomer(event.target.checked)}
            type="checkbox"
          />
          Enviar la notificación de reembolso al cliente
        </label>

        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">
            La operación mueve dinero real cuando la pasarela está activa. No
            marques reposición para productos abiertos, usados o no recuperados.
          </p>
        </div>

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Escribe {orderName} para confirmar
          </span>
          <input
            autoComplete="off"
            className="admin-input mt-2"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={orderName}
            value={confirmation}
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          <input
            checked={confirmed}
            className="mt-0.5 size-4 accent-amber-950"
            onChange={(event) => setConfirmed(event.target.checked)}
            type="checkbox"
          />
          Confirmo que he revisado las unidades y que este reembolso es
          irreversible
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {success}
          </p>
        ) : null}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!ready}
          type="submit"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Reembolsar {selectedUnits}{" "}
          {selectedUnits === 1 ? "unidad" : "unidades"}
        </button>
      </form>
    </Card>
  );
}
