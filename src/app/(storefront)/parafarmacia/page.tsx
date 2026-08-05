import type { Metadata } from "next";

import { CatalogView } from "@/features/catalog/catalog-view";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Parafarmacia",
  description: "Catálogo de demostración de productos de parafarmacia.",
};

export default async function ParapharmacyPage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  return (
    <CatalogView
      categories={categories}
      description="Cuidado facial, corporal, solar, higiene e infantil con referencias preparadas para esta demostración."
      products={products}
      title="Tienda de parafarmacia"
    />
  );
}
