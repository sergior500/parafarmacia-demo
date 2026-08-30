import { ArrowRight, BadgePercent, ShoppingBag, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/product-card";
import { promotions } from "@/mocks/content";
import { catalogProvider } from "@/providers/catalog/database-catalog-provider";

export const metadata: Metadata = {
  title: "Ofertas de parafarmacia y selecciones especiales",
  description:
    "Consulta ofertas, rutinas y selecciones especiales de dermocosmética, protección solar, higiene y bienestar en Farmacia Picual.",
  alternates: { canonical: "/ofertas" },
};

export default async function OffersPage() {
  const products = await catalogProvider.listProducts();
  const selectedIds = new Set(
    promotions.flatMap((promotion) => promotion.productIds),
  );
  const selectedProducts = products
    .filter(
      (product) => product.status === "active" && selectedIds.has(product.id),
    )
    .slice(0, 8);

  return (
    <>
      <section className="page-shell py-8 md:py-12">
        <div className="warm-surface border-forest/10 grid gap-8 overflow-hidden rounded-[2rem] border p-7 md:grid-cols-[1.15fr_.85fr] md:p-12">
          <div>
            <span className="bg-coral-light text-forest inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
              <BadgePercent aria-hidden="true" className="size-4" />
              Ofertas y selecciones especiales
            </span>
            <h1 className="display-title text-forest mt-6 max-w-3xl text-5xl md:text-6xl">
              Cuidarte bien también puede salir mejor de precio.
            </h1>
            <p className="text-ink-muted mt-5 max-w-2xl leading-relaxed">
              Aquí reuniremos las campañas activas, códigos promocionales y
              selecciones de productos que funcionan bien juntos. Sin precios
              tachados ni descuentos que no estén confirmados.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/parafarmacia">
                  Ver todo el catálogo
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/carrito">Tengo un código promocional</Link>
              </Button>
            </div>
          </div>
          <aside className="bg-forest-dark self-end rounded-[1.5rem] p-6 text-white md:p-8">
            <Tag aria-hidden="true" className="text-peach size-6" />
            <h2 className="font-display mt-5 text-3xl leading-tight">
              Ofertas claras, también en la letra pequeña.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Antes de comprar podrás revisar vigencia, condiciones y productos
              incluidos. El descuento se valida en la cesta de Shopify.
            </p>
          </aside>
        </div>
      </section>

      <section className="page-shell py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Selecciones del momento</p>
          <h2 className="display-title text-forest mt-3 text-4xl md:text-5xl">
            Rutinas que tienen sentido juntas.
          </h2>
          <p className="text-ink-muted mt-4 text-sm leading-relaxed">
            Estas propuestas ayudan a descubrir productos complementarios. Si
            una selección tiene descuento, lo indicaremos de forma expresa.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {promotions.map((promotion, index) => (
            <Link
              className={`group relative min-h-64 overflow-hidden rounded-[1.7rem] p-7 transition-transform hover:-translate-y-1 sm:p-9 ${index === 0 ? "bg-forest-dark text-white" : "bg-peach text-forest"}`}
              href={promotion.href}
              key={promotion.id}
            >
              <span className="text-xs font-bold opacity-65">
                Selección de Farmacia Picual
              </span>
              <h3 className="font-display mt-12 max-w-md text-4xl leading-none tracking-[-.045em]">
                {promotion.title}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed opacity-70">
                {promotion.description}
              </p>
              <span className="text-forest absolute right-7 bottom-7 grid size-11 place-items-center rounded-full bg-white transition-transform group-hover:translate-x-1">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-forest/10 border-y bg-[#fcfaf5] py-14 md:py-18">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Productos seleccionados</p>
              <h2 className="display-title text-forest mt-3 text-4xl">
                Para comparar con calma.
              </h2>
            </div>
            <Link
              className="text-forest hover:text-coral inline-flex items-center gap-2 text-sm font-bold"
              href="/parafarmacia"
            >
              Ver catálogo completo
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {selectedProducts.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {selectedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border-forest/10 mt-8 rounded-[1.5rem] border bg-white p-8 text-center">
              <ShoppingBag
                aria-hidden="true"
                className="text-olive mx-auto size-7"
              />
              <h3 className="font-display text-forest mt-4 text-2xl">
                Estamos preparando la próxima selección.
              </h3>
              <p className="text-ink-muted mx-auto mt-2 max-w-xl text-sm">
                Mientras tanto puedes explorar el catálogo completo. No
                publicaremos una oferta hasta que sus condiciones estén
                confirmadas.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
