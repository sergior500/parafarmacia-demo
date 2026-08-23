const TOKEN_VERSION = "v1";
const OAUTH_ATTEMPT_TTL_MS = 10 * 60 * 1000;

export interface CustomerOAuthAttempt {
  state: string;
  verifier: string;
  nonce: string;
  returnTo: string;
  issuedAt: number;
}

export class CustomerAccountSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerAccountSecurityError";
  }
}

export function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBytes(bytes);
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return encodeBytes(new Uint8Array(digest));
}

export async function createPkceChallenge(verifier: string): Promise<string> {
  return sha256Base64Url(verifier);
}

export async function encryptCustomerSecret(
  value: string,
  secretOverride?: string,
): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(secretOverride),
    new TextEncoder().encode(value),
  );
  return [
    TOKEN_VERSION,
    encodeBytes(iv),
    encodeBytes(new Uint8Array(encrypted)),
  ].join(".");
}

export async function decryptCustomerSecret(
  value: string,
  secretOverride?: string,
): Promise<string | null> {
  const [version, encodedIv, encodedCiphertext, ...extra] = value.split(".");
  if (
    version !== TOKEN_VERSION ||
    !encodedIv ||
    !encodedCiphertext ||
    extra.length
  ) {
    return null;
  }
  try {
    const iv = decodeBytes(encodedIv).buffer as ArrayBuffer;
    const ciphertext = decodeBytes(encodedCiphertext).buffer as ArrayBuffer;
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await encryptionKey(secretOverride),
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export async function encodeOAuthAttempt(
  attempt: CustomerOAuthAttempt,
  secretOverride?: string,
): Promise<string> {
  return encryptCustomerSecret(JSON.stringify(attempt), secretOverride);
}

export async function decodeOAuthAttempt(
  value: string | undefined,
  options: { now?: number; secret?: string } = {},
): Promise<CustomerOAuthAttempt | null> {
  if (!value || value.length > 4_096) return null;
  const decrypted = await decryptCustomerSecret(value, options.secret);
  if (!decrypted) return null;
  try {
    const parsed = JSON.parse(decrypted) as Partial<CustomerOAuthAttempt>;
    const now = options.now ?? Date.now();
    if (
      typeof parsed.state !== "string" ||
      parsed.state.length < 32 ||
      typeof parsed.verifier !== "string" ||
      parsed.verifier.length < 32 ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length < 32 ||
      typeof parsed.returnTo !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      parsed.issuedAt > now + 30_000 ||
      now - parsed.issuedAt > OAUTH_ATTEMPT_TTL_MS
    ) {
      return null;
    }
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      nonce: parsed.nonce,
      returnTo: safeCustomerReturnPath(parsed.returnTo),
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export function safeCustomerReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/cuenta";
  try {
    const url = new URL(value, "https://picual.local");
    if (url.origin !== "https://picual.local") return "/cuenta";
    if (!url.pathname.startsWith("/cuenta")) return "/cuenta";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/cuenta";
  }
}

export function validateIdTokenClaims(
  idToken: string,
  expected: { nonce: string; clientId: string; now?: number },
): boolean {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3 || !parts[1]) return false;
    const claims = JSON.parse(
      new TextDecoder().decode(decodeBytes(parts[1])),
    ) as { nonce?: unknown; aud?: unknown; exp?: unknown };
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const now = Math.floor((expected.now ?? Date.now()) / 1000);
    return Boolean(
      typeof claims.nonce === "string" &&
      constantTimeEqual(claims.nonce, expected.nonce) &&
      audiences.includes(expected.clientId) &&
      typeof claims.exp === "number" &&
      claims.exp >= now - 30,
    );
  } catch {
    return false;
  }
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function customerSessionSecret(override?: string): string {
  const value = override ?? process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV !== "production") {
    return "local-customer-session-secret-change-before-production";
  }
  throw new CustomerAccountSecurityError(
    "La protección de las cuentas de cliente no está configurada.",
  );
}

async function encryptionKey(secretOverride?: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(customerSessionSecret(secretOverride)),
  );
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
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
