import { z } from "zod";

import type { CartLine } from "@/domain/cart/cart";
import type { Product, ProductStatus } from "@/domain/product/product";

const productStatuses: ProductStatus[] = [
  "active",
  "inactive",
  "temporarily_unavailable",
  "withdrawn",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    typeof value.shortDescription === "string" &&
    typeof value.description === "string" &&
    typeof value.brandOrLaboratory === "string" &&
    typeof value.status === "string" &&
    productStatuses.includes(value.status as ProductStatus) &&
    typeof value.priceInCents === "number" &&
    Number.isInteger(value.priceInCents) &&
    typeof value.taxRate === "number" &&
    value.currency === "EUR" &&
    typeof value.categoryId === "string" &&
    typeof value.stock === "number" &&
    Number.isInteger(value.stock) &&
    typeof value.requiresSpecialTransport === "boolean" &&
    typeof value.availableForOnlineSale === "boolean"
  );
}

function isCartLine(value: unknown): value is CartLine {
  return (
    isRecord(value) &&
    isProduct(value.product) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

const storedCartSchema = z.array(z.custom<CartLine>(isCartLine));

export function parseStoredCart(rawValue: string | null): CartLine[] | null {
  if (!rawValue) return null;
  try {
    const result = storedCartSchema.safeParse(JSON.parse(rawValue) as unknown);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
