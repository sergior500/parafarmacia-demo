import { describe, expect, it } from "vitest";

import type { AdminCatalogProduct } from "@/features/admin/admin-catalog";
import {
  buildCatalogCsv,
  changedCatalogCsvRecords,
  parseCatalogCsv,
  previewCatalogCsv,
} from "@/server/catalog-csv";

function product(
  overrides: Partial<AdminCatalogProduct> = {},
): AdminCatalogProduct {
  return {
    id: "product-1",
    slug: "gel-limpiador",
    status: "inactive",
    name: "Gel limpiador",
    shortDescription: "Limpieza diaria.",
    description: "Gel para la limpieza diaria de la piel.",
    brandOrLaboratory: "Laboratorio real",
    priceInCents: 1290,
    taxRate: 21,
    currency: "EUR",
    imageUrl: "https://cdn.example.test/gel.webp",
    categoryId: "cat-facial",
    ean: "8420000000001",
    stock: 8,
    maximumUnitsPerOrder: 6,
    requiresSpecialTransport: false,
    availableForOnlineSale: false,
    size: "200 ml",
    reviewStatus: "reviewed",
    updatedAt: "2026-08-16T10:00:00.000Z",
    priceVerified: true,
    stockVerified: true,
    shopifySyncStatus: "synced",
    shopifyPublicationStatus: "hidden",
    ...overrides,
  };
}

describe("catalog CSV", () => {
  it("exporta un archivo compatible con Excel y lo reimporta sin cambios", () => {
    const current = product();
    const csv = buildCatalogCsv([current]);
    const preview = previewCatalogCsv(parseCatalogCsv(csv), [current]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"precio_eur";"stock"');
    expect(preview).toMatchObject({
      total: 1,
      changed: 0,
      unchanged: 1,
      invalid: 0,
    });
  });

  it("detecta solo los campos modificados y conserva los céntimos", () => {
    const current = product();
    const csv = buildCatalogCsv([current])
      .replace('"12,90"', '"13,50"')
      .replace('"8";"200 ml"', '"12";"200 ml"');
    const preview = previewCatalogCsv(parseCatalogCsv(csv), [current]);

    expect(preview).toMatchObject({ changed: 1, invalid: 0 });
    expect(preview.rows[0]?.changes).toEqual(["precio", "stock"]);
    expect(changedCatalogCsvRecords(preview)[0]?.record).toMatchObject({
      priceInCents: 1350,
      stock: 12,
    });
  });

  it("neutraliza fórmulas de Excel sin alterar después el texto del catálogo", () => {
    const current = product({ name: "=2+2" });
    const csv = buildCatalogCsv([current]);
    const preview = previewCatalogCsv(parseCatalogCsv(csv), [current]);

    expect(csv).toContain("\"'=2+2\"");
    expect(preview).toMatchObject({ unchanged: 1, invalid: 0 });
  });

  it("impide aprobar por CSV una ficha comercial incompleta", () => {
    const current = product({
      imageUrl: "",
      reviewStatus: "pending",
      priceVerified: false,
      priceInCents: 0,
    });
    const csv = buildCatalogCsv([current]).replace(
      '"pendiente"',
      '"aprobado"',
    );
    const preview = previewCatalogCsv(parseCatalogCsv(csv), [current]);

    expect(preview.invalid).toBe(1);
    expect(preview.rows[0]?.errors).toContain(
      "Para aprobar faltan precio, stock, formato o imagen.",
    );
  });

  it("rechaza productos duplicados en el mismo archivo", () => {
    const current = product();
    const lines = buildCatalogCsv([current]).trimEnd().split("\r\n");
    const csv = `${lines.join("\r\n")}\r\n${lines[1]}\r\n`;
    const preview = previewCatalogCsv(parseCatalogCsv(csv), [current]);

    expect(preview.invalid).toBe(1);
    expect(preview.rows[1]?.errors).toContain(
      "El producto está duplicado en el archivo.",
    );
  });
});
