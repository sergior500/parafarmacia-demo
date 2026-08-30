import type { Metadata } from "next";

import { ReviewsManager } from "@/features/admin/reviews-manager";
import {
  hasAdminCapability,
  requireAdminCapability,
} from "@/server/admin-auth";
import { listAdminProductReviews } from "@/server/review-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reseñas · Panel interno",
};

export default async function ReviewsPage() {
  const actor = await requireAdminCapability("reviews:read", "/admin/resenas");
  const reviews = await listAdminProductReviews();
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Confianza y moderación</p>
        <h1 className="display-title text-forest mt-2 text-5xl">Reseñas</h1>
        <p className="text-ink-muted mt-3 max-w-3xl">
          Solo llegan opiniones asociadas a compras pagadas en Shopify. La
          identidad del cliente no se muestra ni se almacena en claro.
        </p>
      </header>
      <ReviewsManager
        canModerate={hasAdminCapability(actor, "reviews:moderate")}
        initialReviews={reviews}
      />
    </>
  );
}
