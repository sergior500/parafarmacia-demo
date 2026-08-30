import {
  ArrowRight,
  Baby,
  Bandage,
  BookOpen,
  ChevronRight,
  Droplets,
  HeartPulse,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandStrip } from "@/components/shared/brand-strip";
import { TrustBadges } from "@/components/shared/trust-badges";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/product-card";
import { SearchAutocomplete } from "@/features/search/search-autocomplete";
import { articles, needs, promotions } from "@/mocks/content";
import { catalogProvider } from "@/providers/catalog/database-catalog-provider";

export const metadata: Metadata = {
  title: "Parafarmacia online clara, cercana y fácil de elegir",
  description:
    "Descubre dermocosmética, protección solar, higiene, cuidado infantil y bienestar en Farmacia Picual.",
  alternates: { canonical: "/" },
};

const needIcons = [
  Sparkles,
  Sun,
  Leaf,
  Baby,
  Droplets,
  Bandage,
  HeartPulse,
  Smile,
] as const;
const categoryThemes = [
  "bg-[#e5e1d3]",
  "bg-[#dce4d2]",
  "bg-[#eeddbd]",
  "bg-[#d6e0dc]",
  "bg-[#e1ded2]",
  "bg-[#ead5c5]",
  "bg-[#dce3d8]",
  "bg-[#e6dfca]",
  "bg-[#d8ded2]",
] as const;

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  const featured = products
    .filter((product) => product.featured && product.status === "active")
    .slice(0, 4);

  return (
    <>
      <section className="overflow-hidden">
        <div className="page-shell grid gap-4 py-5 md:py-8 lg:grid-cols-[1.02fr_.98fr] lg:items-stretch">
          <div className="warm-surface border-forest/10 relative flex min-h-[34rem] flex-col justify-center overflow-hidden rounded-[2.4rem_.8rem_2.4rem_.8rem] border px-6 py-12 sm:px-10 lg:min-h-[39rem] lg:px-14">
            <span className="bg-sage text-forest inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[.7rem] font-bold">
              Parafarmacia online de Farmacia Picual
            </span>
            <h1 className="display-title text-forest mt-7 max-w-xl text-[3.3rem] sm:text-6xl lg:text-[4.7rem]">
              Cuidarte debería ser sencillo.
            </h1>
            <p className="text-forest/72 mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              Te ayudamos a encontrar dermocosmética, protección solar, higiene
              y bienestar sin perderte entre nombres complicados.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchAutocomplete />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/parafarmacia">Explorar productos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contacto">
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Necesito orientación
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-cream-dark border-forest/10 relative min-h-[27rem] overflow-hidden rounded-[.8rem_2.4rem_.8rem_2.4rem] border lg:min-h-[39rem]">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/hero-parafarmacia-editorial.png`}
              alt="Composición editorial de envases cosméticos sin marca sobre pedestales verde salvia"
              fill
              unoptimized
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4 rounded-2xl border border-white/55 bg-[#fbf8f0]/94 p-4 shadow-xl backdrop-blur-md sm:right-auto sm:max-w-sm sm:p-5">
              <div>
                <p className="text-coral text-[.7rem] font-bold">
                  Una recomendación para estos meses
                </p>
                <strong className="text-forest mt-1 block text-lg">
                  Protección solar: empieza antes de exponerte
                </strong>
              </div>
              <Button asChild size="icon">
                <Link
                  href="/categorias/proteccion-solar"
                  aria-label="Ver protección solar"
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="page-shell human-note my-5 max-w-3xl px-5 py-2 text-base sm:my-7 sm:text-lg">
          Empieza por lo que necesitas hoy. El nombre exacto del producto puede
          venir después.
        </div>
      </section>

      <section className="page-shell py-12 md:py-16">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">¿Qué necesitas hoy?</p>
            <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
              Elige por cómo quieres cuidarte.
            </h2>
          </div>
          <Link
            className="text-forest hidden items-center gap-1 text-sm font-bold md:flex"
            href="/parafarmacia"
          >
            Ver todo <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {needs.map((need, index) => {
            const Icon = needIcons[index]!;
            return (
              <Link
                className="border-forest/10 group min-h-44 rounded-[1.25rem] border bg-[#fcfaf5] p-4 transition-[transform,background-color] hover:-translate-y-1 hover:bg-white sm:p-5"
                href={`/buscar?necesidad=${need.slug}`}
                key={need.slug}
              >
                <span className="text-olive bg-olive-light/55 grid size-10 place-items-center rounded-full">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <strong className="text-forest mt-5 block text-sm sm:text-base">
                  {need.name}
                </strong>
                <span className="text-ink-muted mt-1 block text-[.7rem] leading-relaxed">
                  {need.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-shell py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Todo el catálogo, bien ordenado</p>
          <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
            También puedes explorar por sección.
          </h2>
          <p className="text-ink-muted mt-4 text-sm leading-relaxed">
            Nueve áreas de cuidado para llegar antes a los productos que te
            interesan.
          </p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              className={`${categoryThemes[index]!} border-forest/10 group relative min-h-60 overflow-hidden rounded-[1.5rem] border p-6 transition-transform hover:-translate-y-1 sm:p-7`}
              href={`/categorias/${category.slug}`}
              key={category.id}
            >
              <span className="text-forest/50 text-xs font-bold">
                Sección {index + 1}
              </span>
              <h3 className="font-display text-forest mt-12 max-w-xs text-3xl leading-none tracking-[-.045em]">
                {category.name}
              </h3>
              <p className="text-ink-muted mt-3 max-w-xs text-xs leading-relaxed">
                {category.description}
              </p>
              <span className="text-forest absolute right-6 bottom-6 grid size-10 place-items-center rounded-full bg-white/70 transition-transform group-hover:translate-x-1">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-forest/10 border-y bg-[#fcfaf5] py-16 md:py-20">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Una selección para empezar</p>
              <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
                Productos que merece la pena conocer.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/parafarmacia">
                Explorar catálogo{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
          <p className="text-ink-muted mt-4 max-w-2xl text-sm">
            Cada ficha reúne la información disponible para ayudarte a comparar
            con calma. La compra solo se activa cuando precio y stock están
            confirmados.
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-20" id="ofertas">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Ideas para cuidarte mejor</p>
            <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
              Rutinas, selecciones y ofertas.
            </h2>
          </div>
          <Link
            className="text-forest hover:text-coral inline-flex items-center gap-2 text-sm font-bold"
            href="/ofertas"
          >
            Ver ofertas <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {promotions.map((promotion, index) => (
            <Link
              className={`relative min-h-72 overflow-hidden rounded-[1.8rem] border p-7 transition-transform hover:-translate-y-1 sm:p-9 ${index === 0 ? "border-forest-dark bg-forest-dark text-white" : "border-coral/20 bg-peach text-forest"}`}
              href={promotion.href}
              key={promotion.id}
            >
              <p
                className={`text-[.65rem] font-black tracking-[.14em] uppercase ${index === 0 ? "text-peach" : "text-forest/55"}`}
              >
                Selección de Farmacia Picual
              </p>
              <h2 className="font-display mt-14 max-w-md text-4xl leading-none tracking-[-.045em]">
                {promotion.title}
              </h2>
              <p
                className={`mt-4 max-w-md text-sm leading-relaxed ${index === 0 ? "text-white/65" : "text-forest/65"}`}
              >
                {promotion.description}
              </p>
              <span
                className={`absolute right-7 bottom-7 grid size-11 place-items-center rounded-full ${index === 0 ? "text-forest bg-white" : "bg-forest text-white"}`}
              >
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell py-12 md:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">La selección de Farmacia Picual</p>
            <h2 className="display-title text-forest mt-3 text-4xl">
              Productos reunidos con un criterio común.
            </h2>
          </div>
          <Link className="text-forest text-sm font-bold" href="/marcas">
            Todas las marcas
          </Link>
        </div>
        <div className="mt-8">
          <BrandStrip />
        </div>
      </section>

      <section className="page-shell py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div className="bg-forest-dark rounded-[1.8rem] p-7 text-white sm:p-9">
            <BookOpen aria-hidden="true" className="text-peach size-7" />
            <p className="text-peach mt-8 text-[.65rem] font-black tracking-[.14em] uppercase">
              Centro de consejos
            </p>
            <h2 className="font-display mt-4 text-4xl leading-none tracking-[-.045em]">
              Entender primero. Elegir después.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Guías prácticas, comparativas y rutinas enlazadas con las
              categorías de la tienda.
            </p>
            <Button
              asChild
              className="text-forest hover:bg-cream mt-7 bg-white"
            >
              <Link href="/consejos">Ver todas las guías</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {articles.slice(0, 3).map((article, index) => (
              <Link
                className={`border-forest/10 border bg-white p-6 ${index === 0 ? "sm:col-span-2" : ""}`}
                href={`/consejos/${article.slug}`}
                key={article.id}
              >
                <span className="text-coral text-[.62rem] font-black tracking-[.13em] uppercase">
                  {article.category} · {article.readTime}
                </span>
                <h3 className="font-display text-forest mt-5 text-2xl leading-tight tracking-[-.04em]">
                  {article.title}
                </h3>
                <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                  {article.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-10">
        <TrustBadges />
      </section>

      <section className="page-shell py-16">
        <div className="warm-surface border-forest/10 grid gap-8 rounded-[1.8rem] border p-7 md:grid-cols-[.7fr_1.3fr] md:p-10">
          <div>
            <ShieldCheck aria-hidden="true" className="text-coral size-7" />
            <h2 className="font-display text-forest mt-5 text-3xl tracking-[-.04em]">
              Opiniones reales, sin atajos.
            </h2>
          </div>
          <div>
            <p className="text-ink-muted text-sm leading-relaxed">
              Las opiniones se vinculan a compras pagadas en Shopify y se
              moderan antes de publicarse. No mostramos estrellas, contadores ni
              testimonios sin trazabilidad.
            </p>
            <Link
              className="text-forest mt-5 inline-flex items-center gap-2 text-sm font-bold"
              href="/sobre-la-farmacia"
            >
              Conocer nuestros criterios{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
