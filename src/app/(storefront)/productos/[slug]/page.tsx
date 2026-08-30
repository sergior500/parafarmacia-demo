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
import {
  isProductAvailable,
  isProductPricePending,
} from "@/domain/product/product";
import { AddToCartPanel } from "@/features/catalog/add-to-cart-panel";
import { FavoriteButton } from "@/features/catalog/favorite-button";
import { ProductCard } from "@/features/catalog/product-card";
import { ProductReviews } from "@/features/reviews/product-reviews";
import { pharmacyConfig } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import { commonFaqs } from "@/mocks/content";
import { categories } from "@/mocks/products";
import { catalogProvider } from "@/providers/catalog/database-catalog-provider";
import {
  listApprovedProductReviews,
  summarizeProductReviews,
} from "@/server/review-repository";
import { getProductReviewViewerStatus } from "@/server/review-viewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogProvider.getProductBySlug(slug);
  const productImage = absoluteProductImage(product?.imageUrl);
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
          images: productImage
            ? [{ url: productImage, alt: product.name }]
            : [],
        }
      : undefined,
    twitter: product
      ? {
          card: productImage ? "summary_large_image" : "summary",
          title: product.name,
          description: product.shortDescription,
          images: productImage ? [productImage] : [],
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
  const [reviews, reviewViewerStatus] = await Promise.all([
    listApprovedProductReviews(product.id),
    getProductReviewViewerStatus(product.id),
  ]);
  const reviewSummary = summarizeProductReviews(reviews);
  const available = isProductAvailable(product);
  const pricePending = isProductPricePending(product);
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
        ? `La ficha lo clasifica para: ${product.skinTypes.join(", ")}. Confirma siempre la información del envase definitivo.`
        : "Consulta la descripción y el etiquetado del envase para confirmar si se adapta a tus necesidades.",
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
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: absoluteProductImage(product.imageUrl),
    brand: {
      "@type": "Brand",
      name: product.brandOrLaboratory,
    },
    ...(product.ean ? { gtin13: product.ean } : {}),
    ...(available && product.priceInCents > 0
      ? {
          offers: {
            "@type": "Offer",
            url: `${pharmacyConfig.siteUrl}/productos/${product.slug}`,
            priceCurrency: product.currency,
            price: (product.priceInCents / 100).toFixed(2),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
    ...(reviewSummary.totalReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.averageRating,
            reviewCount: reviewSummary.totalReviews,
          },
        }
      : {}),
  };

  return (
    <div className="page-shell pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
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
        <div>
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
                {pricePending
                  ? "Precio aún no disponible"
                  : formatMoney(product.priceInCents)}
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
              {pricePending
                ? "Ficha comercial en preparación"
                : available
                  ? `${product.stock} unidades disponibles`
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
                title: "Envío a domicilio",
                text: "Opciones calculadas antes del pago",
              },
              {
                icon: RotateCcw,
                title: "Devoluciones",
                text: "Según producto y precinto",
              },
              {
                icon: PackageCheck,
                title: "Producto original",
                text: "Trazabilidad de proveedor y Shopify",
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
              {product.usage ??
                "Consulta las instrucciones del envase antes de utilizarlo."}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-6">
            <Box aria-hidden="true" className="text-coral size-5" />
            <h3 className="text-forest mt-4 font-bold">Formato y usuario</h3>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">
              {[product.format, ...(product.skinTypes ?? [])]
                .filter(Boolean)
                .join(" · ") || "Consulta el formato indicado en el envase."}
            </p>
          </div>
          <details className="border-forest/10 rounded-[1.6rem] border bg-white p-6">
            <summary className="text-forest cursor-pointer font-bold">
              Ingredientes o composición
            </summary>
            <p className="text-ink-muted mt-3 text-sm leading-relaxed">
              {product.ingredients ??
                "Consulta la composición o el listado INCI del envase. La ficha se ampliará cuando exista una fuente oficial verificable."}
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
      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
        summary={reviewSummary}
        viewerStatus={reviewViewerStatus}
      />
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
      {!available ? (
        <aside className="bg-coral-light/55 my-10 flex gap-4 rounded-[1.5rem] p-5">
          <Info aria-hidden="true" className="text-coral size-5 shrink-0" />
          <p className="text-ink-muted text-xs leading-relaxed">
            <strong className="text-forest block">
              Producto no disponible para compra
            </strong>{" "}
            La venta se activará únicamente cuando Shopify confirme el precio,
            el stock y la publicación del producto.
          </p>
        </aside>
      ) : null}
    </div>
  );
}

function absoluteProductImage(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  try {
    const url = new URL(imageUrl, pharmacyConfig.siteUrl);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
