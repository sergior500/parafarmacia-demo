import { describe, expect, it } from "vitest";

import { checkoutEligibilityError } from "@/server/shopify/checkout-eligibility";

const readyProduct = {
  name: "Producto QA",
  reviewStatus: "published",
  availableOnline: true,
  shopifyPublicationStatus: "published",
  shopifySyncStatus: "synced",
  shopifyVariantId: "gid://shopify/ProductVariant/1",
};

describe("Shopify checkout eligibility", () => {
  it("accepts only products published through the controlled workflow", () => {
    expect(checkoutEligibilityError(readyProduct)).toBeNull();
    expect(
      checkoutEligibilityError({
        ...readyProduct,
        availableOnline: false,
        shopifyPublicationStatus: "hidden",
      }),
    ).toBe("Producto QA no está publicado para la venta.");
  });

  it("rejects products without a synchronized Shopify variant", () => {
    expect(
      checkoutEligibilityError({
        ...readyProduct,
        shopifyVariantId: null,
      }),
    ).toBe("Producto QA todavía no está preparado para el pago.");
  });
});
