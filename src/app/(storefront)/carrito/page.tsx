import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CartView } from "@/features/cart/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  description:
    "Revisa los productos de parafarmacia antes de finalizar la compra de demostración.",
};

export default function CartPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Carrito" }]} />
      <header className="pb-10">
        <p className="eyebrow">Compra de demostración</p>
        <h1 className="display-title text-forest mt-2 text-5xl md:text-6xl">
          Tu carrito
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl">
          Revisa cantidades, disponibilidad e impuestos antes de continuar.
        </p>
      </header>
      <CartView />
    </div>
  );
}
