import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export interface AdminActor {
  userId: string;
  email: string;
  displayName: string;
}

type AuthenticatedIdentity = AdminActor;

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
  configuration: {
    allowedEmails?: string;
    allowedUserIds?: string;
  } = {
    allowedEmails: process.env.ADMIN_ALLOWED_EMAILS,
    allowedUserIds: process.env.ADMIN_ALLOWED_USER_IDS,
  },
): boolean {
  const allowedEmails = parseAllowlist(configuration.allowedEmails);
  const allowedUserIds = parseAllowlist(configuration.allowedUserIds);
  if (!allowedEmails.size && !allowedUserIds.size) return false;
  return (
    allowedEmails.has(identity.email.trim().toLowerCase()) ||
    allowedUserIds.has(identity.userId.trim().toLowerCase())
  );
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
  return { userId, email, displayName: fullName || email };
}

export async function getAdminActor(): Promise<AdminActor | null> {
  if (process.env.NODE_ENV !== "production") return localAdminActor();
  const identity = await getAuthenticatedIdentity();
  return identity && isAdminIdentityAllowed(identity) ? identity : null;
}

export async function requireAdminActor(
  returnTo = "/admin",
): Promise<AdminActor> {
  if (process.env.NODE_ENV !== "production") return localAdminActor();
  const identity = await getAuthenticatedIdentity();
  if (!identity) redirect(signInPath(returnTo));
  if (!isAdminIdentityAllowed(identity)) notFound();
  return identity;
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
