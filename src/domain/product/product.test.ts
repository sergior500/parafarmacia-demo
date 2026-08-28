import { describe, expect, it } from "vitest";

import { filterProducts } from "@/domain/product/product";
import { products } from "@/mocks/products";

describe("búsqueda de catálogo", () => {
  it("no mezcla productos creados manualmente con el catálogo importado", () => {
    expect(products).toHaveLength(183);
    expect(products.every((product) => product.id.startsWith("pdf-"))).toBe(
      true,
    );
  });

  it("busca dentro de las fichas procedentes de los PDF", () => {
    expect(filterProducts(products, { query: "Sérum Bioma Confort" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "pdf-dermocosmetica-016" }),
      ]),
    );
    expect(
      filterProducts(products, { query: "Marca por confirmar" }),
    ).toHaveLength(183);
  });

  it("tolera tildes y términos habituales equivalentes", () => {
    expect(filterProducts(products, { query: "serum" })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "pdf-dermocosmetica-016" }),
      ]),
    );
    expect(
      filterProducts(products, { query: "protector solar" }).length,
    ).toBeGreaterThan(0);
  });

  it("filtra por categoría y disponibilidad", () => {
    expect(
      filterProducts(products, { category: "cat-facial", available: true }),
    ).toHaveLength(0);
    expect(
      products.every(
        (product) =>
          product.priceInCents === 0 &&
          product.stock === 0 &&
          !product.availableForOnlineSale,
      ),
    ).toBe(true);
    expect(
      filterProducts(products, { category: "cat-infantil" }).length,
    ).toBeGreaterThan(0);
  });

  it("no expone productos retirados en el catálogo", () => {
    expect(filterProducts(products, {})).not.toContainEqual(
      expect.objectContaining({ status: "withdrawn" }),
    );
  });
});
