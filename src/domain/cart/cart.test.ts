import { describe, expect, it } from "vitest";

import {
  applyPromotion,
  assertCanAddToCart,
  calculateCartTotals,
  canApplyPromotion,
  getMaximumCartQuantity,
} from "@/domain/cart/cart";
import { products } from "@/mocks/products";

const activeProduct = products[0]!;
const secondActiveProduct = products[1]!;
const unavailableProduct = products[5]!;
const inactiveProduct = products[10]!;
const withdrawnProduct = products[11]!;

describe("reglas del carrito", () => {
  it("impide añadir un producto retirado", () => {
    expect(() => assertCanAddToCart(withdrawnProduct, 1)).toThrowError(
      expect.objectContaining({ code: "PRODUCT_WITHDRAWN" }),
    );
  });

  it("impide añadir un producto inactivo", () => {
    expect(() => assertCanAddToCart(inactiveProduct, 1)).toThrowError(
      expect.objectContaining({ code: "PRODUCT_INACTIVE" }),
    );
  });

  it("impide superar el límite máximo por pedido", () => {
    expect(() => assertCanAddToCart(activeProduct, 5)).toThrowError(
      expect.objectContaining({ code: "MAXIMUM_EXCEEDED" }),
    );
  });

  it("aplica un límite general cuando el producto no tiene uno específico", () => {
    const productWithoutSpecificLimit = products.find(
      (product) =>
        product.maximumUnitsPerOrder === undefined && product.stock > 6,
    )!;
    expect(getMaximumCartQuantity(productWithoutSpecificLimit)).toBe(6);
    expect(() =>
      assertCanAddToCart(productWithoutSpecificLimit, 7),
    ).toThrowError(expect.objectContaining({ code: "MAXIMUM_EXCEEDED" }));
  });

  it("aplica promociones a productos activos", () => {
    expect(canApplyPromotion(activeProduct)).toBe(true);
    expect(applyPromotion(activeProduct, { id: "demo", percentage: 10 })).toBe(
      Math.round(activeProduct.priceInCents * 0.9),
    );
  });

  it("no aplica promociones a productos inactivos", () => {
    expect(canApplyPromotion(inactiveProduct)).toBe(false);
    expect(
      applyPromotion(inactiveProduct, { id: "demo", percentage: 20 }),
    ).toBe(inactiveProduct.priceInCents);
  });

  it("calcula el total exclusivamente en céntimos enteros", () => {
    const totals = calculateCartTotals([
      { product: activeProduct, quantity: 2 },
      { product: secondActiveProduct, quantity: 3 },
    ]);
    expect(totals.totalInCents).toBe(
      activeProduct.priceInCents * 2 + secondActiveProduct.priceInCents * 3,
    );
    expect(Number.isInteger(totals.totalInCents)).toBe(true);
    expect(totals.subtotalInCents + totals.taxInCents).toBe(
      totals.totalInCents,
    );
  });

  it("impide comprar productos no disponibles", () => {
    expect(() => assertCanAddToCart(unavailableProduct, 1)).toThrowError(
      expect.objectContaining({ code: "PRODUCT_UNAVAILABLE" }),
    );
  });
});
