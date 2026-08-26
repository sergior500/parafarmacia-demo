import { beforeEach, describe, expect, it, vi } from "vitest";

import { shopifyAdminGraphql } from "@/server/shopify/admin-api";
import {
  listShopifyCustomers,
  normalizeCustomerQuery,
} from "@/server/shopify/customers";

vi.mock("@/server/shopify/admin-api", () => ({
  shopifyAdminGraphql: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("Shopify customers", () => {
  it("limita las búsquedas administrativas", () => {
    expect(normalizeCustomerQuery("  Ana  ")).toBe("Ana");
    expect(normalizeCustomerQuery("a".repeat(150))).toHaveLength(100);
  });

  it("mapea únicamente el resumen necesario para operar", async () => {
    vi.mocked(shopifyAdminGraphql).mockResolvedValue({
      customers: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: "gid://shopify/Customer/1",
            displayName: "Ana López",
            createdAt: "2026-08-01T10:00:00Z",
            updatedAt: "2026-08-20T10:00:00Z",
            state: "ENABLED",
            numberOfOrders: "3",
            tags: ["habitual"],
            amountSpent: { amount: "42.50", currencyCode: "EUR" },
            defaultEmailAddress: { emailAddress: "ana@example.com" },
            defaultAddress: { city: "Jaén", province: "Jaén" },
          },
        ],
      },
    });

    await expect(listShopifyCustomers({ query: "Ana" })).resolves.toEqual({
      customers: [
        {
          id: "gid://shopify/Customer/1",
          displayName: "Ana López",
          email: "ana@example.com",
          createdAt: "2026-08-01T10:00:00Z",
          updatedAt: "2026-08-20T10:00:00Z",
          state: "ENABLED",
          numberOfOrders: 3,
          amountSpent: 42.5,
          currencyCode: "EUR",
          location: "Jaén, Jaén",
          tags: ["habitual"],
        },
      ],
      hasNextPage: false,
      endCursor: undefined,
    });
  });
});
