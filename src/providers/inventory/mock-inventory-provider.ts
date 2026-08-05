import { isProductAvailable } from "@/domain/product/product";
import { products } from "@/mocks/products";
import type { InventoryProvider } from "@/providers/ports";

export class MockInventoryProvider implements InventoryProvider {
  async getAvailableStock(productId: string): Promise<number> {
    return products.find((product) => product.id === productId)?.stock ?? 0;
  }

  async isAvailable(productId: string, quantity: number): Promise<boolean> {
    const product = products.find((item) => item.id === productId);
    return Boolean(
      product && isProductAvailable(product) && quantity <= product.stock,
    );
  }
}
