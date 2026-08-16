import { getDb } from "@db/index";
import { securityEventLog } from "@db/schema";
import { lt } from "drizzle-orm";

import type { AdminActor } from "@/server/admin-auth";
import { securityFingerprint } from "@/server/admin-csrf";

export async function recordSecurityEvent(
  request: Request,
  input: {
    actor?: AdminActor | null;
    eventType: string;
    outcome: "blocked" | "allowed" | "error";
    detail?: string;
  },
): Promise<boolean> {
  try {
    const url = new URL(request.url);
    const network =
      request.headers.get("cf-connecting-ip")?.trim() || "unknown";
    const userAgent =
      request.headers.get("user-agent")?.slice(0, 512) || "unknown";
    const db = getDb();
    await db.insert(securityEventLog).values({
      eventId: crypto.randomUUID(),
      requestId:
        request.headers.get("x-picual-request-id")?.slice(0, 100) ||
        crypto.randomUUID(),
      actorId: input.actor?.userId,
      actorEmail: input.actor?.email,
      actorRole: input.actor?.role,
      eventType: input.eventType.slice(0, 100),
      outcome: input.outcome,
      method: request.method.slice(0, 12),
      route: url.pathname.slice(0, 500),
      networkFingerprint: await securityFingerprint(network),
      userAgentFingerprint: await securityFingerprint(userAgent),
      detail: input.detail?.slice(0, 500),
      createdAt: new Date().toISOString(),
    });
    await db
      .delete(securityEventLog)
      .where(
        lt(
          securityEventLog.createdAt,
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        ),
      );
    return true;
  } catch (error) {
    console.error(
      "No se pudo registrar un evento de seguridad.",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return false;
  }
}
