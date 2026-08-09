import type { Metadata } from "next";
import Link from "next/link";

import { CatalogView } from "@/features/catalog/catalog-view";
import { articles, brands, needs } from "@/mocks/content";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Buscar productos",
  description: "Resultados de búsqueda interna de la tienda de parafarmacia.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/buscar" },
};

export default async function SearchPage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  return (
    <>
      <CatalogView
        categories={categories}
        description="Busca por producto, marca o necesidad. Si no conoces el nombre exacto, prueba con expresiones cotidianas como ‘piel sensible’ o ‘cuidado del bebé’."
        products={products}
        title="¿Qué estás buscando?"
      />
      <section className="page-shell grid gap-4 py-14 lg:grid-cols-3">
        <div className="bg-sage rounded-[1.6rem] p-6">
          <p className="eyebrow">Necesidades</p>
          <h2 className="font-display text-forest mt-3 text-2xl">
            Busca con tus propias palabras
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {needs.slice(0, 5).map((need) => (
              <Link
                className="text-forest rounded-full bg-white px-3 py-2 text-xs font-bold"
                href={`/buscar?necesidad=${need.slug}`}
                key={need.slug}
              >
                {need.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[1.6rem] bg-[#e5ebf1] p-6">
          <p className="eyebrow">Marcas</p>
          <h2 className="font-display text-forest mt-3 text-2xl">
            Explora la procedencia del catálogo
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {brands.slice(0, 5).map((brand) => (
              <Link
                className="text-forest rounded-full bg-white px-3 py-2 text-xs font-bold"
                href={`/marcas/${brand.slug}`}
                key={brand.id}
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-peach rounded-[1.6rem] p-6">
          <p className="eyebrow">Guías útiles</p>
          <h2 className="font-display text-forest mt-3 text-2xl">
            Entender antes de elegir
          </h2>
          <div className="mt-5 grid gap-3">
            {articles.slice(0, 2).map((article) => (
              <Link
                className="text-forest text-xs font-bold underline underline-offset-4"
                href={`/consejos/${article.slug}`}
                key={article.id}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
