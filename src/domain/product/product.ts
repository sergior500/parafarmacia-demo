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

export function filterProducts(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const query = filters.query?.trim().toLocaleLowerCase("es") ?? "";

  return products
    .filter((product) => product.status !== "withdrawn")
    .filter((product) =>
      query
        ? [product.name, product.brandOrLaboratory, product.ean ?? ""].some(
            (value) => value.toLocaleLowerCase("es").includes(query),
          )
        : true,
    )
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
