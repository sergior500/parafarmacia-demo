import type { Product } from "@/domain/product/product";
import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import { products as catalogProducts } from "@/mocks/products";

const catalogProductsById = new Map(
  catalogProducts.map((product) => [product.id, product]),
);

function isPublishedForSale(product: AdminCatalogProduct) {
  return (
    product.shopifyPublicationStatus === "published" &&
    product.availableForOnlineSale
  );
}

function toPublicProduct(
  product: AdminCatalogProduct,
  fallback?: Product,
): Product {
  const publishedForSale = isPublishedForSale(product);
  return {
    id: product.id,
    slug: product.slug,
    status: product.status,
    name: product.name,
    shortDescription:
      product.shortDescription || fallback?.shortDescription || "",
    description: product.description || fallback?.description || "",
    brandOrLaboratory: product.brandOrLaboratory,
    priceInCents: product.priceVerified
      ? product.priceInCents
      : (fallback?.priceInCents ?? 0),
    taxRate: product.taxRate,
    currency: "EUR",
    imageUrl: product.imageUrl || fallback?.imageUrl || "",
    categoryId: product.categoryId,
    ean: product.ean,
    stock: product.stockVerified ? product.stock : (fallback?.stock ?? 0),
    maximumUnitsPerOrder: product.maximumUnitsPerOrder,
    requiresSpecialTransport: product.requiresSpecialTransport,
    availableForOnlineSale: publishedForSale,
    featured: fallback?.featured,
    brandSlug: fallback?.brandSlug,
    size: product.size || fallback?.size,
    previousPriceInCents: fallback?.previousPriceInCents,
    pricePerUnit: fallback?.pricePerUnit,
    benefits: product.benefits?.length ? product.benefits : fallback?.benefits,
    usage: product.usage || fallback?.usage,
    ingredients: product.ingredients || fallback?.ingredients,
    warnings: product.warnings || fallback?.warnings,
    skinTypes: fallback?.skinTypes,
    needs: product.needs?.length ? product.needs : fallback?.needs,
    format: product.format || fallback?.format,
    fragranceFree: fallback?.fragranceFree,
    vegan: fallback?.vegan,
    sensitiveSkin: fallback?.sensitiveSkin,
    spf: fallback?.spf,
    badges: publishedForSale ? ["Disponible en Shopify"] : fallback?.badges,
    sourceDocument: product.sourceDocument,
    sourcePage: product.sourcePage,
    dataReviewRequired: product.dataReviewRequired,
  };
}

export function buildStorefrontProducts(
  adminProducts: AdminCatalogProduct[],
): Product[] {
  return adminProducts.flatMap((product) => {
    const fallback = catalogProductsById.get(product.id);
    if (!fallback && !isPublishedForSale(product)) return [];
    return [toPublicProduct(product, fallback)];
  });
}
