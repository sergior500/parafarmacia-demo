import { z } from "zod";

import type { Product } from "@/domain/product/product";

export type CatalogReviewStatus = "pending" | "reviewed" | "published";

export interface CatalogReviewRecord {
  productId: string;
  reviewStatus: CatalogReviewStatus;
  name: string;
  shortDescription: string;
  description: string;
  usage?: string;
  ingredients?: string;
  warnings?: string;
  categoryId: string;
  priceInCents: number;
  stock: number;
  size?: string;
  ean?: string;
  updatedAt: string;
}

const reviewRecordSchema = z.object({
  productId: z.string().min(1),
  reviewStatus: z.enum(["pending", "reviewed", "published"]),
  name: z.string().min(1),
  shortDescription: z.string(),
  description: z.string(),
  usage: z.string().optional(),
  ingredients: z.string().optional(),
  warnings: z.string().optional(),
  categoryId: z.string().min(1),
  priceInCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  size: z.string().optional(),
  ean: z.string().optional(),
  updatedAt: z.string().min(1),
});

const reviewRecordsSchema = z.array(reviewRecordSchema);

export function parseCatalogReviewRecords(
  rawValue: string | null,
): CatalogReviewRecord[] {
  if (!rawValue) return [];
  try {
    const result = reviewRecordsSchema.safeParse(
      JSON.parse(rawValue) as unknown,
    );
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function getCatalogReviewStatus(
  product: Product,
  record?: CatalogReviewRecord,
): CatalogReviewStatus {
  if (record) return record.reviewStatus;
  return product.dataReviewRequired ? "pending" : "published";
}

export function applyCatalogReviewRecord(
  product: Product,
  record?: CatalogReviewRecord,
): Product {
  if (!record) return product;
  const hasCommercialData =
    record.priceInCents > 0 && Boolean(record.size?.trim());
  const published = record.reviewStatus === "published";

  return {
    ...product,
    name: record.name,
    shortDescription: record.shortDescription,
    description: record.description,
    usage: record.usage,
    ingredients: record.ingredients,
    warnings: record.warnings,
    categoryId: record.categoryId,
    priceInCents: record.priceInCents,
    stock: record.stock,
    size: record.size,
    ean: record.ean,
    status: published ? "active" : "inactive",
    availableForOnlineSale: published && record.stock > 0,
    dataReviewRequired: !hasCommercialData,
  };
}

export function canPublishCatalogProduct(product: Product): boolean {
  return product.priceInCents > 0 && Boolean(product.size?.trim());
}
