import { env } from "cloudflare:workers";

import { securityFingerprint } from "@/server/admin-csrf";
import { consumeRateLimit, type RateWindow } from "@/server/rate-limit";

export interface AdminRateLimitPolicy {
  scope: string;
  limit: number;
  windowMs: number;
}

const mutationWindows = new Map<string, RateWindow>();

export const ADMIN_RATE_LIMITS = {
  standard: { scope: "standard", limit: 30, windowMs: 60_000 },
  catalogImport: { scope: "catalog-import", limit: 5, windowMs: 5 * 60_000 },
  imageUpload: { scope: "image-upload", limit: 10, windowMs: 60_000 },
  shopifySync: { scope: "shopify-sync", limit: 10, windowMs: 5 * 60_000 },
  publication: {
    scope: "shopify-publication",
    limit: 10,
    windowMs: 5 * 60_000,
  },
  inventory: { scope: "inventory", limit: 20, windowMs: 60_000 },
  fulfillment: { scope: "fulfillment", limit: 10, windowMs: 5 * 60_000 },
  shopifyManage: {
    scope: "shopify-manage",
    limit: 5,
    windowMs: 5 * 60_000,
  },
} satisfies Record<string, AdminRateLimitPolicy>;

export async function adminMutationRateLimitResponse(
  request: Request,
  actorId: string,
  policy: AdminRateLimitPolicy = ADMIN_RATE_LIMITS.standard,
): Promise<Response | null> {
  const network = request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  let rateKey: string;
  try {
    rateKey = await securityFingerprint(
      `${actorId}|${network}|${policy.scope}`,
    );
  } catch {
    return unavailableResponse();
  }

  const result =
    process.env.NODE_ENV === "production"
      ? await consumeDurableRateLimit(rateKey, policy).catch(() => null)
      : consumeRateLimit(mutationWindows, rateKey, policy);
  if (!result) return unavailableResponse();
  if (result.allowed) return null;
  return Response.json(
    { error: "Demasiadas operaciones. Espera antes de volver a intentarlo." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

async function consumeDurableRateLimit(
  rateKey: string,
  policy: AdminRateLimitPolicy,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) throw new Error("D1 no está disponible.");
  const now = Date.now();
  const resetAt = now + policy.windowMs;
  const row = await bindings.DB.prepare(
    `INSERT INTO admin_rate_limits (rate_key, count, reset_at, updated_at)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(rate_key) DO UPDATE SET
       count = CASE
         WHEN admin_rate_limits.reset_at <= excluded.updated_at THEN 1
         ELSE admin_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN admin_rate_limits.reset_at <= excluded.updated_at THEN excluded.reset_at
         ELSE admin_rate_limits.reset_at
       END,
       updated_at = excluded.updated_at
     RETURNING count, reset_at`,
  )
    .bind(rateKey, resetAt, now)
    .first<{ count: number; reset_at: number }>();
  if (!row) throw new Error("No se pudo aplicar el límite de seguridad.");
  return {
    allowed: row.count <= policy.limit,
    retryAfterSeconds:
      row.count <= policy.limit
        ? 0
        : Math.max(1, Math.ceil((row.reset_at - now) / 1000)),
  };
}

function unavailableResponse(): Response {
  return Response.json(
    {
      error:
        "La protección contra abuso no está disponible. La operación se ha bloqueado por seguridad.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
