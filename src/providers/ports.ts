import type {
  Category,
  Product,
  ProductFilters,
} from "@/domain/product/product";

export interface CatalogProvider {
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  listCategories(): Promise<Category[]>;
}
