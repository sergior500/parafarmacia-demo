import { describe, expect, it } from "vitest";

import {
  canApproveForShopify,
  catalogProductCreateSchema,
  catalogProductUpdateSchema,
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
  it("exige un precio verificado y un formato confirmado", () => {
    expect(
      canApproveForShopify({
        priceInCents: 1290,
        priceVerified: true,
        size: "50 ml",
      }),
    ).toBe(true);
    expect(
      canApproveForShopify({
        priceInCents: 0,
        priceVerified: false,
        size: "50 ml",
      }),
    ).toBe(false);
  });
});
