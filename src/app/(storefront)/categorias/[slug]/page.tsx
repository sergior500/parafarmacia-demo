import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FAQSection } from "@/components/shared/faq-section";
import { CatalogView } from "@/features/catalog/catalog-view";
import { commonFaqs } from "@/mocks/content";
import { catalogProvider } from "@/providers/catalog/database-catalog-provider";

export async function generateStaticParams() {
  const categories = await catalogProvider.listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

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
    alternates: {
      canonical: category ? `/categorias/${category.slug}` : "/parafarmacia",
    },
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

  const related = categories
    .filter((item) => item.id !== category.id)
    .slice(0, 3);
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: commonFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <>
      <CatalogView
        categories={categories}
        description={category.description}
        initialCategorySlug={slug}
        products={products}
        title={category.name}
      />
      <section className="page-shell grid gap-10 py-14 lg:grid-cols-[1fr_.7fr]">
        <div>
          <p className="eyebrow">Guía de la categoría</p>
          <h2 className="display-title text-forest mt-3 text-4xl">
            Elegir {category.name.toLocaleLowerCase("es")} con criterio
          </h2>
          <p className="text-ink-muted mt-5 max-w-2xl text-sm leading-relaxed">
            Compara formatos, necesidades y disponibilidad sin depender
            únicamente de la marca. Las fichas incompletas permanecerán fuera de
            venta hasta incorporar información validada de fabricantes y
            distribuidores.
          </p>
        </div>
        <div>
          <p className="text-forest text-sm font-black">
            También puede interesarte
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                className="border-forest/10 text-forest rounded-full border bg-white px-4 py-2 text-xs font-bold"
                href={`/categorias/${item.slug}`}
                key={item.id}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="page-shell py-14">
        <FAQSection faqs={commonFaqs} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
    </>
  );
}
