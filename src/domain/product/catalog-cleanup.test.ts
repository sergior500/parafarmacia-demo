import { describe, expect, it } from "vitest";

import {
  cleanCatalogBenefits,
  cleanCatalogDescription,
  cleanCatalogUsage,
  normalizeCatalogSize,
} from "@/domain/product/catalog-cleanup";

describe("limpieza conservadora del catálogo importado", () => {
  it("elimina cabeceras de secciones de la descripción", () => {
    expect(
      cleanCatalogDescription(
        "Limpia e hidrata la piel. ACTIVOS PRINCIPALES ACCIÓN",
      ),
    ).toBe("Limpia e hidrata la piel.");
  });

  it("retira fragmentos de la columna contigua del modo de uso", () => {
    expect(
      cleanCatalogUsage(
        "Aplicar y masajear • PERSO después aclarar. UN LIM ACLAR Para retirar el producto usar un algodón. PALABRAS CLAVE CARACT",
      ),
    ).toBe(
      "Aplicar y masajear después aclarar. Para retirar el producto usar un algodón.",
    );
  });

  it("solo conserva tamaños con una unidad fiable", () => {
    expect(normalizeCatalogSize("400 ml en plástico")).toBe("400 ml");
    expect(normalizeCatalogSize("30 cápsulas vegetales")).toBe(
      "30 cápsulas vegetales",
    );
    expect(normalizeCatalogSize("2 cápsulas al día")).toBeUndefined();
    expect(normalizeCatalogSize("con dosificador")).toBeUndefined();
  });

  it("descarta beneficios claramente truncados", () => {
    expect(
      cleanCatalogBenefits([
        "HIDRATACIÓN INTENSA CARACT",
        "ACCIÓN EQUILIBRANTE",
      ]),
    ).toEqual(["ACCIÓN EQUILIBRANTE"]);
  });
});
