import { beforeEach, describe, expect, it, vi } from "vitest";

import { canPublishToShopify } from "@/features/admin/admin-catalog";

const shopifyAdminGraphql = vi.hoisted(() => vi.fn());

vi.mock("@/server/shopify/admin-api", () => ({
  shopifyAdminGraphql,
  ShopifyApiError: class ShopifyApiError extends Error {},
}));

const readyProduct = {
  reviewStatus: "published",
  priceVerified: true,
  priceInCents: 1295,
  stockVerified: true,
  size: "200 ml",
  imageUrl: "/product.webp",
  shopifySyncStatus: "synced",
  shopifyProductId: "gid://shopify/Product/1",
  shopifyPublicationStatus: "hidden",
} as const;

describe("Shopify publication eligibility", () => {
  it("only publishes approved, complete and synchronized products", () => {
    expect(canPublishToShopify(readyProduct)).toBe(true);
    expect(
      canPublishToShopify({ ...readyProduct, imageUrl: "" }),
    ).toBe(false);
    expect(
      canPublishToShopify({ ...readyProduct, shopifySyncStatus: "error" }),
    ).toBe(false);
    expect(
      canPublishToShopify({
        ...readyProduct,
        shopifyPublicationStatus: "published",
      }),
    ).toBe(false);
  });
});

describe("Shopify publication workflow", () => {
  beforeEach(() => shopifyAdminGraphql.mockReset());

  it("attaches the product to Online Store before activating it", async () => {
    shopifyAdminGraphql
      .mockResolvedValueOnce({
        publications: {
          nodes: [
            { id: "publication-app", supportsFuturePublishing: false },
            { id: "publication-online", supportsFuturePublishing: true },
          ],
        },
      })
      .mockResolvedValueOnce({
        publishablePublish: {
          publishable: { publishedOnPublication: true },
          userErrors: [],
        },
      })
      .mockResolvedValueOnce({
        productUpdate: {
          product: { id: "product-1", status: "ACTIVE" },
          userErrors: [],
        },
      });
    const { setShopifyProductPublication } = await import(
      "@/server/shopify/product-publication"
    );

    await expect(
      setShopifyProductPublication("product-1", "publish"),
    ).resolves.toEqual({ publicationId: "publication-online", published: true });
    expect(shopifyAdminGraphql.mock.calls[1]?.[0]).toContain(
      "publishablePublish",
    );
    expect(shopifyAdminGraphql.mock.calls[2]?.[1]).toEqual({
      product: { id: "product-1", status: "ACTIVE" },
    });
  });

  it("changes to draft before removing the publication", async () => {
    shopifyAdminGraphql
      .mockResolvedValueOnce({
        publications: {
          nodes: [{ id: "publication-online", supportsFuturePublishing: true }],
        },
      })
      .mockResolvedValueOnce({
        productUpdate: {
          product: { id: "product-1", status: "DRAFT" },
          userErrors: [],
        },
      })
      .mockResolvedValueOnce({
        publishableUnpublish: {
          publishable: { publishedOnPublication: false },
          userErrors: [],
        },
      });
    const { setShopifyProductPublication } = await import(
      "@/server/shopify/product-publication"
    );

    await setShopifyProductPublication("product-1", "hide");
    expect(shopifyAdminGraphql.mock.calls[1]?.[1]).toEqual({
      product: { id: "product-1", status: "DRAFT" },
    });
    expect(shopifyAdminGraphql.mock.calls[2]?.[0]).toContain(
      "publishableUnpublish",
    );
  });
});
