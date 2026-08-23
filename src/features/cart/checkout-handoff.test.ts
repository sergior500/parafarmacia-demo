import { describe, expect, it, vi } from "vitest";

import { handOffToShopifyCheckout } from "@/features/cart/checkout-handoff";

describe("handOffToShopifyCheckout", () => {
  it("clears the local cart before navigating to Shopify", () => {
    const calls: string[] = [];
    const clearCart = vi.fn(() => calls.push("clear"));
    const navigate = vi.fn((url: string) => calls.push(`navigate:${url}`));

    handOffToShopifyCheckout(
      "https://example.myshopify.com/checkouts/test",
      clearCart,
      navigate,
    );

    expect(calls).toEqual([
      "clear",
      "navigate:https://example.myshopify.com/checkouts/test",
    ]);
    expect(clearCart).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
  });
});
