import { describe, expect, it } from "vitest";

import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import { buildStorefrontProducts } from "@/providers/catalog/database-catalog";

function catalogProduct(
  overrides: Partial<AdminCatalogProduct> = {},
): AdminCatalogProduct {
  return {
    id: "manual-qa",
    slug: "producto-qa",
    status: "active",
    name: "Producto QA",
    shortDescription: "Descripción corta",
    description: "Descripción",
    brandOrLaboratory: "Farmacia Picual QA",
    priceInCents: 10,
    taxRate: 21,
    currency: "EUR",
    imageUrl: "/og-picual.png",
    categoryId: "cat-higiene",
    stock: 2,
    maximumUnitsPerOrder: 1,
    requiresSpecialTransport: false,
    availableForOnlineSale: true,
    size: "1 unidad",
    benefits: [],
    needs: [],
    reviewStatus: "published",
    updatedAt: "2026-08-23T00:00:00.000Z",
    priceVerified: true,
    stockVerified: true,
    shopifySyncStatus: "synced",
    shopifyProductId: "gid://shopify/Product/1",
    shopifyPublicationStatus: "published",
    ...overrides,
  };
}

describe("database storefront catalog", () => {
  it("includes a manual product only while it is published for sale", () => {
    expect(buildStorefrontProducts([catalogProduct()])).toEqual([
      expect.objectContaining({
        id: "manual-qa",
        availableForOnlineSale: true,
        maximumUnitsPerOrder: 1,
      }),
    ]);
    expect(
      buildStorefrontProducts([
        catalogProduct({
          availableForOnlineSale: false,
          shopifyPublicationStatus: "hidden",
        }),
      ]),
    ).toEqual([]);
  });

  it("keeps PDF references visible but disables sale until publication", () => {
    const [product] = buildStorefrontProducts([
      catalogProduct({
        id: "pdf-dermocosmetica-009",
        slug: "agua-micelar",
        name: "Agua Micelar actualizada",
        status: "inactive",
        reviewStatus: "pending",
        priceInCents: 0,
        priceVerified: false,
        stock: 0,
        stockVerified: false,
        availableForOnlineSale: false,
        shopifyPublicationStatus: "hidden",
      }),
    ]);

    expect(product).toEqual(
      expect.objectContaining({
        id: "pdf-dermocosmetica-009",
        name: "Agua Micelar actualizada",
        availableForOnlineSale: false,
      }),
    );
  });

  it("never exposes internal QA fixtures in the public catalog", () => {
    expect(
      buildStorefrontProducts([
        catalogProduct({ name: "[PRUEBA QA] Producto técnico — NO COMPRAR" }),
      ]),
    ).toEqual([]);
  });
});
