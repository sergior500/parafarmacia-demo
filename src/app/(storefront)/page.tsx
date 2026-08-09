import {
  ArrowRight,
  Baby,
  Bandage,
  BookOpen,
  ChevronRight,
  Droplets,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Smile,
  Sparkles,
  Sun,
  Waves,
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
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Parafarmacia online clara, cercana y fácil de elegir",
  description:
    "Descubre dermocosmética, protección solar, higiene, cuidado infantil y bienestar en una experiencia de parafarmacia online de demostración.",
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
  "bg-[#ebe4f3]",
  "bg-[#dcebe3]",
  "bg-[#fae8c8]",
  "bg-[#dcebed]",
  "bg-[#e3eaf4]",
  "bg-[#f6e4d8]",
  "bg-[#e5eee8]",
  "bg-[#f1ead7]",
  "bg-[#e8e2f3]",
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
        <div className="page-shell grid gap-7 py-6 md:py-10 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch lg:gap-6">
          <div className="bg-sage relative flex min-h-[34rem] flex-col justify-center overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 lg:min-h-[37rem] lg:px-12">
            <span className="border-forest/10 text-forest inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-2 text-[.65rem] font-black tracking-[.1em] uppercase">
              <Leaf aria-hidden="true" className="size-3.5" /> Elegir bien
              empieza por entenderlo fácil
            </span>
            <h1 className="display-title text-forest mt-7 max-w-xl text-[3.15rem] sm:text-6xl lg:text-[4.65rem]">
              Tu rutina, más sencilla de encontrar.
            </h1>
            <p className="text-forest/70 mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
              Cuidado facial, solar, higiene y bienestar explicados con
              claridad, para comprar por producto o por lo que necesitas.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchAutocomplete />
            </div>
            <div className="text-forest/65 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[.7rem] font-bold">
              <span>Productos originales</span>
              <span>Envío a domicilio</span>
              <span>Atención cercana</span>
            </div>
          </div>

          <div className="bg-cream-dark relative min-h-[24rem] overflow-hidden rounded-[2rem] lg:min-h-[37rem]">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/hero-parafarmacia-editorial.png`}
              alt="Composición editorial de envases cosméticos sin marca sobre pedestales verde salvia"
              fill
              className="object-cover"
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4 rounded-[1.4rem] bg-white/88 p-4 backdrop-blur-md sm:right-auto sm:max-w-sm sm:p-5">
              <div>
                <p className="text-ink-muted text-[.62rem] font-black tracking-[.13em] uppercase">
                  Selección de temporada
                </p>
                <strong className="text-forest mt-1 block text-lg">
                  La rutina solar se prepara antes del verano
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
      </section>

      <section className="page-shell py-12 md:py-16">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Empieza por lo que necesitas</p>
            <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
              No hace falta saber el nombre técnico.
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
                className="border-forest/8 group min-h-40 rounded-[1.5rem] border bg-white p-4 transition-transform hover:-translate-y-1 sm:p-5"
                href={`/buscar?necesidad=${need.slug}`}
                key={need.slug}
              >
                <span className="bg-cream text-forest grid size-10 place-items-center rounded-2xl">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              className={`${categoryThemes[index]!} group relative min-h-64 overflow-hidden rounded-[2rem] p-6 sm:p-7`}
              href={`/categorias/${category.slug}`}
              key={category.id}
            >
              <span className="text-forest/35 text-[.62rem] font-black tracking-[.14em] uppercase">
                0{index + 1} · Categoría
              </span>
              <h2 className="font-display text-forest mt-16 max-w-xs text-3xl leading-none tracking-[-.045em]">
                {category.name}
              </h2>
              <p className="text-ink-muted mt-3 max-w-xs text-xs leading-relaxed">
                {category.description}
              </p>
              <span className="text-forest absolute right-6 bottom-6 grid size-10 place-items-center rounded-full bg-white/75 transition-transform group-hover:translate-x-1">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
              <Waves
                aria-hidden="true"
                className="text-forest/8 absolute -top-4 -right-6 size-36"
                strokeWidth={1}
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Los básicos de la demo</p>
              <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
                Productos que vuelven a la cesta.
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
            Selección construida con referencias reconocibles; precio,
            disponibilidad e imagen son demostrativos y no representan una
            oferta comercial real.
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-20">
        <div className="grid gap-4 lg:grid-cols-2">
          {promotions.map((promotion, index) => (
            <Link
              className={`relative min-h-72 overflow-hidden rounded-[2rem] p-7 sm:p-9 ${index === 0 ? "bg-petrol text-white" : "bg-peach text-forest"}`}
              href={promotion.href}
              key={promotion.id}
            >
              <p
                className={`text-[.65rem] font-black tracking-[.14em] uppercase ${index === 0 ? "text-peach" : "text-forest/55"}`}
              >
                Packs y rutinas · demo
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
            <p className="eyebrow">Marcas destacadas</p>
            <h2 className="display-title text-forest mt-3 text-4xl">
              Reconocibles y fáciles de comparar.
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
          <div className="bg-forest-dark rounded-[2rem] p-7 text-white sm:p-9">
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
                className={`border-forest/8 rounded-[1.75rem] border bg-white p-6 ${index === 0 ? "sm:col-span-2" : ""}`}
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
        <div className="border-forest/10 grid gap-8 rounded-[2rem] border bg-white p-7 md:grid-cols-[.7fr_1.3fr] md:p-10">
          <div>
            <ShieldCheck aria-hidden="true" className="text-coral size-7" />
            <h2 className="font-display text-forest mt-5 text-3xl tracking-[-.04em]">
              La confianza no se simula.
            </h2>
          </div>
          <div>
            <p className="text-ink-muted text-sm leading-relaxed">
              Las opiniones verificadas aparecerán cuando exista un sistema real
              capaz de demostrar la compra y moderar el contenido. En esta demo
              no mostramos estrellas, contadores ni testimonios inventados.
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
