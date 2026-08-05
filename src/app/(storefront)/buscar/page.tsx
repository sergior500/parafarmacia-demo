import type { Metadata } from "next";

import { CatalogView } from "@/features/catalog/catalog-view";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busca en el catálogo ficticio por nombre, marca o código.",
};

export default async function SearchPage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  return (
    <CatalogView
      categories={categories}
      description="Busca por nombre, laboratorio o código nacional simulado y combina los filtros."
      products={products}
      title="Buscar en el catálogo"
    />
  );
}
