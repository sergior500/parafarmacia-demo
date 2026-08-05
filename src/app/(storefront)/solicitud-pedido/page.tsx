import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CheckoutForm } from "@/features/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Finalizar compra",
  description: "Checkout de demostración para crear un pedido ficticio.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/solicitud-pedido" },
};

export default function CheckoutPage() {
  const steps = [
    "Contacto",
    "Dirección",
    "Envío",
    "Pago",
    "Revisión",
    "Confirmación",
  ];
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
      <ol
        className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-6"
        aria-label="Pasos de compra"
      >
        {steps.map((step, index) => (
          <li className="text-center" key={step}>
            <span
              className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-black ${index < 2 ? "bg-forest text-white" : "bg-sage text-forest"}`}
            >
              {index + 1}
            </span>
            <span className="text-ink-muted mt-2 block text-[.62rem] font-bold">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <CheckoutForm />
    </div>
  );
}
