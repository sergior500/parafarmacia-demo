import { getDb } from "@db/index";
import { adminUsers } from "@db/schema";
import { and, asc, eq, isNull, or } from "drizzle-orm";

export interface AdminUserRecord {
  email: string;
  userId?: string;
  shopifyUserId?: string;
  displayName: string;
  role: string;
  enabled: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserInput {
  email: string;
  displayName: string;
  role: string;
  enabled: boolean;
}

function mapAdminUser(row: typeof adminUsers.$inferSelect): AdminUserRecord {
  return {
    email: row.email,
    userId: row.userId ?? undefined,
    shopifyUserId: row.shopifyUserId ?? undefined,
    displayName: row.displayName,
    role: row.role,
    enabled: row.enabled,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Links a Shopify staff identity only after the OAuth layer has validated the
 * token and Shopify has asserted that the email is verified. This function is
 * intentionally not exposed through an admin form: identifiers must never be
 * entered or trusted from the browser.
 */
export async function findAdminUserByShopifyIdentity(identity: {
  shopifyUserId: string;
  email: string;
  emailVerified: boolean;
}): Promise<AdminUserRecord | null> {
  if (!identity.emailVerified) return null;
  const shopifyUserId = identity.shopifyUserId.trim();
  const email = identity.email.trim().toLowerCase();
  if (!shopifyUserId || !email) return null;

  const rows = await getDb()
    .select()
    .from(adminUsers)
    .where(
      or(
        eq(adminUsers.shopifyUserId, shopifyUserId),
        eq(adminUsers.email, email),
      ),
    )
    .limit(2);
  const byShopifyId = rows.find((row) => row.shopifyUserId === shopifyUserId);
  const byEmail = rows.find((row) => row.email === email);
  const match = byShopifyId ?? byEmail;
  if (!match?.enabled) return null;
  if (match.shopifyUserId && match.shopifyUserId !== shopifyUserId) return null;

  if (!match.shopifyUserId) {
    const bound = await getDb()
      .update(adminUsers)
      .set({ shopifyUserId, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(adminUsers.email, match.email),
          isNull(adminUsers.shopifyUserId),
        ),
      )
      .returning();
    if (!bound[0]) return null;
    return mapAdminUser(bound[0]);
  }
  return mapAdminUser(match);
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const rows = await getDb()
    .select()
    .from(adminUsers)
    .orderBy(asc(adminUsers.displayName), asc(adminUsers.email));
  return rows.map(mapAdminUser);
}

export async function findAdminUserByIdentity(identity: {
  userId: string;
  email: string;
}): Promise<AdminUserRecord | null> {
  const email = identity.email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(adminUsers)
    .where(
      or(eq(adminUsers.userId, identity.userId), eq(adminUsers.email, email)),
    )
    .limit(2);
  const byUserId = rows.find((row) => row.userId === identity.userId);
  const byEmail = rows.find((row) => row.email === email);
  const match = byUserId ?? byEmail;
  if (!match?.enabled) return null;
  if (match.userId && match.userId !== identity.userId) return null;

  if (!match.userId) {
    const bound = await getDb()
      .update(adminUsers)
      .set({ userId: identity.userId, updatedAt: new Date().toISOString() })
      .where(and(eq(adminUsers.email, match.email), isNull(adminUsers.userId)))
      .returning();
    if (!bound[0]) return null;
    return mapAdminUser(bound[0]);
  }
  return mapAdminUser(match);
}

export async function createAdminUser(
  input: AdminUserInput,
  actorId: string,
): Promise<AdminUserRecord> {
  const now = new Date().toISOString();
  const inserted = await getDb()
    .insert(adminUsers)
    .values({
      ...input,
      email: input.email.trim().toLowerCase(),
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!inserted[0]) throw new Error("No se pudo crear el acceso.");
  return mapAdminUser(inserted[0]);
}

export async function updateAdminUser(
  input: AdminUserInput,
  actorId: string,
): Promise<AdminUserRecord | null> {
  const updated = await getDb()
    .update(adminUsers)
    .set({
      displayName: input.displayName,
      role: input.role,
      enabled: input.enabled,
      updatedBy: actorId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(adminUsers.email, input.email.trim().toLowerCase()))
    .returning();
  return updated[0] ? mapAdminUser(updated[0]) : null;
}

export async function getAdminUserByEmail(
  email: string,
): Promise<AdminUserRecord | null> {
  const rows = await getDb()
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] ? mapAdminUser(rows[0]) : null;
}

export async function countEnabledOwners(): Promise<number> {
  const rows = await getDb()
    .select({ email: adminUsers.email })
    .from(adminUsers)
    .where(and(eq(adminUsers.enabled, true), eq(adminUsers.role, "owner")));
  return rows.length;
}
