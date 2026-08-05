import { Info, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductVisual } from "@/components/shared/product-visual";
import { Badge } from "@/components/ui/badge";
import { isProductAvailable } from "@/domain/product/product";
import { AddToCartPanel } from "@/features/catalog/add-to-cart-panel";
import { formatMoney } from "@/lib/format";
import { catalogProvider } from "@/providers/catalog/mock-catalog-provider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogProvider.getProductBySlug(slug);
  return {
    title: product?.name ?? "Producto no disponible",
    description: product?.shortDescription,
    robots:
      product?.status === "active"
        ? { index: false, follow: false }
        : { index: false, follow: false, noarchive: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await catalogProvider.getProductBySlug(slug);
  if (!product || product.status === "withdrawn") notFound();
  const available = isProductAvailable(product);

  return (
    <div className="page-shell">
      <Breadcrumbs
        items={[
          { label: "Parafarmacia", href: "/parafarmacia" },
          { label: product.name },
        ]}
      />
      <section className="grid gap-10 pb-16 lg:grid-cols-2 lg:items-start">
        <ProductVisual product={product} className="aspect-square" />
        <div className="lg:py-5">
          <div className="flex flex-wrap gap-2">
            <Badge>Parafarmacia</Badge>
            <Badge
              className={
                available
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-200 text-stone-700"
              }
            >
              {available ? "Disponible" : "No disponible"}
            </Badge>
          </div>
          <h1 className="display-title text-forest mt-5 text-5xl md:text-6xl">
            {product.name}
          </h1>
          <p className="text-ink-muted mt-3 text-lg">
            {product.brandOrLaboratory}
          </p>
          <p className="text-forest mt-6 text-3xl font-black">
            {formatMoney(product.priceInCents)}
          </p>
          <p className="text-ink-muted text-sm">
            Impuestos incluidos · IVA {product.taxRate}%
          </p>

          <div className="border-forest/10 my-7 rounded-2xl border bg-white/70 p-5 text-sm">
            <PackageCheck
              aria-hidden="true"
              className="text-coral mb-3 size-6"
            />
            <strong className="text-forest">
              Añade el producto y completa un pedido de demostración sin pago
              real.
            </strong>
          </div>

          <AddToCartPanel product={product} />

          <dl className="border-forest/10 mt-8 grid gap-3 border-t pt-6 text-sm">
            {product.ean ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">EAN de demostración</dt>
                <dd className="font-bold">{product.ean}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Stock demo</dt>
              <dd className="font-bold">{product.stock} unidades</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-forest/10 grid gap-8 border-t py-14 lg:grid-cols-[1fr_.8fr]">
        <div>
          <p className="eyebrow">Información de demostración</p>
          <h2 className="display-title text-forest mt-2 text-4xl">
            Sobre este producto
          </h2>
          <p className="text-ink-muted mt-5 max-w-2xl">{product.description}</p>
        </div>
        <div className="rounded-3xl bg-white p-6">
          <Info aria-hidden="true" className="text-coral size-6" />
          <h2 className="font-display text-forest mt-4 text-2xl">
            Ficha comercial simulada
          </h2>
          <p className="text-ink-muted mt-2 text-sm">
            La marca, el formato y el precio se muestran únicamente para la
            demo. La ficha definitiva deberá usar los datos e indicaciones
            facilitados por el fabricante o distribuidor.
          </p>
          <Link
            className="text-coral mt-6 inline-block text-sm font-bold underline underline-offset-4"
            href="/contacto"
          >
            Consultar al equipo de la tienda
          </Link>
        </div>
      </section>
    </div>
  );
}
