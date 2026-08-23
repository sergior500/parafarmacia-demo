"use client";

import { CheckCircle2, LoaderCircle, PackageCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import type { ShopifyFulfillmentOrder } from "@/server/shopify/orders";

export function FulfillOrderForm({
  orderId,
  fulfillmentOrders,
}: {
  orderId: string;
  fulfillmentOrders: ShopifyFulfillmentOrder[];
}) {
  const router = useRouter();
  const operationId = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [trackingCompany, setTrackingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      setError(
        "Confirma que el pedido está preparado antes de registrar el envío.",
      );
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      operationId.current ||= crypto.randomUUID();
      const response = await secureAdminFetch(
        `/api/admin/orders/${orderId}/fulfill`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            confirmed: true,
            operationId: operationId.current,
            notifyCustomer,
            trackingCompany,
            trackingNumber,
            trackingUrl,
          }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo registrar el envío.");
      }
      setSuccess("Envío registrado. El pedido ya figura como preparado.");
      operationId.current = "";
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo registrar el envío.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const units = fulfillmentOrders.reduce(
    (total, fulfillmentOrder) =>
      total +
      fulfillmentOrder.items.reduce(
        (itemTotal, item) => itemTotal + item.remainingQuantity,
        0,
      ),
    0,
  );

  return (
    <Card className="overflow-hidden">
      <div className="bg-forest p-6 text-white">
        <Truck className="size-7" />
        <h2 className="mt-4 text-xl font-black">Preparar y enviar</h2>
        <p className="mt-2 text-sm text-white/75">
          {units} {units === 1 ? "unidad pendiente" : "unidades pendientes"}
        </p>
      </div>
      <form className="space-y-5 p-6" onSubmit={submit}>
        <div className="bg-sage/50 rounded-2xl p-4 text-sm">
          {fulfillmentOrders.map((fulfillmentOrder) => (
            <div key={fulfillmentOrder.id}>
              <strong className="text-forest block">
                {fulfillmentOrder.locationName}
              </strong>
              <ul className="text-ink-muted mt-2 space-y-1 text-xs">
                {fulfillmentOrder.items.map((item) => (
                  <li key={item.id}>
                    {item.remainingQuantity} × {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Transportista (opcional)
          </span>
          <input
            className="border-forest/15 text-forest mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            maxLength={100}
            onChange={(event) => setTrackingCompany(event.target.value)}
            placeholder="Correos, MRW…"
            value={trackingCompany}
          />
        </label>
        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Número de seguimiento (opcional)
          </span>
          <input
            className="border-forest/15 text-forest mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            maxLength={100}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="ES123456789"
            value={trackingNumber}
          />
        </label>
        <label className="block">
          <span className="text-forest text-xs font-black tracking-wider uppercase">
            Enlace de seguimiento (opcional)
          </span>
          <input
            className="border-forest/15 text-forest mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            onChange={(event) => setTrackingUrl(event.target.value)}
            placeholder="https://transportista.es/seguimiento/..."
            type="url"
            value={trackingUrl}
          />
        </label>

        <label className="text-forest flex cursor-pointer items-start gap-3 text-sm font-bold">
          <input
            checked={notifyCustomer}
            className="accent-forest mt-0.5 size-4"
            onChange={(event) => setNotifyCustomer(event.target.checked)}
            type="checkbox"
          />
          Enviar al cliente la confirmación de envío
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          <input
            checked={confirmed}
            className="mt-0.5 size-4 accent-amber-800"
            onChange={(event) => setConfirmed(event.target.checked)}
            type="checkbox"
          />
          He comprobado los productos y el paquete está preparado
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
          className="bg-coral inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!confirmed || submitting}
          type="submit"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <PackageCheck className="size-4" />
          )}
          Registrar como enviado
        </button>
        <p className="text-ink-muted text-xs leading-5">
          Esta acción actualiza el pedido real. Shopify ya reserva el stock al
          crear el pedido, evitando descontarlo una segunda vez al enviarlo.
        </p>
      </form>
    </Card>
  );
}
