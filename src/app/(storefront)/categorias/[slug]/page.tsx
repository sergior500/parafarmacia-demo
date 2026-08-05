import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogView } from "@/features/catalog/catalog-view";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await catalogProvider.listCategories();
  const category = categories.find((item) => item.slug === slug);
  return {
    title: category?.name ?? "Categoría",
    description: category?.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <CatalogView
      categories={categories}
      description={category.description}
      initialCategorySlug={slug}
      products={products}
      title={category.name}
    />
  );
}
