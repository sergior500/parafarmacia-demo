import { describe, expect, it } from "vitest";

import {
  applyCatalogReviewRecord,
  canPublishCatalogProduct,
  parseCatalogReviewRecords,
} from "@/features/admin/catalog-review-storage";
import { products } from "@/mocks/products";

describe("flujo de revisión del catálogo", () => {
  const product = products.find((item) => item.sourceDocument)!;

  it("rechaza estados locales manipulados", () => {
    expect(parseCatalogReviewRecords('{"reviewStatus":"root"}')).toEqual([]);
    expect(parseCatalogReviewRecords("<script>")).toEqual([]);
  });

  it("aplica una revisión sin publicar el producto", () => {
    const reviewed = applyCatalogReviewRecord(product, {
      productId: product.id,
      reviewStatus: "reviewed",
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      priceInCents: 1299,
      stock: 4,
      size: "50 ml",
      updatedAt: "2026-08-09T00:00:00.000Z",
    });
    expect(reviewed.status).toBe("inactive");
    expect(reviewed.availableForOnlineSale).toBe(false);
    expect(canPublishCatalogProduct(reviewed)).toBe(true);
  });

  it("publica únicamente con datos comerciales mínimos", () => {
    const published = applyCatalogReviewRecord(product, {
      productId: product.id,
      reviewStatus: "published",
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      priceInCents: 1299,
      stock: 4,
      size: "50 ml",
      updatedAt: "2026-08-09T00:00:00.000Z",
    });
    expect(published.status).toBe("active");
    expect(published.availableForOnlineSale).toBe(true);
  });
});
