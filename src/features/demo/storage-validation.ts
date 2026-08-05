import { z } from "zod";

import type { CartLine } from "@/domain/cart/cart";
import type { Order, OrderStatus } from "@/domain/order/order";
import type { Product, ProductStatus } from "@/domain/product/product";

const productStatuses: ProductStatus[] = [
  "active",
  "inactive",
  "temporarily_unavailable",
  "withdrawn",
];
const orderStatuses: OrderStatus[] = [
  "draft",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
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

function isOrder(value: unknown): value is Order {
  if (!isRecord(value) || !isRecord(value.customer)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.reference === "string" &&
    typeof value.status === "string" &&
    orderStatuses.includes(value.status as OrderStatus) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.customer.firstName === "string" &&
    typeof value.customer.lastName === "string" &&
    typeof value.customer.email === "string" &&
    typeof value.customer.phone === "string" &&
    typeof value.customer.address === "string" &&
    typeof value.customer.postalCode === "string" &&
    typeof value.customer.city === "string" &&
    typeof value.customer.province === "string" &&
    Array.isArray(value.lines) &&
    value.lines.every(isCartLine) &&
    typeof value.subtotalInCents === "number" &&
    typeof value.taxInCents === "number" &&
    typeof value.totalInCents === "number" &&
    Array.isArray(value.internalNotes) &&
    value.internalNotes.every((note) => typeof note === "string") &&
    Array.isArray(value.auditTrail) &&
    value.auditTrail.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.orderId === "string" &&
        typeof entry.newStatus === "string" &&
        orderStatuses.includes(entry.newStatus as OrderStatus) &&
        typeof entry.createdAt === "string" &&
        typeof entry.userId === "string" &&
        typeof entry.userName === "string" &&
        typeof entry.action === "string",
    )
  );
}

const storedCartSchema = z.array(z.custom<CartLine>(isCartLine));
const storedOrdersSchema = z.array(z.custom<Order>(isOrder));

function parseStored<T>(
  rawValue: string | null,
  schema: z.ZodType<T>,
): T | null {
  if (!rawValue) return null;
  try {
    const result = schema.safeParse(JSON.parse(rawValue) as unknown);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function parseStoredCart(rawValue: string | null): CartLine[] | null {
  return parseStored(rawValue, storedCartSchema);
}

export function parseStoredOrders(rawValue: string | null): Order[] | null {
  return parseStored(rawValue, storedOrdersSchema);
}
