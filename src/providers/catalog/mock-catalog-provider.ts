import type {
  Category,
  Product,
  ProductFilters,
} from "@/domain/product/product";
import { filterProducts } from "@/domain/product/product";
import { categories, products } from "@/mocks/products";
import type { CatalogProvider } from "@/providers/ports";

export class MockCatalogProvider implements CatalogProvider {
  async listProducts(filters: ProductFilters = {}): Promise<Product[]> {
    return filterProducts(products, filters);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return products.find((product) => product.slug === slug) ?? null;
  }

  async listCategories(): Promise<Category[]> {
    return categories;
  }
}

export const catalogProvider: CatalogProvider = new MockCatalogProvider();
