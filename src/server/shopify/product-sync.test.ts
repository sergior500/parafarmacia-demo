import { describe, expect, it } from "vitest";

import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import {
  buildShopifyProductSetVariables,
  selectStockLocation,
} from "@/server/shopify/product-sync";

const product = {
  id: "pdf-1",
  slug: "gel-suave",
  status: "inactive",
  reviewStatus: "published",
  name: "Gel <suave>",
  shortDescription: "Limpieza",
  description: "Limpia & cuida\n\nUso diario",
  brandOrLaboratory: "Picual",
  priceInCents: 1295,
  taxRate: 21,
  currency: "EUR",
  imageUrl: "",
  categoryId: "cuidado-facial",
  ean: "8412345678901",
  stock: 4,
  maximumUnitsPerOrder: 6,
  requiresSpecialTransport: false,
  availableForOnlineSale: false,
  size: "200 ml",
  updatedAt: "2026-08-09T00:00:00.000Z",
  priceVerified: true,
  stockVerified: true,
  shopifySyncStatus: "not_synced",
  shopifyPublicationStatus: "hidden",
} satisfies AdminCatalogProduct;

describe("Shopify product payload", () => {
  it("creates one deterministic draft variant without trusting raw HTML", () => {
    const variables = buildShopifyProductSetVariables(product);
    expect(variables.identifier).toEqual({ handle: "gel-suave" });
    expect(variables.input.status).toBe("DRAFT");
    expect(variables.input.variants[0]).toMatchObject({
      price: "12.95",
      barcode: "8412345678901",
      sku: "8412345678901",
      inventoryItem: { requiresShipping: true, tracked: true },
      inventoryPolicy: "DENY",
    });
    expect(variables.input.descriptionHtml).toContain("&amp;");
    expect(variables.input.descriptionHtml).not.toContain("<suave>");
  });

  it("turns a stored product image path into a public Shopify source", () => {
    const variables = buildShopifyProductSetVariables(
      {
        ...product,
        imageUrl:
          "/media/product-images/123e4567-e89b-42d3-a456-426614174000.webp",
      },
      "https://farmacia.example.com",
    );
    expect(variables.input.files).toEqual([
      expect.objectContaining({
        originalSource: expect.stringMatching(
          /^https?:\/\/[^/]+\/media\/product-images\//,
        ),
        contentType: "IMAGE",
      }),
    ]);
  });

  it("keeps an already published product active when its data is updated", () => {
    const variables = buildShopifyProductSetVariables({
      ...product,
      shopifyPublicationStatus: "published",
    });
    expect(variables.input.status).toBe("ACTIVE");
  });

  it("sets verified stock at the selected Shopify location", () => {
    const variables = buildShopifyProductSetVariables(
      product,
      "https://farmacia.example.com",
      "gid://shopify/Location/123",
    );

    expect(variables.input.variants[0]).toMatchObject({
      inventoryItem: { tracked: true },
      inventoryPolicy: "DENY",
      inventoryQuantities: [
        {
          locationId: "gid://shopify/Location/123",
          name: "available",
          quantity: 4,
        },
      ],
    });
  });

  it("does not invent inventory quantities when stock is pending", () => {
    const variables = buildShopifyProductSetVariables(
      { ...product, stock: 0, stockVerified: false },
      "https://farmacia.example.com",
      "gid://shopify/Location/123",
    );

    expect(variables.input.variants[0]).toMatchObject({
      inventoryItem: { tracked: false },
      inventoryPolicy: "DENY",
    });
    expect(variables.input.variants[0]).not.toHaveProperty(
      "inventoryQuantities",
    );
  });

  it("prefers an active location that fulfills online orders", () => {
    expect(
      selectStockLocation([
        {
          id: "inactive",
          name: "Cerrada",
          isActive: false,
          fulfillsOnlineOrders: true,
        },
        {
          id: "active",
          name: "Farmacia",
          isActive: true,
          fulfillsOnlineOrders: true,
        },
      ])?.id,
    ).toBe("active");
  });
});
