import type { Metadata } from "next";

import { ProductsAdmin } from "@/features/admin/products-admin";
import { requireAdminActor } from "@/server/admin-auth";

export const metadata: Metadata = {
  title: "Productos · Panel interno",
};

export default async function ProductsPage() {
  await requireAdminActor("/admin/productos");
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Gestión de catálogo</p>
        <h1 className="display-title text-forest mt-2 text-5xl">Productos</h1>
        <p className="text-ink-muted mt-3">
          Alta, revisión técnica y aprobación del catálogo de parafarmacia antes
          de su futura sincronización con Shopify.
        </p>
      </header>
      <ProductsAdmin />
    </>
  );
}
