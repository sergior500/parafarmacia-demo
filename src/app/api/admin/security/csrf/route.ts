import { NextResponse } from "next/server";

import { getAdminActor } from "@/server/admin-auth";
import {
  AdminSecurityConfigurationError,
  issueAdminCsrfToken,
} from "@/server/admin-csrf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const result = await issueAdminCsrfToken(
      actor,
      new URL(request.url).origin,
    );
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AdminSecurityConfigurationError
            ? error.message
            : "No se pudo preparar la operación segura.",
      },
      { status: 503 },
    );
  }
}
