import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  CheckCircle2,
  Clock3,
  Droplets,
  MessageCircleQuestion,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Sparkles,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/product-card";
import { formatMoney } from "@/lib/format";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Catálogo de parafarmacia, compra y gestión comercial completamente simulados.",
};

const categoryStyles = [
  { icon: Sparkles, className: "bg-[#f0e9f7]", iconClass: "bg-[#dfd2ed]" },
  { icon: Package, className: "bg-[#e3f2eb]", iconClass: "bg-[#cce6dc]" },
  { icon: Sun, className: "bg-[#fff3db]", iconClass: "bg-[#f9e3b9]" },
  { icon: Droplets, className: "bg-[#e2f1f2]", iconClass: "bg-[#cbe5e7]" },
  { icon: Smile, className: "bg-[#e7eef8]", iconClass: "bg-[#d1def1]" },
  { icon: Baby, className: "bg-[#fff3db]", iconClass: "bg-[#f9e3b9]" },
] as const;

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    catalogProvider.listProducts(),
    catalogProvider.listCategories(),
  ]);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const summaryProducts = featured.slice(0, 2);

  return (
    <>
      <section className="border-forest/8 relative overflow-hidden border-b bg-[radial-gradient(circle_at_83%_15%,#d8eee5_0,transparent_32%),linear-gradient(135deg,#fbfcf9_0%,#f1f5ef_100%)]">
        <div className="absolute top-20 left-[-9rem] size-72 rounded-full border-[3rem] border-white/65" />
        <div className="page-shell relative grid gap-9 py-10 sm:py-14 md:py-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-12 lg:py-24">
          <div>
            <span className="border-forest/10 text-forest inline-flex items-center gap-2 rounded-full border bg-white/75 px-3.5 py-2 text-[0.7rem] font-extrabold tracking-[0.08em] uppercase shadow-sm">
              <span className="bg-coral size-2 rounded-full" />
              <span className="sm:hidden">Demo de parafarmacia</span>
              <span className="hidden sm:inline">
                Parafarmacia online · compra sencilla
              </span>
            </span>
            <h1 className="display-title text-forest mt-6 max-w-3xl text-[2.65rem] min-[360px]:text-[2.95rem] sm:mt-7 sm:text-6xl lg:text-[4.8rem]">
              Tu bienestar también puede sentirse{" "}
              <span className="text-coral">fácil.</span>
            </h1>
            <p className="text-ink-muted mt-5 max-w-xl text-base leading-relaxed sm:mt-6 sm:text-lg">
              Cuidado facial, corporal, solar, higiene e infantil en una
              experiencia de compra clara y cercana.
            </p>

            <form
              action="/buscar"
              className="border-forest/10 mt-7 flex max-w-xl gap-2 rounded-[1.4rem] border bg-white p-2 shadow-[0_20px_55px_-32px_rgba(18,63,56,.55)] sm:mt-8"
            >
              <label className="sr-only" htmlFor="home-search">
                Buscar por producto, laboratorio o código
              </label>
              <Search
                aria-hidden="true"
                className="text-ink-muted ml-3 size-5 self-center"
              />
              <input
                id="home-search"
                name="q"
                className="text-ink min-w-0 flex-1 bg-transparent px-2 text-base outline-none"
                placeholder="Busca un producto…"
                type="search"
              />
              <Button className="px-4 min-[360px]:px-5" type="submit">
                <span className="min-[360px]:hidden">Ir</span>
                <span className="hidden min-[360px]:inline">Buscar</span>
              </Button>
            </form>

            <div className="text-ink-muted mt-6 grid gap-x-3 gap-y-3 text-[0.68rem] font-semibold min-[360px]:grid-cols-2 sm:mt-7 sm:flex sm:flex-wrap sm:gap-x-6 sm:text-xs">
              {[
                "Sin pagos reales",
                "Stock y pedidos demo",
                "Gestión comercial",
              ].map((item) => (
                <span className="inline-flex items-center gap-2" key={item}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-forest size-4"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="border-forest/8 rounded-[1.75rem] border bg-white/85 p-5 shadow-[0_24px_70px_-42px_rgba(9,45,41,.5)] lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-ink-muted text-[0.62rem] font-extrabold tracking-[0.14em] uppercase">
                  Así funciona esta demo
                </p>
                <h2 className="text-forest mt-1 text-lg font-extrabold tracking-[-0.04em] min-[360px]:text-xl">
                  De buscar a gestionar, sin compra real
                </h2>
              </div>
              <span className="bg-sage text-forest grid size-10 shrink-0 place-items-center rounded-2xl">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
            </div>

            <ol className="mt-5 grid gap-2.5">
              {[
                {
                  number: "1",
                  title: "Busca y añade",
                  text: "Elige productos y comprueba stock y límites.",
                },
                {
                  number: "2",
                  title: "Finaliza la compra demo",
                  text: "Usa datos ficticios; no se realiza ningún cobro.",
                },
                {
                  number: "3",
                  title: "Gestiona el pedido",
                  text: "Prepara, envía y consulta ventas desde el panel.",
                },
              ].map(({ number, title, text }) => (
                <li
                  className="border-forest/8 flex gap-3 rounded-2xl border bg-[#fafbf8] p-3"
                  key={number}
                >
                  <span className="bg-forest grid size-7 shrink-0 place-items-center rounded-full text-xs font-black text-white">
                    {number}
                  </span>
                  <span>
                    <strong className="text-forest block text-sm">
                      {title}
                    </strong>
                    <span className="text-ink-muted mt-0.5 block text-[0.7rem] leading-relaxed">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <Button asChild className="mt-4 w-full">
              <Link href="/parafarmacia">
                Empezar la demo
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[34rem] lg:block">
            <span className="bg-coral-light/65 absolute -top-8 -right-7 size-32 rounded-full blur-2xl" />
            <span className="bg-sage-dark/80 absolute -bottom-8 -left-10 size-40 rounded-full blur-2xl" />
            <div className="border-forest/8 relative rounded-[2.2rem] border bg-white/90 p-5 shadow-[0_35px_100px_-48px_rgba(9,45,41,.65)] backdrop-blur md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-ink-muted text-[0.65rem] font-extrabold tracking-[0.14em] uppercase">
                    Pedido de muestra
                  </p>
                  <p className="text-forest mt-1 text-xl font-extrabold tracking-[-0.035em]">
                    Resumen del pedido
                  </p>
                </div>
                <span className="bg-sage text-forest inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.65rem] font-extrabold">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  Confirmado
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {summaryProducts.map((product, index) => (
                  <div
                    className="border-forest/8 flex items-center gap-3 rounded-2xl border bg-[#fafbf8] p-3"
                    key={product.id}
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-black ${
                        index === 0
                          ? "bg-[#dfeee8] text-[#1d806d]"
                          : "bg-[#f0e9f7] text-[#7b5aa6]"
                      }`}
                    >
                      {product.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="text-forest block truncate text-sm">
                        {product.name}
                      </strong>
                      <span className="text-ink-muted text-xs">
                        1 unidad · IVA incluido
                      </span>
                    </span>
                    <strong className="text-forest text-sm">
                      {formatMoney(product.priceInCents)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="border-forest/8 mt-6 border-t pt-5">
                <div className="relative flex items-start justify-between">
                  <span className="bg-sage-dark absolute top-3 right-8 left-8 h-0.5" />
                  {[
                    { icon: ShoppingBag, label: "Compra" },
                    { icon: Package, label: "Preparación" },
                    { icon: CheckCircle2, label: "Envío" },
                  ].map(({ icon: Icon, label }, index) => (
                    <span
                      className="relative z-10 grid justify-items-center gap-2"
                      key={label}
                    >
                      <span
                        className={`grid size-7 place-items-center rounded-full ${
                          index < 2
                            ? "bg-forest text-white"
                            : "border-sage-dark text-forest border-2 bg-white"
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                      </span>
                      <span className="text-ink-muted text-[0.6rem] font-bold">
                        {label}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-forest/8 absolute -right-2 -bottom-7 hidden items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="bg-coral-light text-coral grid size-9 place-items-center rounded-xl">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="text-forest block text-xs">
                  Decisiones trazables
                </strong>
                <span className="text-ink-muted text-[0.65rem]">
                  Control por roles y auditoría
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Todo lo que necesitas</p>
            <h2 className="display-title text-forest mt-3 max-w-2xl text-4xl md:text-5xl">
              Explora por categoría
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/buscar">
              Ver catálogo completo
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {categories.map((category, index) => {
            const style = categoryStyles[index]!;
            const Icon = style.icon;
            const productCount = products.filter(
              (product) =>
                product.categoryId === category.id &&
                product.status === "active",
            ).length;
            return (
              <Link
                href={`/categorias/${category.slug}`}
                key={category.id}
                className={`${style.className} group relative min-h-44 overflow-hidden rounded-[1.6rem] p-5 transition-transform duration-300 hover:-translate-y-1 sm:min-h-56 sm:rounded-[1.8rem] sm:p-6`}
              >
                <span
                  className={`${style.iconClass} text-forest grid size-11 place-items-center rounded-2xl`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="mt-6 flex items-end justify-between gap-4 sm:mt-9">
                  <span>
                    <span className="text-forest block text-xl font-extrabold tracking-[-0.035em]">
                      {category.name}
                    </span>
                    <span className="text-ink-muted mt-2 block max-w-xs text-xs leading-relaxed">
                      {category.description}
                    </span>
                  </span>
                  <span className="text-forest grid size-9 shrink-0 place-items-center rounded-full bg-white/80 transition-transform group-hover:translate-x-1">
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <span className="text-forest/45 absolute top-6 right-6 text-[0.62rem] font-extrabold tracking-[0.1em] uppercase">
                  {productCount} productos
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Selección de muestra</p>
              <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
                Productos destacados
              </h2>
            </div>
            <p className="text-ink-muted max-w-md text-sm leading-relaxed">
              Referencias reconocibles con precios, stock, códigos e imágenes
              creados exclusivamente para esta demostración.
            </p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-16 md:py-24">
        <div className="bg-forest-dark relative overflow-hidden rounded-[2.5rem] px-7 py-12 text-white md:px-12 md:py-16">
          <span className="absolute -top-24 -right-12 size-72 rounded-full border-[3.5rem] border-white/5" />
          <div className="relative">
            <p className="text-coral-light text-[0.7rem] font-extrabold tracking-[0.17em] uppercase">
              Un flujo pensado para ecommerce
            </p>
            <h2 className="display-title mt-3 max-w-3xl text-4xl md:text-5xl">
              Del catálogo al control del negocio.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  icon: ShoppingBag,
                  title: "Compra sencilla",
                  text: "El cliente explora, compara y añade productos con reglas de stock y cantidad.",
                },
                {
                  number: "02",
                  icon: ShieldCheck,
                  title: "Preparación y envío",
                  text: "El equipo gestiona el pedido desde la confirmación hasta la entrega.",
                },
                {
                  number: "03",
                  icon: CheckCircle2,
                  title: "Control comercial",
                  text: "Ventas, productos y movimientos quedan visibles y registrados en el panel.",
                },
              ].map(({ number, icon: Icon, title, text }) => (
                <div className="border-t border-white/15 pt-6" key={number}>
                  <div className="flex items-center justify-between">
                    <span className="text-coral-light text-xs font-black tracking-[0.12em]">
                      {number}
                    </span>
                    <Icon aria-hidden="true" className="size-5 text-white/50" />
                  </div>
                  <h3 className="mt-8 text-xl font-extrabold tracking-[-0.03em]">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-8">
        <div className="border-forest/8 grid overflow-hidden rounded-[2.2rem] border bg-[#fff0e8] lg:grid-cols-[1fr_.65fr]">
          <div className="p-8 md:p-12">
            <MessageCircleQuestion
              aria-hidden="true"
              className="text-coral size-8"
            />
            <h2 className="display-title text-forest mt-6 max-w-2xl text-4xl">
              Una experiencia clara para cliente y negocio.
            </h2>
            <p className="text-ink-muted mt-5 max-w-xl text-sm leading-relaxed">
              La tienda facilita la compra y el panel convierte cada pedido en
              información útil sobre ventas, productos y stock.
            </p>
            <Button asChild className="mt-7">
              <Link href="/admin">
                Ver el panel de gestión
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="relative hidden min-h-80 overflow-hidden bg-[#ffdccc] lg:block">
            <span className="bg-coral/80 absolute top-1/2 left-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <span className="absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] bg-white shadow-2xl">
              <span className="relative grid size-12 place-items-center">
                <span className="bg-forest absolute h-12 w-3.5 rounded-full" />
                <span className="bg-forest absolute h-3.5 w-12 rounded-full" />
              </span>
            </span>
            <span className="absolute top-8 right-8 size-16 rounded-full border-[0.8rem] border-white/45" />
            <span className="absolute bottom-8 left-8 size-20 rounded-full border-[0.8rem] border-white/45" />
          </div>
        </div>
      </section>
    </>
  );
}
