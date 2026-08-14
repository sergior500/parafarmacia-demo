import { z } from "zod";

import type { Product } from "@/domain/product/product";

export type CatalogReviewStatus = "pending" | "reviewed" | "published";
export type ShopifySyncStatus = "not_synced" | "syncing" | "synced" | "error";

export interface AdminCatalogProduct extends Product {
  reviewStatus: CatalogReviewStatus;
  updatedAt: string;
  priceVerified: boolean;
  stockVerified: boolean;
  extractedSize?: string;
  shopifySyncStatus: ShopifySyncStatus;
  shopifyProductId?: string;
  shopifySyncedAt?: string;
  shopifySyncError?: string;
}

const nullableCommercialNumber = z.number().int().nonnegative().nullable();

export const catalogProductUpdateSchema = z.object({
  reviewStatus: z.enum(["pending", "reviewed", "published"]),
  name: z.string().trim().min(1).max(180),
  shortDescription: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1),
  usage: z.string().trim().optional(),
  ingredients: z.string().trim().optional(),
  warnings: z.string().trim().optional(),
  categoryId: z.string().trim().min(1),
  priceInCents: nullableCommercialNumber,
  stock: nullableCommercialNumber,
  size: z.string().trim().max(80).optional(),
  ean: z.string().trim().max(32).optional(),
  imageUrl: z.string().trim().max(500).optional(),
});

export const catalogProductCreateSchema = catalogProductUpdateSchema
  .omit({ reviewStatus: true, usage: true, ingredients: true, warnings: true })
  .extend({
    brandOrLaboratory: z.string().trim().min(1).max(140),
    taxRate: z.number().int().min(0).max(100),
    maximumUnitsPerOrder: z.number().int().min(1).max(99),
  });

export type CatalogProductUpdate = z.infer<typeof catalogProductUpdateSchema>;
export type CatalogProductCreate = z.infer<typeof catalogProductCreateSchema>;

export function canApproveForShopify(
  product: Pick<
    AdminCatalogProduct,
    "priceInCents" | "priceVerified" | "stockVerified" | "size" | "imageUrl"
  >,
): boolean {
  return (
    product.priceVerified &&
    product.priceInCents > 0 &&
    product.stockVerified &&
    Boolean(product.size?.trim()) &&
    Boolean(product.imageUrl.trim())
  );
}

export type CommercialField = "price" | "stock" | "size" | "image";

export function getMissingCommercialFields(
  product: Pick<
    AdminCatalogProduct,
    "priceVerified" | "stockVerified" | "size" | "imageUrl"
  >,
): CommercialField[] {
  const missing: CommercialField[] = [];
  if (!product.priceVerified) missing.push("price");
  if (!product.stockVerified) missing.push("stock");
  if (!product.size?.trim()) missing.push("size");
  if (!product.imageUrl.trim()) missing.push("image");
  return missing;
}
