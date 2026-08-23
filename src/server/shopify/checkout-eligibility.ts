interface CheckoutCatalogProduct {
  name: string;
  reviewStatus: string;
  availableOnline: boolean;
  shopifyPublicationStatus: string;
  shopifySyncStatus: string;
  shopifyVariantId: string | null;
}

export function checkoutEligibilityError(
  product: CheckoutCatalogProduct,
): string | null {
  if (
    product.reviewStatus !== "published" ||
    !product.availableOnline ||
    product.shopifyPublicationStatus !== "published"
  ) {
    return `${product.name} no está publicado para la venta.`;
  }
  if (product.shopifySyncStatus !== "synced" || !product.shopifyVariantId) {
    return `${product.name} todavía no está preparado para el pago.`;
  }
  return null;
}
