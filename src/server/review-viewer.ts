import { cookies } from "next/headers";

import { findAdminProduct } from "@/server/catalog-repository";
import { hasVerifiedProductPurchase } from "@/server/review-policy";
import { hasCustomerProductReview } from "@/server/review-repository";
import { getCustomerAccountProfile } from "@/server/shopify/customer-account-api";
import { sha256Base64Url } from "@/server/shopify/customer-account-security";
import {
  customerSessionCookieName,
  readCustomerSession,
} from "@/server/shopify/customer-account-session";

export type ProductReviewViewerStatus =
  "guest" | "eligible" | "already_submitted" | "not_purchased" | "unavailable";

export async function getProductReviewViewerStatus(
  productId: string,
): Promise<ProductReviewViewerStatus> {
  const sessionId = (await cookies()).get(customerSessionCookieName())?.value;
  const session = await readCustomerSession(sessionId).catch(() => null);
  if (!session) return "guest";

  try {
    const [profile, product] = await Promise.all([
      getCustomerAccountProfile(session.accessToken),
      findAdminProduct(productId),
    ]);
    if (!product) return "unavailable";
    const customerIdHash = await sha256Base64Url(profile.id);
    if (await hasCustomerProductReview(productId, customerIdHash)) {
      return "already_submitted";
    }
    return hasVerifiedProductPurchase(profile, product)
      ? "eligible"
      : "not_purchased";
  } catch {
    return "unavailable";
  }
}
