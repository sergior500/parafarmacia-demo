import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pedidos · Panel interno",
  description: "Pedidos e inventario comercial pendientes de Shopify.",
};

export default function OrdersPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Operación comercial</p>
        <h1 className="display-title text-forest mt-2 text-5xl">Pedidos</h1>
        <p className="text-ink-muted mt-3">
          Esta sección recibirá los pedidos reales desde Shopify cuando se
          configure la tienda.
        </p>
      </header>
      <Card className="p-7 md:p-10">
        <span className="bg-sage text-forest grid size-12 place-items-center rounded-2xl">
          <ShoppingBag className="size-6" />
        </span>
        <h2 className="font-display text-forest mt-6 text-3xl">
          Shopify aún no está conectado
        </h2>
        <p className="text-ink-muted mt-3 max-w-2xl leading-7">
          No mostramos pedidos, clientes ni ventas ficticias. Al integrar
          Shopify, este panel consultará pedidos, estados, importes e inventario
          desde la fuente comercial real.
        </p>
        <div className="border-forest/10 bg-cream mt-6 grid gap-4 rounded-2xl border p-5 text-sm sm:grid-cols-3">
          <div><strong className="text-forest block">Pedidos</strong><span className="text-ink-muted">Pendiente de conexión</span></div>
          <div><strong className="text-forest block">Tarjeta y Bizum</strong><span className="text-ink-muted">Se configurarán en Shopify</span></div>
          <div><strong className="text-forest block">Stock publicado</strong><span className="text-ink-muted">Shopify será la fuente final</span></div>
        </div>
      </Card>
    </>
  );
}
