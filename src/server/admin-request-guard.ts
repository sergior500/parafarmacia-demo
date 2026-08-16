import { NextResponse } from "next/server";

import {
  type AdminActor,
  type AdminCapability,
  getAdminActor,
  hasAdminCapability,
  isSameOriginRequest,
} from "@/server/admin-auth";
import {
  AdminSecurityConfigurationError,
  verifyAdminCsrfToken,
} from "@/server/admin-csrf";
import {
  ADMIN_RATE_LIMITS,
  adminMutationRateLimitResponse,
  type AdminRateLimitPolicy,
} from "@/server/admin-security";
import { recordSecurityEvent } from "@/server/security-audit";

export type AdminGuardResult =
  | { actor: AdminActor; response?: never }
  | { actor?: never; response: Response };

export async function authorizeAdminRead(
  capability: AdminCapability,
): Promise<AdminGuardResult> {
  const actor = await getAdminActor();
  if (!actor) {
    return {
      response: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }
  if (!hasAdminCapability(actor, capability)) {
    return {
      response: NextResponse.json(
        { error: "Acceso denegado." },
        { status: 403 },
      ),
    };
  }
  return { actor };
}

export async function authorizeAdminMutation(
  request: Request,
  options: {
    capability: AdminCapability;
    rateLimit?: AdminRateLimitPolicy;
  },
): Promise<AdminGuardResult> {
  const actor = await getAdminActor();
  if (!actor) {
    await recordSecurityEvent(request, {
      eventType: "admin.authentication_failed",
      outcome: "blocked",
    });
    return {
      response: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }
  if (!hasAdminCapability(actor, options.capability)) {
    await recordSecurityEvent(request, {
      actor,
      eventType: "admin.authorization_failed",
      outcome: "blocked",
      detail: options.capability,
    });
    return {
      response: NextResponse.json(
        { error: "Acceso denegado." },
        { status: 403 },
      ),
    };
  }
  if (!isSameOriginRequest(request)) {
    await recordSecurityEvent(request, {
      actor,
      eventType: "admin.origin_rejected",
      outcome: "blocked",
    });
    return {
      response: NextResponse.json(
        { error: "Origen no permitido." },
        { status: 403 },
      ),
    };
  }

  try {
    const validCsrf = await verifyAdminCsrfToken(
      request.headers.get("x-picual-csrf-token"),
      actor,
      new URL(request.url).origin,
    );
    if (!validCsrf) {
      await recordSecurityEvent(request, {
        actor,
        eventType: "admin.csrf_rejected",
        outcome: "blocked",
      });
      return {
        response: NextResponse.json(
          { error: "La sesión de seguridad ha caducado. Repite la operación." },
          { status: 419 },
        ),
      };
    }
  } catch (error) {
    if (error instanceof AdminSecurityConfigurationError) {
      return {
        response: NextResponse.json({ error: error.message }, { status: 503 }),
      };
    }
    throw error;
  }

  const rateLimited = await adminMutationRateLimitResponse(
    request,
    actor.userId,
    options.rateLimit ?? ADMIN_RATE_LIMITS.standard,
  );
  if (rateLimited) {
    await recordSecurityEvent(request, {
      actor,
      eventType: "admin.rate_limited",
      outcome: "blocked",
      detail: options.rateLimit?.scope ?? ADMIN_RATE_LIMITS.standard.scope,
    });
    return { response: rateLimited };
  }
  return { actor };
}
