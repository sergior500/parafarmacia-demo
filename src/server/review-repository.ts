import { getDb } from "@db/index";
import { productReviews, products } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

import type {
  ProductReview,
  ProductReviewStatus,
  ProductReviewSubmission,
  ProductReviewSummary,
} from "@/domain/review/review";
import type { AdminActor } from "@/server/admin-auth";

export interface AdminProductReview extends ProductReview {
  productName: string;
  productSlug: string;
  status: ProductReviewStatus;
  moderatedAt?: string;
}

function toPublicReview(
  row: typeof productReviews.$inferSelect,
): ProductReview {
  return {
    id: row.reviewId,
    productId: row.productId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: row.verifiedPurchase,
    createdAt: row.createdAt,
  };
}

export async function listApprovedProductReviews(
  productId: string,
): Promise<ProductReview[]> {
  const rows = await getDb()
    .select()
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, "approved"),
      ),
    )
    .orderBy(desc(productReviews.createdAt));
  return rows.map(toPublicReview);
}

export function summarizeProductReviews(
  reviews: readonly Pick<ProductReview, "rating">[],
): ProductReviewSummary {
  if (!reviews.length) return { averageRating: 0, totalReviews: 0 };
  return {
    averageRating:
      Math.round(
        (reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length) *
          10,
      ) / 10,
    totalReviews: reviews.length,
  };
}

export async function hasCustomerProductReview(
  productId: string,
  customerIdHash: string,
): Promise<boolean> {
  const rows = await getDb()
    .select({ reviewId: productReviews.reviewId })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.customerIdHash, customerIdHash),
      ),
    )
    .limit(1);
  return Boolean(rows[0]);
}

export async function createProductReview(
  input: ProductReviewSubmission,
  customerIdHash: string,
): Promise<ProductReview> {
  const now = new Date().toISOString();
  const row: typeof productReviews.$inferInsert = {
    reviewId: crypto.randomUUID(),
    productId: input.productId,
    customerIdHash,
    rating: input.rating,
    title: input.title,
    body: input.body,
    status: "pending",
    verifiedPurchase: true,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(productReviews).values(row);
  return {
    id: row.reviewId,
    productId: row.productId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: true,
    createdAt: now,
  };
}

export async function listAdminProductReviews(): Promise<AdminProductReview[]> {
  const rows = await getDb()
    .select({ review: productReviews, product: products })
    .from(productReviews)
    .innerJoin(products, eq(productReviews.productId, products.productId))
    .orderBy(desc(productReviews.createdAt));
  return rows.map(({ review, product }) => ({
    ...toPublicReview(review),
    productName: product.name,
    productSlug: product.slug,
    status:
      review.status === "approved" || review.status === "rejected"
        ? review.status
        : "pending",
    moderatedAt: review.moderatedAt ?? undefined,
  }));
}

export async function moderateProductReview(
  reviewId: string,
  status: Exclude<ProductReviewStatus, "pending">,
  actor: AdminActor,
): Promise<boolean> {
  const result = await getDb()
    .update(productReviews)
    .set({
      status,
      moderatedBy: actor.userId,
      moderatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(productReviews.reviewId, reviewId));
  return Boolean(result.meta.changes);
}
