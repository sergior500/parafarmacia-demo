import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { type AdminRole, isAdminRole } from "@/server/admin-roles";

export {
  type AdminRole,
  adminRoleLabel,
  isAdminRole,
} from "@/server/admin-roles";

export interface AdminActor {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

type AuthenticatedIdentity = AdminActor;

export type AdminCapability =
  | "dashboard:read"
  | "catalog:read"
  | "catalog:write"
  | "catalog:publish"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:fulfill"
  | "orders:cancel"
  | "orders:refund"
  | "customers:read"
  | "reviews:read"
  | "reviews:moderate"
  | "discounts:read"
  | "discounts:write"
  | "shopify:manage"
  | "security:read"
  | "team:read"
  | "team:write"
  | "readiness:write";

const ROLE_CAPABILITIES: Record<AdminRole, ReadonlySet<AdminCapability>> = {
  owner: new Set<AdminCapability>([
    "dashboard:read",
    "catalog:read",
    "catalog:write",
    "catalog:publish",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:fulfill",
    "orders:cancel",
    "orders:refund",
    "customers:read",
    "reviews:read",
    "reviews:moderate",
    "discounts:read",
    "discounts:write",
    "shopify:manage",
    "security:read",
    "team:read",
    "team:write",
    "readiness:write",
  ]),
  catalog_manager: new Set<AdminCapability>([
    "dashboard:read",
    "catalog:read",
    "catalog:write",
    "catalog:publish",
    "discounts:read",
    "discounts:write",
    "reviews:read",
    "reviews:moderate",
    "inventory:read",
    "inventory:write",
  ]),
  operations_manager: new Set<AdminCapability>([
    "dashboard:read",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:fulfill",
    "orders:cancel",
    "orders:refund",
    "customers:read",
    "reviews:read",
  ]),
  auditor: new Set<AdminCapability>([
    "dashboard:read",
    "catalog:read",
    "inventory:read",
    "orders:read",
    "reviews:read",
    "security:read",
  ]),
};

interface AdminRoleConfiguration {
  allowedEmails?: string;
  allowedUserIds?: string;
  ownerEmails?: string;
  ownerUserIds?: string;
  catalogManagerEmails?: string;
  catalogManagerUserIds?: string;
  operationsManagerEmails?: string;
  operationsManagerUserIds?: string;
  auditorEmails?: string;
  auditorUserIds?: string;
}

function parseAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminIdentityAllowed(
  identity: Pick<AuthenticatedIdentity, "userId" | "email">,
  configuration: AdminRoleConfiguration = adminRoleConfiguration(),
): boolean {
  return resolveAdminRole(identity, configuration) !== null;
}

export function resolveAdminRole(
  identity: Pick<AuthenticatedIdentity, "userId" | "email">,
  configuration: AdminRoleConfiguration = adminRoleConfiguration(),
): AdminRole | null {
  const email = identity.email.trim().toLowerCase();
  const userId = identity.userId.trim().toLowerCase();
  const matches = (emails?: string, userIds?: string) =>
    parseAllowlist(emails).has(email) || parseAllowlist(userIds).has(userId);

  if (
    matches(configuration.ownerEmails, configuration.ownerUserIds) ||
    matches(configuration.allowedEmails, configuration.allowedUserIds)
  ) {
    return "owner";
  }
  if (
    matches(
      configuration.catalogManagerEmails,
      configuration.catalogManagerUserIds,
    )
  ) {
    return "catalog_manager";
  }
  if (
    matches(
      configuration.operationsManagerEmails,
      configuration.operationsManagerUserIds,
    )
  ) {
    return "operations_manager";
  }
  if (matches(configuration.auditorEmails, configuration.auditorUserIds)) {
    return "auditor";
  }
  return null;
}

export function hasAdminCapability(
  actor: Pick<AdminActor, "role">,
  capability: AdminCapability,
): boolean {
  return ROLE_CAPABILITIES[actor.role].has(capability);
}

async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id")?.trim();
  const email = requestHeaders
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();
  const encodedFullName = requestHeaders
    .get("oai-authenticated-user-full-name")
    ?.trim();
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? safeDecodeURIComponent(encodedFullName)
      : null;
  if (!userId || !email) return null;
  return { userId, email, displayName: fullName || email, role: "auditor" };
}

export async function getAdminActor(): Promise<AdminActor | null> {
  if (process.env.NODE_ENV !== "production") return localAdminActor();
  const identity = await getAuthenticatedIdentity();
  if (!identity) return null;
  const role = await resolvePersistedAdminRole(identity);
  return role ? { ...identity, role } : null;
}

export async function requireAdminActor(
  returnTo = "/admin",
): Promise<AdminActor> {
  if (process.env.NODE_ENV !== "production") return localAdminActor();
  const identity = await getAuthenticatedIdentity();
  if (!identity) redirect(signInPath(returnTo));
  const role = await resolvePersistedAdminRole(identity);
  if (!role) notFound();
  return { ...identity, role };
}

export async function requireAdminCapability(
  capability: AdminCapability,
  returnTo = "/admin",
): Promise<AdminActor> {
  const actor = await requireAdminActor(returnTo);
  if (!hasAdminCapability(actor, capability)) notFound();
  return actor;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(
    origin &&
    origin === new URL(request.url).origin &&
    (!fetchSite || fetchSite === "same-origin"),
  );
}

function localAdminActor(): AdminActor {
  return {
    userId: "local-admin",
    email: "local-admin@localhost.invalid",
    displayName: "Administración local",
    role: "owner",
  };
}

async function resolvePersistedAdminRole(
  identity: Pick<AuthenticatedIdentity, "userId" | "email">,
): Promise<AdminRole | null> {
  const configuredRole = resolveAdminRole(identity);
  if (configuredRole) return configuredRole;
  try {
    const { findAdminUserByIdentity } = await import("@/server/admin-users");
    const user = await findAdminUserByIdentity(identity);
    return user && isAdminRole(user.role) ? user.role : null;
  } catch (error) {
    console.error(
      "No se pudo verificar el acceso administrativo persistente.",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return null;
  }
}

function adminRoleConfiguration(): AdminRoleConfiguration {
  return {
    allowedEmails: process.env.ADMIN_ALLOWED_EMAILS,
    allowedUserIds: process.env.ADMIN_ALLOWED_USER_IDS,
    ownerEmails: process.env.ADMIN_OWNER_EMAILS,
    ownerUserIds: process.env.ADMIN_OWNER_USER_IDS,
    catalogManagerEmails: process.env.ADMIN_CATALOG_MANAGER_EMAILS,
    catalogManagerUserIds: process.env.ADMIN_CATALOG_MANAGER_USER_IDS,
    operationsManagerEmails: process.env.ADMIN_OPERATIONS_MANAGER_EMAILS,
    operationsManagerUserIds: process.env.ADMIN_OPERATIONS_MANAGER_USER_IDS,
    auditorEmails: process.env.ADMIN_AUDITOR_EMAILS,
    auditorUserIds: process.env.ADMIN_AUDITOR_USER_IDS,
  };
}

function signInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
