import { describe, expect, it } from "vitest";

import {
  getPaginationItems,
  getPaginationWindow,
} from "@/features/catalog/catalog-pagination";

describe("ventana de paginación del catálogo", () => {
  it("muestra dos páginas a cada lado de la actual", () => {
    expect(getPaginationWindow(8, 16)).toEqual([6, 7, 8, 9, 10]);
  });

  it("no genera páginas anteriores a la primera", () => {
    expect(getPaginationWindow(1, 16)).toEqual([1, 2, 3]);
  });

  it("no genera páginas posteriores a la última", () => {
    expect(getPaginationWindow(16, 16)).toEqual([14, 15, 16]);
  });

  it("mantiene visibles la primera y la última con separadores", () => {
    expect(getPaginationItems(8, 16)).toEqual([
      1,
      "ellipsis-start",
      6,
      7,
      8,
      9,
      10,
      "ellipsis-end",
      16,
    ]);
  });

  it("evita separadores innecesarios junto a los extremos", () => {
    expect(getPaginationItems(1, 16)).toEqual([1, 2, 3, "ellipsis-end", 16]);
    expect(getPaginationItems(16, 16)).toEqual([
      1,
      "ellipsis-start",
      14,
      15,
      16,
    ]);
  });
});
