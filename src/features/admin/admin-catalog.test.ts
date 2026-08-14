import { describe, expect, it } from "vitest";

import {
  canApproveForShopify,
  catalogProductCreateSchema,
  catalogProductUpdateSchema,
  getMissingCommercialFields,
} from "@/features/admin/admin-catalog";

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
