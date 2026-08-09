import { describe, expect, it } from "vitest";

import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import { buildShopifyProductSetVariables } from "@/server/shopify/product-sync";

const product = {
  id: "pdf-1",
  slug: "gel-suave",
  status: "inactive",
  reviewStatus: "published",
  name: "Gel <suave>",
  shortDescription: "Limpieza",
  description: "Limpia & cuida\n\nUso diario",
  brandOrLaboratory: "Amapola",
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
    });
    expect(variables.input.descriptionHtml).toContain("&amp;");
    expect(variables.input.descriptionHtml).not.toContain("<suave>");
  });
});
