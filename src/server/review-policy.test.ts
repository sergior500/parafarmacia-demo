import { describe, expect, it } from "vitest";

import { hasVerifiedProductPurchase } from "@/server/review-policy";
import type { CustomerAccountProfile } from "@/server/shopify/customer-account-api";

function profile(
  financialStatus: string,
  productId = "gid://shopify/Product/10",
): CustomerAccountProfile {
  return {
    id: "gid://shopify/Customer/1",
    displayName: "Cliente",
    addresses: { nodes: [] },
    orders: {
      nodes: [
        {
          id: "gid://shopify/Order/1",
          name: "#1001",
          processedAt: "2026-08-01T10:00:00Z",
          financialStatus,
          fulfillmentStatus: "FULFILLED",
          statusPageUrl: "https://shopify.com/orders/1",
          totalPrice: { amount: "20.00", currencyCode: "EUR" },
          lineItems: {
            nodes: [
              {
                productId,
                variantId: "gid://shopify/ProductVariant/20",
              },
            ],
          },
        },
      ],
    },
  };
}

describe("hasVerifiedProductPurchase", () => {
  it("acepta una compra pagada del producto o variante", () => {
    expect(
      hasVerifiedProductPurchase(profile("PAID"), {
        shopifyProductId: "gid://shopify/Product/10",
      }),
    ).toBe(true);
    expect(
      hasVerifiedProductPurchase(profile("PARTIALLY_REFUNDED"), {
        shopifyVariantId: "gid://shopify/ProductVariant/20",
      }),
    ).toBe(true);
  });

  it("rechaza pedidos no pagados, reembolsados o de otro producto", () => {
    expect(
      hasVerifiedProductPurchase(profile("PENDING"), {
        shopifyProductId: "gid://shopify/Product/10",
      }),
    ).toBe(false);
    expect(
      hasVerifiedProductPurchase(profile("REFUNDED"), {
        shopifyProductId: "gid://shopify/Product/10",
      }),
    ).toBe(false);
    expect(
      hasVerifiedProductPurchase(profile("PAID"), {
        shopifyProductId: "gid://shopify/Product/999",
      }),
    ).toBe(false);
  });
});
