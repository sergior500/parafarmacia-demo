import { CalendarDays, Clock3, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { articles } from "@/mocks/content";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return {
    title: article?.title ?? "Consejo",
    description: article?.excerpt,
    alternates: {
      canonical: article ? `/consejos/${article.slug}` : "/consejos",
    },
    openGraph: article
      ? { title: article.title, description: article.excerpt, type: "article" }
      : undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.author },
    mainEntityOfPage: `/consejos/${article.slug}`,
  };
  return (
    <article className="page-shell">
      <Breadcrumbs
        items={[
          { label: "Consejos", href: "/consejos" },
          { label: article.title },
        ]}
      />
      <header className="mx-auto max-w-4xl pb-10 text-center">
        <p className="eyebrow">{article.category}</p>
        <h1 className="display-title text-forest mt-4 text-5xl md:text-7xl">
          {article.title}
        </h1>
        <p className="text-ink-muted mx-auto mt-6 max-w-2xl text-base leading-relaxed">
          {article.excerpt}
        </p>
        <div className="text-ink-muted mt-7 flex flex-wrap justify-center gap-5 text-xs">
          <span className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4" />
            {article.author}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4" />
            Actualizado {article.updatedAt}
          </span>
          <span className="flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-4" />
            {article.readTime}
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_16rem]">
        <div className="prose-content rounded-[2rem] bg-white p-7 md:p-10">
          <p className="text-forest text-lg font-bold">{article.intro}</p>
          {article.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <div className="bg-sage/65 mt-10 rounded-2xl p-5 text-sm">
            <strong className="text-forest">Información importante</strong>
            <p className="mt-2">
              Este contenido es informativo y no sustituye la valoración
              individual de un profesional sanitario ni las indicaciones del
              fabricante.
            </p>
          </div>
          <h2>Fuentes y revisión</h2>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {article.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </div>
        <aside>
          <div className="sticky top-40">
            <p className="text-forest text-sm font-black">
              Categorías relacionadas
            </p>
            <div className="mt-4 grid gap-2">
              {article.relatedCategorySlugs.map((category) => (
                <Link
                  className="border-forest/10 text-forest rounded-xl border bg-white px-4 py-3 text-xs font-bold"
                  href={`/categorias/${category}`}
                  key={category}
                >
                  {category.replaceAll("-", " ")}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
