import { z } from "zod";

export type ProductReviewStatus = "pending" | "approved" | "rejected";

export interface ProductReview {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export const productReviewSubmissionSchema = z
  .object({
    productId: z.string().trim().min(1).max(100),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(3).max(90),
    body: z.string().trim().min(20).max(1200),
  })
  .strict();

export const productReviewModerationSchema = z
  .object({ status: z.enum(["approved", "rejected"]) })
  .strict();

export type ProductReviewSubmission = z.infer<
  typeof productReviewSubmissionSchema
>;
