import { beforeEach, describe, expect, it, vi } from "vitest";

import { shopifyAdminGraphql } from "@/server/shopify/admin-api";
import {
  createShopifyBasicDiscount,
  isDiscountGid,
} from "@/server/shopify/discounts";

vi.mock("@/server/shopify/admin-api", () => ({
  ShopifyApiError: class ShopifyApiError extends Error {},
  shopifyAdminGraphql: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("Shopify discounts", () => {
  it("acepta solo identificadores de nodos de descuento", () => {
    expect(isDiscountGid("gid://shopify/DiscountCodeNode/123")).toBe(true);
    expect(isDiscountGid("gid://shopify/Product/123")).toBe(false);
    expect(isDiscountGid("https://evil.example/123")).toBe(false);
  });

  it("convierte un porcentaje visible al decimal esperado por Shopify", async () => {
    vi.mocked(shopifyAdminGraphql).mockResolvedValue({
      discountCodeBasicCreate: {
        codeDiscountNode: { id: "gid://shopify/DiscountCodeNode/123" },
        userErrors: [],
      },
    });

    await expect(
      createShopifyBasicDiscount({
        title: "Bienvenida",
        code: "PICUAL10",
        kind: "percentage",
        value: 10,
        usageLimit: 100,
        appliesOncePerCustomer: true,
      }),
    ).resolves.toEqual({ id: "gid://shopify/DiscountCodeNode/123" });

    const variables = vi.mocked(shopifyAdminGraphql).mock.calls[0]?.[1] as {
      input: {
        customerGets: { value: { percentage: number } };
        context: { all: boolean };
        usageLimit: number;
      };
    };
    expect(variables.input.customerGets.value.percentage).toBe(0.1);
    expect(variables.input.context).toEqual({ all: true });
    expect(variables.input.usageLimit).toBe(100);
  });
});
