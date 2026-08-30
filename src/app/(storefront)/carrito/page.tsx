import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CartView } from "@/features/cart/cart-view";
import { catalogProvider } from "@/providers/catalog/database-catalog-provider";

export const metadata: Metadata = {
  title: "Carrito",
  description:
    "Revisa los productos de parafarmacia antes de continuar al pago seguro.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/carrito" },
};

export default async function CartPage() {
  const products = await catalogProvider.listProducts();
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Carrito" }]} />
      <header className="pb-10">
        <p className="eyebrow">Compra segura</p>
        <h1 className="display-title text-forest mt-2 text-5xl md:text-6xl">
          Tu carrito
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl">
          Revisa cantidades, disponibilidad e impuestos antes de continuar.
        </p>
      </header>
      <CartView products={products} />
    </div>
  );
}
