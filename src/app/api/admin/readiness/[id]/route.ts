import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminActor, isSameOriginRequest } from "@/server/admin-auth";
import {
  isManualReadinessCheckId,
  setManualReadinessCheck,
} from "@/server/production-readiness";
import {
  readLimitedJsonBody,
  requestBodyErrorResponse,
} from "@/server/request-security";

export const dynamic = "force-dynamic";

const updateSchema = z.object({ ready: z.boolean() }).strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await getAdminActor();
  if (!actor)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!isManualReadinessCheckId(id)) {
    return NextResponse.json(
      { error: "Comprobación no reconocida." },
      { status: 404 },
    );
  }

  try {
    const parsed = updateSchema.safeParse(
      await readLimitedJsonBody(request, 2048),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "El estado enviado no es válido." },
        { status: 400 },
      );
    }
    await setManualReadinessCheck(id, parsed.data.ready, actor);
    return NextResponse.json({ checkId: id, ready: parsed.data.ready });
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la comprobación.",
      },
      { status: 500 },
    );
  }
}
