import type { Metadata } from "next";

import { CatalogView } from "@/features/catalog/catalog-view";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Parafarmacia online: cuidado personal, higiene y bienestar",
  description:
    "Explora el catálogo de parafarmacia por categoría, marca o necesidad y compara formatos con claridad.",
  alternates: { canonical: "/parafarmacia" },
};

export default async function ParapharmacyPage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  return (
    <CatalogView
      categories={categories}
      description="Cuidado facial, corporal, solar, higiene e infantil organizado para encontrar cada producto por categoría, marca o necesidad cotidiana."
      products={products}
      title="Parafarmacia online"
    />
  );
}
