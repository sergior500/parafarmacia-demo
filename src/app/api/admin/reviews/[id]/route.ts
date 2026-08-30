import { NextResponse } from "next/server";

import { productReviewModerationSchema } from "@/domain/review/review";
import { authorizeAdminMutation } from "@/server/admin-request-guard";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";
import { moderateProductReview } from "@/server/review-repository";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeAdminMutation(request, {
    capability: "reviews:moderate",
  });
  if (authorization.response) return authorization.response;

  try {
    const parsed = productReviewModerationSchema.safeParse(
      await readLimitedJsonBody(request, 2048),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "El estado de moderación no es válido." },
        { status: 400 },
      );
    }
    const { id } = await context.params;
    const updated = await moderateProductReview(
      id,
      parsed.data.status,
      authorization.actor,
    );
    return updated
      ? NextResponse.json({ reviewId: id, status: parsed.data.status })
      : NextResponse.json({ error: "Reseña no encontrada." }, { status: 404 });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    return NextResponse.json(
      { error: "No se pudo moderar la reseña." },
      { status: 500 },
    );
  }
}
