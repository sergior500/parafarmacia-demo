import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export interface AdminActor {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

type AuthenticatedIdentity = AdminActor;

export type AdminRole =
  "owner" | "catalog_manager" | "operations_manager" | "auditor";

export type AdminCapability =
  | "dashboard:read"
  | "catalog:read"
  | "catalog:write"
  | "catalog:publish"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:fulfill"
  | "shopify:manage"
  | "security:read"
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
    "shopify:manage",
    "security:read",
    "readiness:write",
  ]),
  catalog_manager: new Set<AdminCapability>([
    "dashboard:read",
    "catalog:read",
    "catalog:write",
    "catalog:publish",
    "inventory:read",
    "inventory:write",
  ]),
  operations_manager: new Set<AdminCapability>([
    "dashboard:read",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:fulfill",
  ]),
  auditor: new Set<AdminCapability>([
    "dashboard:read",
    "catalog:read",
    "inventory:read",
    "orders:read",
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

export function adminRoleLabel(role: AdminRole): string {
  return {
    owner: "Propietario",
    catalog_manager: "Catálogo",
    operations_manager: "Operaciones",
    auditor: "Solo lectura",
  }[role];
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
  const role = resolveAdminRole(identity);
  return role ? { ...identity, role } : null;
}

export async function requireAdminActor(
  returnTo = "/admin",
): Promise<AdminActor> {
  if (process.env.NODE_ENV !== "production") return localAdminActor();
  const identity = await getAuthenticatedIdentity();
  if (!identity) redirect(signInPath(returnTo));
  const role = resolveAdminRole(identity);
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
    email: "local@demo.invalid",
    displayName: "Administración local",
    role: "owner",
  };
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
