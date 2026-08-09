import type { Product } from "@/domain/product/product";

const extractionNoise = [
  "PALABRAS CLAVE",
  "ACTIVOS PRINCIPALES",
  "BIBLIOGRAFÍA",
  "CARACTERÍSTICAS",
];

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function cutAtSection(value: string, sections: string[]): string {
  const positions = sections
    .map((section) => value.indexOf(section))
    .filter((position) => position >= 0);
  return positions.length ? value.slice(0, Math.min(...positions)) : value;
}

export function cleanCatalogDescription(value: string): string {
  return normalizeText(cutAtSection(value, ["ACTIVOS PRINCIPALES"]));
}

export function cleanCatalogUsage(value?: string): string | undefined {
  if (!value) return undefined;
  let cleaned = cutAtSection(value, extractionNoise);
  cleaned = cleaned
    .replace(/\s*•\s*[A-ZÁÉÍÓÚÜÑ0-9%/+.,: -]{3,}(?=[a-záéíóúüñ])/gu, " ")
    .replace(/\b(?:[A-ZÁÉÍÓÚÜÑ]{2,}\s+){1,}[A-ZÁÉÍÓÚÜÑ]{2,}\b/gu, " ")
    .replace(/\s+[A-ZÁÉÍÓÚÜÑ]{5,}\s+(?=[a-záéíóúüñ])/gu, " ");
  cleaned = normalizeText(cleaned);
  return cleaned.length >= 12 ? cleaned : undefined;
}

export function normalizeCatalogSize(value?: string): string | undefined {
  if (!value) return undefined;
  if (
    /formato pendiente|%|al día|indicaciones|contenido medio|durante la aplicación/i.test(
      value,
    )
  ) {
    return undefined;
  }

  const matches = value.match(
    /\d+(?:[.,]\d+)?\s*(?:ml|kg|g|cápsulas(?:\s+vegetales)?|comprimidos(?:\s+(?:recubiertos|masticables|bicapa|ranurados))?|sticks?|sobres|toallitas(?:\s+biodegradables)?)/giu,
  );
  if (!matches?.length) return undefined;

  const reliable = matches.filter((match) => {
    const count = Number.parseFloat(match.replace(",", "."));
    return /ml|kg|\bg\b/i.test(match) || count >= 10;
  });
  if (!reliable.length) return undefined;

  return reliable
    .slice(0, 2)
    .map((match) => normalizeText(match.replace(/(\d)(ml|kg|g)\b/iu, "$1 $2")))
    .join(" / ");
}

export function cleanCatalogBenefits(values?: string[]): string[] | undefined {
  if (!values?.length) return undefined;
  const cleaned = values
    .map((value) => normalizeText(value))
    .filter(
      (value) =>
        value.length >= 5 &&
        !/\b(?:CARACT|TESTAD DERMA|ACCIÓ|FORMULACIÓ)\b$/u.test(value),
    );
  return cleaned.length ? [...new Set(cleaned)].slice(0, 3) : undefined;
}

export function prepareImportedProduct(product: Product): Product {
  return {
    ...product,
    brandSlug:
      product.brandOrLaboratory === "Marca propia Amapola"
        ? "amapola"
        : product.brandSlug,
    description: cleanCatalogDescription(product.description),
    usage: cleanCatalogUsage(product.usage),
    size: normalizeCatalogSize(product.size),
    benefits: cleanCatalogBenefits(product.benefits),
  };
}
