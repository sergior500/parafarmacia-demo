import type { CustomerAccountProfile } from "@/server/shopify/customer-account-api";

const VERIFIED_FINANCIAL_STATUSES = new Set(["PAID", "PARTIALLY_REFUNDED"]);

export function hasVerifiedProductPurchase(
  profile: CustomerAccountProfile,
  product: { shopifyProductId?: string; shopifyVariantId?: string },
): boolean {
  if (!product.shopifyProductId && !product.shopifyVariantId) return false;
  return profile.orders.nodes.some(
    (order) =>
      Boolean(
        order.financialStatus &&
        VERIFIED_FINANCIAL_STATUSES.has(order.financialStatus),
      ) &&
      order.lineItems.nodes.some(
        (line) =>
          (product.shopifyProductId &&
            line.productId === product.shopifyProductId) ||
          (product.shopifyVariantId &&
            line.variantId === product.shopifyVariantId),
      ),
  );
}
