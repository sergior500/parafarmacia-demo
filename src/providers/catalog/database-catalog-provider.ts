import type {
  Category,
  Product,
  ProductFilters,
} from "@/domain/product/product";
import { filterProducts } from "@/domain/product/product";
import { categories, products as catalogProducts } from "@/mocks/products";
import { buildStorefrontProducts } from "@/providers/catalog/database-catalog";
import type { CatalogProvider } from "@/providers/ports";
import { listAdminProducts } from "@/server/catalog-repository";

function failClosedCatalogProducts(): Product[] {
  return catalogProducts.map((product) => ({
    ...product,
    availableForOnlineSale: false,
  }));
}

export class DatabaseCatalogProvider implements CatalogProvider {
  private async loadProducts(): Promise<Product[]> {
    try {
      return buildStorefrontProducts(await listAdminProducts());
    } catch (error) {
      console.error("No se pudo cargar el catálogo administrado.", error);
      return failClosedCatalogProducts();
    }
  }

  async listProducts(filters: ProductFilters = {}): Promise<Product[]> {
    return filterProducts(await this.loadProducts(), filters);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return (
      (await this.loadProducts()).find((product) => product.slug === slug) ??
      null
    );
  }

  async listCategories(): Promise<Category[]> {
    return categories;
  }
}

export const catalogProvider: CatalogProvider = new DatabaseCatalogProvider();
