import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductCard } from "@/features/catalog/product-card";
import { brands } from "@/mocks/content";
import { products } from "@/mocks/products";

export function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = brands.find((item) => item.slug === slug);
  return {
    title: brand ? `${brand.name}: productos de parafarmacia` : "Marca",
    description: brand?.description,
    alternates: { canonical: brand ? `/marcas/${brand.slug}` : "/marcas" },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = brands.find((item) => item.slug === slug);
  if (!brand) notFound();
  const brandProducts = products.filter(
    (product) =>
      product.brandSlug === brand.slug && product.status !== "withdrawn",
  );
  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[{ label: "Marcas", href: "/marcas" }, { label: brand.name }]}
      />
      <header
        className="rounded-[2rem] p-8 md:p-12"
        style={{ backgroundColor: brand.accent }}
      >
        <p className="eyebrow">Marca de demostración</p>
        <h1 className="display-title text-forest mt-3 text-6xl md:text-7xl">
          {brand.name}
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-sm leading-relaxed">
          {brand.description} Este espacio permitirá añadir historia, valores,
          categorías y contenidos oficiales cuando la marca facilite información
          autorizada.
        </p>
      </header>
      <section className="py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo asociado</p>
            <h2 className="display-title text-forest mt-3 text-4xl">
              Productos {brand.name}
            </h2>
          </div>
          <Link
            className="text-forest text-sm font-bold"
            href={`/buscar?marca=${brand.slug}`}
          >
            Filtrar en catálogo
          </Link>
        </div>
        {brandProducts.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {brandProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-ink-muted mt-6">
            No hay productos activos para esta marca en la demo.
          </p>
        )}
      </section>
    </div>
  );
}
