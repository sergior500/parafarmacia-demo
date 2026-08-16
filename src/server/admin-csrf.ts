import type { AdminActor } from "@/server/admin-auth";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_SECONDS = 10 * 60;
const CLOCK_SKEW_SECONDS = 30;

export class AdminSecurityConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminSecurityConfigurationError";
  }
}

export async function issueAdminCsrfToken(
  actor: Pick<AdminActor, "userId">,
  origin: string,
  options: { now?: number; secret?: string } = {},
): Promise<{ token: string; expiresAt: string }> {
  const now = Math.floor((options.now ?? Date.now()) / 1000);
  const expiresAt = now + TOKEN_TTL_SECONDS;
  const payload = [
    TOKEN_VERSION,
    String(now),
    String(expiresAt),
    encodeText(actor.userId),
    encodeText(origin),
  ].join(".");
  const signature = await sign(payload, options.secret);
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

export async function verifyAdminCsrfToken(
  token: string | null,
  actor: Pick<AdminActor, "userId">,
  origin: string,
  options: { now?: number; secret?: string } = {},
): Promise<boolean> {
  if (!token || token.length > 2_048) return false;
  const parts = token.split(".");
  if (parts.length !== 6 || parts[0] !== TOKEN_VERSION) return false;
  const [
    version,
    issuedRaw,
    expiresRaw,
    encodedUser,
    encodedOrigin,
    signature,
  ] = parts as [string, string, string, string, string, string];
  const issuedAt = Number(issuedRaw);
  const expiresAt = Number(expiresRaw);
  const now = Math.floor((options.now ?? Date.now()) / 1000);
  if (
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    issuedAt > now + CLOCK_SKEW_SECONDS ||
    expiresAt < now ||
    expiresAt - issuedAt !== TOKEN_TTL_SECONDS
  ) {
    return false;
  }
  if (
    decodeText(encodedUser) !== actor.userId ||
    decodeText(encodedOrigin) !== origin
  ) {
    return false;
  }
  const payload = [
    version,
    issuedRaw,
    expiresRaw,
    encodedUser,
    encodedOrigin,
  ].join(".");
  return verifySignature(payload, signature, options.secret);
}

export async function securityFingerprint(value: string): Promise<string> {
  const signature = await sign(`fingerprint:${value}`);
  return signature.slice(0, 32);
}

function securitySecret(override?: string): string {
  const value = override ?? process.env.ADMIN_SECURITY_SECRET?.trim();
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV !== "production") {
    return "local-development-only-security-secret-change-me";
  }
  throw new AdminSecurityConfigurationError(
    "La protección administrativa no está configurada.",
  );
}

async function hmacKey(secret?: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(securitySecret(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string, secret?: string): Promise<string> {
  const bytes = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(value),
  );
  return encodeBytes(new Uint8Array(bytes));
}

async function verifySignature(
  value: string,
  signature: string,
  secret?: string,
): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      decodeBytes(signature).buffer as ArrayBuffer,
      new TextEncoder().encode(value),
    );
  } catch {
    return false;
  }
}

function encodeText(value: string): string {
  return encodeBytes(new TextEncoder().encode(value));
}

function decodeText(value: string): string | null {
  try {
    return new TextDecoder().decode(decodeBytes(value));
  } catch {
    return null;
  }
}

function encodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Base64url no válido.");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
