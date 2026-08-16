import { getDb } from "@db/index";
import { adminOperationLog } from "@db/schema";

import type { AdminActor } from "@/server/admin-auth";

export async function recordAdminOperation(input: {
  actor: AdminActor;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const metadataJson = JSON.stringify(input.metadata ?? {}).slice(0, 4_096);
    await getDb()
      .insert(adminOperationLog)
      .values({
        auditId: crypto.randomUUID(),
        actorId: input.actor.userId,
        actorEmail: input.actor.email,
        action: input.action.slice(0, 100),
        resourceType: input.resourceType.slice(0, 100),
        resourceId: input.resourceId?.slice(0, 255),
        metadataJson,
        createdAt: new Date().toISOString(),
      });
    return true;
  } catch (error) {
    console.error(
      "No se pudo registrar una operación administrativa.",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return false;
  }
}
