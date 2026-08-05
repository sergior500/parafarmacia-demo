import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { articles } from "@/mocks/content";

export const metadata: Metadata = {
  title: "Consejos y guías de parafarmacia",
  description:
    "Guías de compra, rutinas y comparativas para elegir productos de cuidado personal con más claridad.",
  alternates: { canonical: "/consejos" },
};

export default function AdvicePage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Consejos" }]} />
      <header className="grid gap-7 pb-12 lg:grid-cols-[1fr_.7fr] lg:items-end">
        <div>
          <p className="eyebrow">Centro de consejos</p>
          <h1 className="display-title text-forest mt-3 text-5xl md:text-7xl">
            Entender para elegir mejor.
          </h1>
        </div>
        <p className="text-ink-muted max-w-xl text-sm leading-relaxed">
          Guías provisionales que conectan preguntas cotidianas con categorías y
          productos. El contenido no sustituye la valoración de un profesional
          sanitario.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        {articles.map((article, index) => (
          <article
            className={`relative overflow-hidden rounded-[2rem] p-7 ${index === 0 ? "bg-petrol text-white lg:col-span-2" : index === 1 ? "bg-sage text-forest" : "bg-peach text-forest"}`}
            key={article.id}
          >
            <BookOpen
              aria-hidden="true"
              className={
                index === 0 ? "text-peach size-6" : "text-coral size-6"
              }
            />
            <p
              className={`mt-12 text-[.62rem] font-black tracking-[.13em] uppercase ${index === 0 ? "text-peach" : "text-forest/50"}`}
            >
              {article.category} · {article.readTime}
            </p>
            <h2 className="font-display mt-4 max-w-xl text-3xl leading-tight tracking-[-.045em]">
              {article.title}
            </h2>
            <p
              className={`mt-4 max-w-xl text-sm leading-relaxed ${index === 0 ? "text-white/65" : "text-ink-muted"}`}
            >
              {article.excerpt}
            </p>
            <Link
              className={`mt-7 inline-flex items-center gap-2 text-sm font-bold ${index === 0 ? "text-white" : "text-forest"}`}
              href={`/consejos/${article.slug}`}
            >
              Leer guía <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
