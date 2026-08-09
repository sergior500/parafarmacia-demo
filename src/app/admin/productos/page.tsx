import type { Metadata } from "next";

import { ProductsAdmin } from "@/features/admin/products-admin";

export const metadata: Metadata = {
  title: "Productos · Panel interno",
};

export default function ProductsPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Gestión de catálogo</p>
        <h1 className="display-title text-forest mt-2 text-5xl">Productos</h1>
        <p className="text-ink-muted mt-3">
          Alta, revisión técnica y publicación controlada del catálogo de
          parafarmacia.
        </p>
      </header>
      <ProductsAdmin />
    </>
  );
}
