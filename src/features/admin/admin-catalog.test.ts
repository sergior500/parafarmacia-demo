import { describe, expect, it } from "vitest";

import {
  type AdminCatalogProduct,
  canApproveForShopify,
  catalogProductCreateSchema,
  catalogProductUpdateSchema,
  chunkShopifyProductIds,
  getMissingCommercialFields,
  getShopifyBatchCandidates,
} from "@/features/admin/admin-catalog";
import { buildShopifyProductSetVariables } from "@/server/shopify/product-sync";

const update = {
  reviewStatus: "reviewed" as const,
  name: "Gel limpiador",
  brandOrLaboratory: "Laboratorio real",
  shortDescription: "Limpieza diaria.",
  description: "Gel para la limpieza diaria de la piel.",
  categoryId: "cat-facial",
  priceInCents: null,
  stock: null,
  taxRate: 21,
  maximumUnitsPerOrder: 6,
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
    shopifyPublicationStatus: "hidden",
  } as AdminCatalogProduct;

  it("elige borradores pendientes aunque falten datos comerciales", () => {
    const candidates = getShopifyBatchCandidates([
      completeProduct,
      {
        ...completeProduct,
        id: "product-2",
        reviewStatus: "pending",
        priceVerified: false,
      },
      { ...completeProduct, id: "product-3", shopifySyncStatus: "synced" },
      { ...completeProduct, id: "product-5", shopifySyncStatus: "error" },
    ]);

    expect(candidates.map(({ id }) => id)).toEqual([
      "product-1",
      "product-2",
      "product-5",
    ]);
  });

  it("respeta la selección y el orden solicitados", () => {
    const candidates = getShopifyBatchCandidates(
      [
        completeProduct,
        { ...completeProduct, id: "product-2" },
        { ...completeProduct, id: "product-3" },
      ],
      ["product-3", "product-1"],
      10,
    );

    expect(candidates.map(({ id }) => id)).toEqual([
      "product-3",
      "product-1",
    ]);
  });

  it("limita cada lote a diez productos", () => {
    const products = Array.from({ length: 12 }, (_, index) => ({
      ...completeProduct,
      id: `product-${index}`,
    }));
    expect(getShopifyBatchCandidates(products, undefined, 25)).toHaveLength(10);
  });
});

describe("chunkShopifyProductIds", () => {
  it("divide una cola completa en peticiones de diez sin duplicados", () => {
    const ids = [
      ...Array.from({ length: 23 }, (_, index) => `product-${index}`),
      "product-2",
    ];
    expect(chunkShopifyProductIds(ids)).toEqual([
      ids.slice(0, 10),
      ids.slice(10, 20),
      ids.slice(20, 23),
    ]);
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
    expect(variables.input).not.toHaveProperty("files");
  });

  it("adjunta imágenes HTTPS verificables a la ficha de Shopify", () => {
    const variables = buildShopifyProductSetVariables({
      ...({} as AdminCatalogProduct),
      id: "product-image",
      slug: "producto-con-imagen",
      name: "Producto con imagen",
      brandOrLaboratory: "Laboratorio real",
      categoryId: "cuidado-facial",
      shortDescription: "Descripción corta",
      description: "Descripción completa",
      priceInCents: 1200,
      priceVerified: true,
      stock: 2,
      stockVerified: true,
      taxRate: 21,
      maximumUnitsPerOrder: 6,
      imageUrl: "https://cdn.example.com/producto.jpg",
      size: "50 ml",
      reviewStatus: "reviewed",
      updatedAt: "2026-08-16T00:00:00.000Z",
      shopifySyncStatus: "not_synced",
    });

    expect(variables.input.files).toEqual([
      {
        originalSource: "https://cdn.example.com/producto.jpg",
        alt: "Producto con imagen",
        contentType: "IMAGE",
      },
    ]);
  });
});
