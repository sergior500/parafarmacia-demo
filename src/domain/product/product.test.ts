import { describe, expect, it } from "vitest";

import { filterProducts } from "@/domain/product/product";
import { products } from "@/mocks/products";

describe("búsqueda de catálogo", () => {
  it("busca por nombre, marca y EAN simulado", () => {
    expect(filterProducts(products, { query: "CeraVe" })).toHaveLength(1);
    expect(filterProducts(products, { query: "ISDIN" })).toHaveLength(1);
    expect(filterProducts(products, { query: "DEMO8400000007" })[0]?.name).toBe(
      "Bioderma Sensibio H2O",
    );
  });

  it("filtra por categoría y disponibilidad", () => {
    expect(
      filterProducts(products, { category: "cat-infantil", available: true }),
    ).toHaveLength(1);
  });

  it("no expone productos retirados en el catálogo", () => {
    expect(filterProducts(products, {})).not.toContainEqual(
      expect.objectContaining({ status: "withdrawn" }),
    );
  });
});
