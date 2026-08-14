import { getDb } from "@db/index";
import {
  catalogAuditLog,
  catalogSources,
  productBenefits,
  productContent,
  productNeeds,
  products,
} from "@db/schema";
import { asc, desc, eq } from "drizzle-orm";

import type { ProductStatus } from "@/domain/product/product";
import type {
  AdminCatalogProduct,
  CatalogProductCreate,
  CatalogProductUpdate,
  CatalogReviewStatus,
  ShopifySyncStatus,
} from "@/features/admin/admin-catalog";
import type { AdminActor } from "@/server/admin-auth";

function toReviewStatus(value: string): CatalogReviewStatus {
  return value === "reviewed" || value === "published" ? value : "pending";
}

function toProductStatus(reviewStatus: CatalogReviewStatus): ProductStatus {
  return reviewStatus === "published" ? "active" : "inactive";
}

function toShopifySyncStatus(value: string): ShopifySyncStatus {
  return value === "syncing" || value === "synced" || value === "error"
    ? value
    : "not_synced";
}

type ProductRow = typeof products.$inferSelect;
type ContentRow = typeof productContent.$inferSelect;
type SourceRow = typeof catalogSources.$inferSelect;

function mapProduct(
  row: ProductRow,
  content: ContentRow,
  source: SourceRow | null,
  benefits: string[],
  needs: string[],
): AdminCatalogProduct {
  const reviewStatus = toReviewStatus(row.reviewStatus);
  const priceVerified = row.priceCents !== null;
  const stockVerified = row.stockQuantity !== null;

  return {
    id: row.productId,
    slug: row.slug,
    status: toProductStatus(reviewStatus),
    name: row.name,
    shortDescription: content.shortDescription,
    description: content.description,
    brandOrLaboratory: row.brand,
    priceInCents: row.priceCents ?? 0,
    taxRate: row.taxRate,
    currency: "EUR",
    imageUrl: row.imagePath ?? "",
    categoryId: row.categoryId,
    ean: row.ean ?? undefined,
    stock: row.stockQuantity ?? 0,
    maximumUnitsPerOrder: row.maximumUnitsPerOrder,
    requiresSpecialTransport: row.requiresSpecialTransport,
    availableForOnlineSale:
      reviewStatus === "published" &&
      row.availableOnline &&
      (row.stockQuantity ?? 0) > 0,
    size: row.sizeLabel ?? undefined,
    extractedSize: row.sizeExtracted ?? undefined,
    benefits,
    usage: content.usageInstructions ?? undefined,
    ingredients: content.ingredients ?? undefined,
    warnings: content.warnings ?? undefined,
    needs,
    format: row.formatLabel ?? undefined,
    sourceDocument: source?.fileName,
    sourcePage: row.sourcePage ?? undefined,
    dataReviewRequired: !priceVerified || !row.sizeLabel,
    reviewStatus,
    updatedAt: row.updatedAt,
    priceVerified,
    stockVerified,
    shopifySyncStatus: toShopifySyncStatus(row.shopifySyncStatus),
    shopifyProductId: row.shopifyProductId ?? undefined,
    shopifySyncedAt: row.shopifySyncedAt ?? undefined,
    shopifySyncError: row.shopifySyncError ?? undefined,
  };
}

export async function listAdminProducts(): Promise<AdminCatalogProduct[]> {
  const db = getDb();
  const rows = await db
    .select({
      product: products,
      content: productContent,
      source: catalogSources,
    })
    .from(products)
    .innerJoin(productContent, eq(products.productId, productContent.productId))
    .leftJoin(catalogSources, eq(products.sourceId, catalogSources.sourceId))
    .orderBy(desc(products.updatedAt), asc(products.name));

  const [benefitRows, needRows] = await Promise.all([
    db.select().from(productBenefits).orderBy(asc(productBenefits.position)),
    db.select().from(productNeeds),
  ]);

  const benefitsByProduct = new Map<string, string[]>();
  for (const row of benefitRows) {
    benefitsByProduct.set(row.productId, [
      ...(benefitsByProduct.get(row.productId) ?? []),
      row.benefit,
    ]);
  }
  const needsByProduct = new Map<string, string[]>();
  for (const row of needRows) {
    needsByProduct.set(row.productId, [
      ...(needsByProduct.get(row.productId) ?? []),
      row.needSlug,
    ]);
  }

  return rows.map(({ product, content, source }) =>
    mapProduct(
      product,
      content,
      source,
      benefitsByProduct.get(product.productId) ?? [],
      needsByProduct.get(product.productId) ?? [],
    ),
  );
}

export async function findAdminProduct(productId: string) {
  const productsList = await listAdminProducts();
  return productsList.find((product) => product.id === productId) ?? null;
}

export async function markProductShopifySyncing(productId: string) {
  await getDb()
    .update(products)
    .set({
      shopifySyncStatus: "syncing",
      shopifySyncError: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.productId, productId));
}

export async function markProductShopifySynced(
  productId: string,
  result: {
    productId: string;
    variantId?: string;
    inventoryItemId?: string;
    payloadHash: string;
  },
  actor: AdminActor,
) {
  const db = getDb();
  const now = new Date().toISOString();
  await db.batch([
    db
      .update(products)
      .set({
        shopifyProductId: result.productId,
        shopifyVariantId: result.variantId ?? null,
        shopifyInventoryItemId: result.inventoryItemId ?? null,
        shopifySyncStatus: "synced",
        shopifySyncedAt: now,
        shopifySyncError: null,
        shopifyPayloadHash: result.payloadHash,
        updatedAt: now,
      })
      .where(eq(products.productId, productId)),
    db.insert(catalogAuditLog).values({
      auditId: crypto.randomUUID(),
      productId,
      action: "shopify_synced",
      actorId: actor.userId,
      actorEmail: actor.email,
      changesJson: JSON.stringify({ shopifyProductId: result.productId }),
      createdAt: now,
    }),
  ]);
}

export async function markProductShopifyError(
  productId: string,
  message: string,
) {
  await getDb()
    .update(products)
    .set({
      shopifySyncStatus: "error",
      shopifySyncError: message.slice(0, 500),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.productId, productId));
}

function uniqueSlug(name: string, suffix: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "producto"}-${suffix}`;
}

export async function createAdminProduct(
  input: CatalogProductCreate,
  actor: AdminActor,
): Promise<AdminCatalogProduct> {
  const db = getDb();
  const uuid = crypto.randomUUID();
  const productId = `manual-${uuid}`;
  const now = new Date().toISOString();

  await db.batch([
    db.insert(products).values({
      productId,
      slug: uniqueSlug(input.name, uuid.slice(0, 8)),
      lifecycleStatus: "draft",
      reviewStatus: "pending",
      name: input.name,
      brand: input.brandOrLaboratory,
      categoryId: input.categoryId,
      sizeLabel: input.size || null,
      priceCents: input.priceInCents,
      taxRate: input.taxRate,
      stockQuantity: input.stock,
      maximumUnitsPerOrder: input.maximumUnitsPerOrder,
      imagePath: input.imageUrl || null,
      ean: input.ean || null,
      availableOnline: false,
      requiresSpecialTransport: false,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(productContent).values({
      productId,
      shortDescription: input.shortDescription,
      description: input.description,
    }),
    db.insert(catalogAuditLog).values({
      auditId: crypto.randomUUID(),
      productId,
      action: "created",
      nextReviewStatus: "pending",
      actorId: actor.userId,
      actorEmail: actor.email,
      changesJson: JSON.stringify(input),
      createdAt: now,
    }),
  ]);

  const created = await findAdminProduct(productId);
  if (!created) throw new Error("No se pudo recuperar el producto creado.");
  return created;
}

export async function updateAdminProduct(
  productId: string,
  input: CatalogProductUpdate,
  actor: AdminActor,
): Promise<AdminCatalogProduct | null> {
  const db = getDb();
  const currentRows = await db
    .select({ reviewStatus: products.reviewStatus })
    .from(products)
    .where(eq(products.productId, productId))
    .limit(1);
  const current = currentRows[0];
  if (!current) return null;

  const now = new Date().toISOString();
  await db.batch([
    db
      .update(products)
      .set({
        reviewStatus: input.reviewStatus,
        lifecycleStatus:
          input.reviewStatus === "published" ? "approved" : "draft",
        name: input.name,
        categoryId: input.categoryId,
        sizeLabel: input.size || null,
        priceCents: input.priceInCents,
        stockQuantity: input.stock,
        ean: input.ean || null,
        imagePath: input.imageUrl || null,
        availableOnline: false,
        shopifySyncStatus: "not_synced",
        shopifySyncError: null,
        updatedAt: now,
      })
      .where(eq(products.productId, productId)),
    db
      .update(productContent)
      .set({
        shortDescription: input.shortDescription,
        description: input.description,
        usageInstructions: input.usage || null,
        ingredients: input.ingredients || null,
        warnings: input.warnings || null,
      })
      .where(eq(productContent.productId, productId)),
    db.insert(catalogAuditLog).values({
      auditId: crypto.randomUUID(),
      productId,
      action: "updated",
      previousReviewStatus: current.reviewStatus,
      nextReviewStatus: input.reviewStatus,
      actorId: actor.userId,
      actorEmail: actor.email,
      changesJson: JSON.stringify(input),
      createdAt: now,
    }),
  ]);

  return findAdminProduct(productId);
}

export async function getCatalogHealth() {
  const db = getDb();
  const rows = await db
    .select({
      reviewStatus: products.reviewStatus,
      priceCents: products.priceCents,
      stockQuantity: products.stockQuantity,
      imagePath: products.imagePath,
      sizeLabel: products.sizeLabel,
      shopifySyncStatus: products.shopifySyncStatus,
    })
    .from(products);

  return rows.reduce(
    (summary, row) => {
      summary.total += 1;
      summary[toReviewStatus(row.reviewStatus)] += 1;
      if (row.priceCents === null) summary.missingPrice += 1;
      if (row.stockQuantity === null) summary.missingStock += 1;
      if (!row.imagePath) summary.missingImage += 1;
      if (!row.sizeLabel) summary.missingSize += 1;
      if (row.shopifySyncStatus === "synced") summary.shopifySynced += 1;
      if (row.shopifySyncStatus === "error") summary.shopifyErrors += 1;
      return summary;
    },
    {
      total: 0,
      pending: 0,
      reviewed: 0,
      published: 0,
      missingPrice: 0,
      missingStock: 0,
      missingImage: 0,
      missingSize: 0,
      shopifySynced: 0,
      shopifyErrors: 0,
    },
  );
}
