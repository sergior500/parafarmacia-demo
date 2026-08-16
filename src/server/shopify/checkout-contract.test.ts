import { describe, expect, it } from "vitest";

import {
  buildShopifyCartInput,
  checkoutRequestSchema,
  safeShopifyCheckoutUrl,
} from "@/server/shopify/checkout-contract";

describe("Shopify checkout contract", () => {
  it("acepta cantidades enteras y un código promocional acotado", () => {
    expect(
      checkoutRequestSchema.safeParse({
        lines: [{ productId: "product-1", quantity: 2 }],
        discountCode: "PICUAL10",
      }).success,
    ).toBe(true);
  });

  it("rechaza productos duplicados y cantidades manipuladas", () => {
    const result = checkoutRequestSchema.safeParse({
      lines: [
        { productId: "product-1", quantity: 1 },
        { productId: "product-1", quantity: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("solo incorpora el descuento cuando existe", () => {
    expect(
      buildShopifyCartInput([
        { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 },
      ]),
    ).not.toHaveProperty("discountCodes");
    expect(
      buildShopifyCartInput(
        [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 }],
        "PICUAL10",
      ),
    ).toHaveProperty("discountCodes", ["PICUAL10"]);
  });

  it("impide redirecciones de pago sin HTTPS", () => {
    expect(() => safeShopifyCheckoutUrl("http://example.com/cart")).toThrow(
      "segura",
    );
    expect(
      safeShopifyCheckoutUrl("https://checkout.shopify.com/cart/test"),
    ).toBe("https://checkout.shopify.com/cart/test");
  });
});
