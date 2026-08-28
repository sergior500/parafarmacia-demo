export type ProductStatus =
  "active" | "inactive" | "temporarily_unavailable" | "withdrawn";

export interface Product {
  id: string;
  slug: string;
  status: ProductStatus;
  name: string;
  shortDescription: string;
  description: string;
  brandOrLaboratory: string;
  priceInCents: number;
  taxRate: number;
  currency: "EUR";
  imageUrl: string;
  categoryId: string;
  ean?: string;
  stock: number;
  maximumUnitsPerOrder?: number;
  requiresSpecialTransport: boolean;
  availableForOnlineSale: boolean;
  featured?: boolean;
  brandSlug?: string;
  size?: string;
  previousPriceInCents?: number;
  pricePerUnit?: string;
  benefits?: string[];
  usage?: string;
  ingredients?: string;
  warnings?: string;
  skinTypes?: string[];
  needs?: string[];
  format?: string;
  fragranceFree?: boolean;
  vegan?: boolean;
  sensitiveSkin?: boolean;
  spf?: number;
  badges?: string[];
  sourceDocument?: string;
  sourcePage?: number;
  dataReviewRequired?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoDescription?: string;
  relatedSlugs?: string[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceInCents: number;
  stock: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export type ProductSort = "name" | "price-asc" | "price-desc";

export interface ProductFilters {
  query?: string;
  category?: string;
  available?: boolean;
  sort?: ProductSort;
  brand?: string;
  need?: string;
}

export function isProductAvailable(product: Product): boolean {
  return (
    product.status === "active" &&
    product.stock > 0 &&
    product.availableForOnlineSale
  );
}

export function isProductPricePending(product: Product): boolean {
  return Boolean(product.dataReviewRequired && product.priceInCents <= 0);
}

const searchAliases: Record<string, readonly string[]> = {
  protector: [
    "protector",
    "protectora",
    "proteccion",
    "fotoprotector",
    "fotoproteccion",
    "solar",
  ],
  protectora: [
    "protector",
    "protectora",
    "proteccion",
    "fotoprotector",
    "fotoproteccion",
    "solar",
  ],
  proteccion: [
    "protector",
    "protectora",
    "proteccion",
    "fotoprotector",
    "fotoproteccion",
    "solar",
  ],
  fotoprotector: [
    "protector",
    "proteccion",
    "fotoprotector",
    "fotoproteccion",
    "solar",
  ],
  fotoproteccion: [
    "protector",
    "proteccion",
    "fotoprotector",
    "fotoproteccion",
    "solar",
  ],
  pelo: ["pelo", "cabello", "capilar"],
  cabello: ["pelo", "cabello", "capilar"],
  capilar: ["pelo", "cabello", "capilar"],
  bebe: ["bebe", "infantil"],
  infantil: ["bebe", "infantil"],
  boca: ["boca", "bucal", "dental"],
  bucal: ["boca", "bucal", "dental"],
  dental: ["boca", "bucal", "dental"],
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function productMatchesQuery(product: Product, query: string): boolean {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;

  const searchableText = normalizeSearchText(
    [
      product.name,
      product.brandOrLaboratory,
      product.ean ?? "",
      product.shortDescription,
      product.description,
      product.categoryId,
      product.format ?? "",
      ...(product.benefits ?? []),
      ...(product.needs ?? []),
      ...(product.badges ?? []),
    ].join(" "),
  );

  return terms.every((term) =>
    (searchAliases[term] ?? [term]).some((candidate) =>
      searchableText.includes(candidate),
    ),
  );
}

export function filterProducts(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const query = filters.query?.trim() ?? "";

  return products
    .filter((product) => product.status !== "withdrawn")
    .filter((product) => productMatchesQuery(product, query))
    .filter((product) =>
      filters.category ? product.categoryId === filters.category : true,
    )
    .filter((product) =>
      filters.brand ? product.brandSlug === filters.brand : true,
    )
    .filter((product) =>
      filters.need ? product.needs?.includes(filters.need) : true,
    )
    .filter((product) =>
      filters.available ? isProductAvailable(product) : true,
    )
    .toSorted((left, right) => {
      if (filters.sort === "price-asc") {
        return left.priceInCents - right.priceInCents;
      }
      if (filters.sort === "price-desc") {
        return right.priceInCents - left.priceInCents;
      }
      return left.name.localeCompare(right.name, "es");
    });
}
