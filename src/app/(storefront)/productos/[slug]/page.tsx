import {
  BadgeCheck,
  Box,
  Info,
  Leaf,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FAQSection } from "@/components/shared/faq-section";
import { ProductVisual } from "@/components/shared/product-visual";
import { TrustBadges } from "@/components/shared/trust-badges";
import { Badge } from "@/components/ui/badge";
import { isProductAvailable } from "@/domain/product/product";
import { AddToCartPanel } from "@/features/catalog/add-to-cart-panel";
import { FavoriteButton } from "@/features/catalog/favorite-button";
import { ProductCard } from "@/features/catalog/product-card";
import { pharmacyConfig } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { commonFaqs } from "@/mocks/content";
import { categories } from "@/mocks/products";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export async function generateStaticParams() {
  const products = await catalogProvider.listProducts();
  return products
    .filter((product) => product.status !== "withdrawn")
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogProvider.getProductBySlug(slug);
  return {
    title: product
      ? `${product.name} ${product.size ?? ""}`.trim()
      : "Producto no disponible",
    description: product?.shortDescription,
    alternates: {
      canonical: product ? `/productos/${product.slug}` : "/parafarmacia",
    },
    robots:
      product?.status === "active" ? undefined : { index: false, follow: true },
    openGraph: product
      ? {
          title: product.name,
          description: product.shortDescription,
          type: "website",
        }
      : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    catalogProvider.getProductBySlug(slug),
    catalogProvider.listProducts(),
  ]);
  if (!product || product.status === "withdrawn") notFound();
  const available = isProductAvailable(product);
  const category = categories.find((item) => item.id === product.categoryId);
  const related = allProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        item.status === "active" &&
        item.categoryId === product.categoryId,
    )
    .slice(0, 3);
  const complementary = allProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        item.status === "active" &&
        item.categoryId !== product.categoryId,
    )
    .slice(0, 3);
  const productFaqs = [
    {
      question: `¿Para quién está pensado ${product.name}?`,
      answer: product.skinTypes?.length
        ? `La ficha demo lo clasifica para: ${product.skinTypes.join(", ")}. Confirma siempre la información del envase definitivo.`
        : "La indicación concreta deberá incorporarse desde la ficha validada del fabricante.",
    },
    {
      question: "¿Cómo se utiliza?",
      answer:
        product.usage ?? "Sigue siempre las indicaciones del envase original.",
    },
    ...commonFaqs.slice(0, 1),
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: pharmacyConfig.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Parafarmacia",
        item: `${pharmacyConfig.siteUrl}/parafarmacia`,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `${pharmacyConfig.siteUrl}/categorias/${category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: product.name,
        item: `${pharmacyConfig.siteUrl}/productos/${product.slug}`,
      },
    ],
  };

  return (
    <div className="page-shell pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Parafarmacia", href: "/parafarmacia" },
          {
            label: category?.name ?? "Producto",
            href: category ? `/categorias/${category.slug}` : "/parafarmacia",
          },
          { label: product.name },
        ]}
      />
      <section className="grid gap-8 pb-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-14">
        <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
          <div className="hidden gap-2 sm:grid sm:content-start">
            {["Vista principal", "Detalle", "Formato"].map((label, index) => (
              <button
                className={`border-forest/10 aspect-square rounded-2xl border ${index === 0 ? "bg-sage ring-forest/20 ring-2" : "bg-white"}`}
                key={label}
                aria-label={label}
              >
                <span className="text-forest text-[.6rem] font-bold">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
          <ProductVisual
            product={product}
            className="aspect-square rounded-[2rem]"
          />
        </div>

        <div className="lg:py-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                className="text-coral text-[.68rem] font-black tracking-[.14em] uppercase"
                href={
                  product.brandSlug ? `/marcas/${product.brandSlug}` : "/marcas"
                }
              >
                {product.brandOrLaboratory}
              </Link>
              <h1 className="display-title text-forest mt-3 text-[2.9rem] md:text-6xl">
                {product.name}
              </h1>
              {product.size ? (
                <p className="text-ink-muted mt-3">{product.size}</p>
              ) : null}
            </div>
            <FavoriteButton productId={product.id} />
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-forest text-3xl font-black tracking-[-.04em]">
                {formatMoney(product.priceInCents)}
              </p>
              {product.pricePerUnit ? (
                <p className="text-ink-muted text-xs">
                  {product.pricePerUnit} · IVA incluido
                </p>
              ) : null}
            </div>
            <Badge
              className={
                available
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-200 text-stone-700"
              }
            >
              {available
                ? `${product.stock} unidades en stock demo`
                : "Temporalmente no disponible"}
            </Badge>
          </div>

          {product.benefits?.length ? (
            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {product.benefits.map((benefit) => (
                <li
                  className="border-forest/8 bg-sage/45 text-forest flex min-h-20 items-center gap-2 rounded-2xl border p-3 text-xs font-bold"
                  key={benefit}
                >
                  <BadgeCheck aria-hidden="true" className="size-4 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7">
            <AddToCartPanel product={product} />
          </div>

          <div className="border-forest/10 mt-7 grid gap-4 border-t pt-6 sm:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Entrega estimada",
                text: "24–48 h · demo",
              },
              {
                icon: RotateCcw,
                title: "Devoluciones",
                text: "Condiciones claras",
              },
              {
                icon: PackageCheck,
                title: "Producto original",
                text: "Trazabilidad futura",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div className="flex gap-3" key={title}>
                <Icon
                  aria-hidden="true"
                  className="text-coral size-5 shrink-0"
                />
                <span>
                  <strong className="text-forest block text-xs">{title}</strong>
                  <span className="text-ink-muted text-[.68rem]">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-forest/10 grid gap-10 border-t py-14 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="eyebrow">Lo esencial, siempre visible</p>
          <h2 className="display-title text-forest mt-3 text-4xl">
            Qué debes saber.
          </h2>
          <p className="text-ink-muted mt-5 text-sm leading-relaxed">
            {product.description}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.6rem] bg-white p-6">
            <Leaf aria-hidden="true" className="text-coral size-5" />
            <h3 className="text-forest mt-4 font-bold">Modo de uso</h3>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              {product.usage ?? "Pendiente de la ficha del fabricante."}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-6">
            <Box aria-hidden="true" className="text-coral size-5" />
            <h3 className="text-forest mt-4 font-bold">Formato y usuario</h3>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              {[product.format, ...(product.skinTypes ?? [])]
                .filter(Boolean)
                .join(" · ") || "Información pendiente."}
            </p>
          </div>
          <details className="border-forest/10 rounded-[1.6rem] border bg-white p-6">
            <summary className="text-forest cursor-pointer font-bold">
              Ingredientes o composición
            </summary>
            <p className="text-ink-muted mt-3 text-sm leading-relaxed">
              {product.ingredients ??
                "Pendiente de integrar desde la fuente oficial del fabricante."}
            </p>
          </details>
          <details className="border-forest/10 rounded-[1.6rem] border bg-white p-6">
            <summary className="text-forest cursor-pointer font-bold">
              Advertencias
            </summary>
            <p className="text-ink-muted mt-3 text-sm leading-relaxed">
              {product.warnings ??
                "Consulta siempre el envase antes de utilizar el producto."}
            </p>
          </details>
        </div>
      </section>

      <section className="py-14">
        <FAQSection faqs={productFaqs} title="Dudas sobre esta ficha" />
      </section>
      {related.length ? (
        <section className="py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Sigue comparando</p>
              <h2 className="display-title text-forest mt-3 text-4xl">
                Productos relacionados
              </h2>
            </div>
            <Link
              className="text-forest text-sm font-bold"
              href={category ? `/categorias/${category.slug}` : "/parafarmacia"}
            >
              Ver categoría
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
      {complementary.length ? (
        <section className="py-14">
          <p className="eyebrow">Completa tu rutina</p>
          <h2 className="display-title text-forest mt-3 text-4xl">
            También puede encajarte
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {complementary.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="py-10">
        <TrustBadges compact />
      </section>
      <aside className="bg-coral-light/55 my-10 flex gap-4 rounded-[1.5rem] p-5">
        <Info aria-hidden="true" className="text-coral size-5 shrink-0" />
        <p className="text-ink-muted text-xs leading-relaxed">
          <strong className="text-forest block">
            Ficha comercial simulada
          </strong>{" "}
          Marca y formato se usan como referencia; precio, stock, imagen y
          textos deberán validarse antes de publicar.
        </p>
      </aside>
    </div>
  );
}
