import { describe, expect, it } from "vitest";

import {
  type AdminCatalogProduct,
  canApproveForShopify,
  catalogProductCreateSchema,
  catalogProductUpdateSchema,
  getMissingCommercialFields,
  getShopifyBatchCandidates,
} from "@/features/admin/admin-catalog";
import { buildShopifyProductSetVariables } from "@/server/shopify/product-sync";

const update = {
  reviewStatus: "reviewed" as const,
  name: "Gel limpiador",
  shortDescription: "Limpieza diaria.",
  description: "Gel para la limpieza diaria de la piel.",
  categoryId: "cat-facial",
  priceInCents: null,
  stock: null,
};

describe("catalogProductUpdateSchema", () => {
  it("mantiene precio y stock como pendientes sin convertirlos en cero", () => {
    const result = catalogProductUpdateSchema.parse(update);
    expect(result.priceInCents).toBeNull();
    expect(result.stock).toBeNull();
  });

  it("rechaza stock negativo", () => {
    const result = catalogProductUpdateSchema.safeParse({
      ...update,
      stock: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("catalogProductCreateSchema", () => {
  it("valida un alta manual pendiente", () => {
    const result = catalogProductCreateSchema.safeParse({
      ...update,
      brandOrLaboratory: "Picual",
      taxRate: 21,
      maximumUnitsPerOrder: 6,
    });
    expect(result.success).toBe(true);
  });
});

describe("canApproveForShopify", () => {
  it("exige precio, stock, formato e imagen confirmados", () => {
    expect(
      canApproveForShopify({
        priceInCents: 1290,
        priceVerified: true,
        stockVerified: true,
        size: "50 ml",
        imageUrl: "/images/producto.webp",
      }),
    ).toBe(true);
    expect(
      canApproveForShopify({
        priceInCents: 0,
        priceVerified: false,
        stockVerified: false,
        size: "50 ml",
        imageUrl: "",
      }),
    ).toBe(false);
  });
});

describe("getMissingCommercialFields", () => {
  it("mantiene visibles los datos que la farmacia debe completar", () => {
    expect(
      getMissingCommercialFields({
        priceVerified: false,
        stockVerified: true,
        size: undefined,
        imageUrl: "",
      }),
    ).toEqual(["price", "size", "image"]);
  });
});

describe("getShopifyBatchCandidates", () => {
  const completeProduct = {
    id: "product-1",
    reviewStatus: "published",
    priceInCents: 1290,
    priceVerified: true,
    stockVerified: true,
    size: "50 ml",
    imageUrl: "/images/producto.webp",
    shopifySyncStatus: "not_synced",
  } as AdminCatalogProduct;

  it("elige solo fichas aprobadas, completas y aún no sincronizadas", () => {
    const candidates = getShopifyBatchCandidates([
      completeProduct,
      { ...completeProduct, id: "product-2", reviewStatus: "reviewed" },
      { ...completeProduct, id: "product-3", shopifySyncStatus: "synced" },
      { ...completeProduct, id: "product-4", priceVerified: false },
      { ...completeProduct, id: "product-5", shopifySyncStatus: "error" },
    ]);

    expect(candidates.map(({ id }) => id)).toEqual(["product-1", "product-5"]);
  });

  it("limita cada lote a diez productos", () => {
    const products = Array.from({ length: 12 }, (_, index) => ({
      ...completeProduct,
      id: `product-${index}`,
    }));
    expect(getShopifyBatchCandidates(products, 25)).toHaveLength(10);
  });
});

describe("buildShopifyProductSetVariables", () => {
  it("crea un borrador inequívocamente pendiente sin inventar datos comerciales", () => {
    const variables = buildShopifyProductSetVariables({
      id: "product-pending",
      slug: "aceite-corporal",
      name: "Aceite corporal",
      brandOrLaboratory: "Marca por confirmar",
      categoryId: "cuidado-corporal",
      shortDescription: "Ficha importada del catálogo real.",
      description: "Ficha importada del catálogo real.",
      priceInCents: 0,
      priceVerified: false,
      stock: 0,
      stockVerified: false,
      taxRate: 21,
      maximumUnitsPerOrder: 6,
      imageUrl: "",
      featured: false,
      reviewStatus: "pending",
      updatedAt: "2026-08-14T00:00:00.000Z",
      shopifySyncStatus: "not_synced",
    } as AdminCatalogProduct);

    expect(variables.input.status).toBe("DRAFT");
    expect(variables.input.tags).toContain("Pendiente de completar");
    expect(variables.input.variants[0]?.price).toBe("0.00");
    expect(variables.input.productOptions[0]?.values[0]?.name).toBe(
      "Pendiente de definir",
    );
  });
});
