import { describe, expect, it } from "vitest";

import { buildAllCategoriesHref } from "@/features/catalog/catalog-navigation";

describe("navegación del filtro de categorías", () => {
  it("sale de una ruta de categoría al seleccionar todas", () => {
    expect(
      buildAllCategoriesHref({
        pathname: "/categorias/cuidado-facial",
        search: "pagina=4",
        hasInitialCategory: true,
      }),
    ).toBe("/parafarmacia");
  });

  it("conserva los demás filtros y elimina categoría y paginación", () => {
    expect(
      buildAllCategoriesHref({
        pathname: "/categorias/cuidado-facial",
        search: "categoria=cuidado-facial&q=serum&pagina=4",
        hasInitialCategory: true,
      }),
    ).toBe("/parafarmacia?q=serum");
  });
});
