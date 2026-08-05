"use client";

import { CheckCircle2, ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemo } from "@/features/demo/demo-provider";

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const { orders, lastOrderId } = useDemo();
  const orderId = searchParams.get("id") ?? lastOrderId;
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-display text-forest text-4xl">
          No encontramos ese pedido
        </h1>
        <p className="text-ink-muted mt-3">
          Los datos demo pueden haberse borrado de este navegador.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl overflow-hidden">
      <div className="bg-sage p-8 text-center md:p-12">
        <CheckCircle2
          aria-hidden="true"
          className="text-forest mx-auto size-12"
        />
        <p className="eyebrow mt-5">Pedido registrado localmente</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Pedido confirmado
        </h1>
        <p className="text-ink-muted mt-5">
          Referencia ficticia
          <strong className="text-forest mt-1 block text-xl">
            {order.reference}
          </strong>
        </p>
      </div>
      <div className="p-8 md:p-10">
        <div className="bg-coral-light/35 flex items-start gap-4 rounded-2xl p-5">
          <ShoppingBag
            aria-hidden="true"
            className="text-coral size-6 shrink-0"
          />
          <div>
            <p className="text-forest font-bold">
              No se ha realizado ningún cobro.
            </p>
            <p className="text-ink-muted mt-1 text-sm">
              No se ha enviado información a proveedores, transportistas ni
              servicios de correo.
            </p>
          </div>
        </div>
        <p className="text-ink-muted mt-7">
          El pedido ya aparece en el panel interno. Desde allí se puede iniciar
          su preparación, marcar el envío y consultar cómo afecta a las métricas
          comerciales de la demo.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/admin/pedidos/${order.id}`}>
              Ver en el panel demo
              <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
