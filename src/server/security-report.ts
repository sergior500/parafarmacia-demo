import { getDb } from "@db/index";
import { securityEventLog } from "@db/schema";
import { desc } from "drizzle-orm";

export interface SecurityEventSummary {
  eventId: string;
  requestId: string;
  actorEmail: string | null;
  actorRole: string | null;
  eventType: string;
  outcome: string;
  method: string;
  route: string;
  detail: string | null;
  createdAt: string;
}

export async function getRecentSecurityEvents(
  limit = 100,
): Promise<SecurityEventSummary[]> {
  return getDb()
    .select({
      eventId: securityEventLog.eventId,
      requestId: securityEventLog.requestId,
      actorEmail: securityEventLog.actorEmail,
      actorRole: securityEventLog.actorRole,
      eventType: securityEventLog.eventType,
      outcome: securityEventLog.outcome,
      method: securityEventLog.method,
      route: securityEventLog.route,
      detail: securityEventLog.detail,
      createdAt: securityEventLog.createdAt,
    })
    .from(securityEventLog)
    .orderBy(desc(securityEventLog.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}
