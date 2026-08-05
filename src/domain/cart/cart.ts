import { isProductAvailable, type Product } from "@/domain/product/product";

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface CartTotals {
  subtotalInCents: number;
  taxInCents: number;
  totalInCents: number;
}

export type CartRuleErrorCode =
  | "PRODUCT_WITHDRAWN"
  | "PRODUCT_INACTIVE"
  | "PRODUCT_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "MAXIMUM_EXCEEDED"
  | "INVALID_QUANTITY";

export class CartRuleError extends Error {
  constructor(
    public readonly code: CartRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CartRuleError";
  }
}

export function assertCanAddToCart(
  product: Product,
  requestedQuantity: number,
): void {
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new CartRuleError(
      "INVALID_QUANTITY",
      "La cantidad debe ser un número entero positivo.",
    );
  }
  if (product.status === "withdrawn") {
    throw new CartRuleError(
      "PRODUCT_WITHDRAWN",
      "Este producto ha sido retirado.",
    );
  }
  if (product.status === "inactive") {
    throw new CartRuleError(
      "PRODUCT_INACTIVE",
      "Este producto no está activo.",
    );
  }
  if (
    product.status === "temporarily_unavailable" ||
    !product.availableForOnlineSale
  ) {
    throw new CartRuleError(
      "PRODUCT_UNAVAILABLE",
      "Este producto no está disponible para solicitud online.",
    );
  }
  if (!isProductAvailable(product) || requestedQuantity > product.stock) {
    throw new CartRuleError(
      "OUT_OF_STOCK",
      "No hay unidades suficientes disponibles.",
    );
  }
  if (
    product.maximumUnitsPerOrder !== undefined &&
    requestedQuantity > product.maximumUnitsPerOrder
  ) {
    throw new CartRuleError(
      "MAXIMUM_EXCEEDED",
      `El máximo permitido es ${product.maximumUnitsPerOrder}.`,
    );
  }
}

export function calculateCartTotals(lines: readonly CartLine[]): CartTotals {
  return lines.reduce<CartTotals>(
    (totals, line) => {
      const lineTotal = line.product.priceInCents * line.quantity;
      const taxBase = 1 + line.product.taxRate / 100;
      const lineTax = Math.round(lineTotal - lineTotal / taxBase);
      return {
        subtotalInCents: totals.subtotalInCents + lineTotal - lineTax,
        taxInCents: totals.taxInCents + lineTax,
        totalInCents: totals.totalInCents + lineTotal,
      };
    },
    { subtotalInCents: 0, taxInCents: 0, totalInCents: 0 },
  );
}

export interface Promotion {
  id: string;
  percentage: number;
}

export function canApplyPromotion(product: Product): boolean {
  return product.status === "active";
}

export function applyPromotion(product: Product, promotion: Promotion): number {
  if (!canApplyPromotion(product)) {
    return product.priceInCents;
  }

  return Math.round(product.priceInCents * (1 - promotion.percentage / 100));
}
