import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Finalizar compra",
  description: "Checkout de demostración para crear un pedido ficticio.",
};

export default function CheckoutPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[
          { label: "Carrito", href: "/carrito" },
          { label: "Finalizar compra" },
        ]}
      />
      <header className="pb-10">
        <p className="eyebrow">No es una compra real</p>
        <h1 className="display-title text-forest mt-2 text-5xl md:text-6xl">
          Finalizar compra
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl">
          Este formulario crea un pedido local de demostración. No envía datos,
          no reserva stock y no realiza ningún cobro.
        </p>
      </header>
      <CheckoutForm />
    </div>
  );
}
