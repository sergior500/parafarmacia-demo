import { describe, expect, it } from "vitest";

import {
  constantTimeEqual,
  decodeOAuthAttempt,
  decryptCustomerSecret,
  encodeOAuthAttempt,
  encryptCustomerSecret,
  safeCustomerReturnPath,
  validateIdTokenClaims,
} from "@/server/shopify/customer-account-security";

const secret = "test-customer-session-secret-with-at-least-32-characters";

describe("customer account security", () => {
  it("cifra y autentica los valores sensibles", async () => {
    const encrypted = await encryptCustomerSecret("access-token", secret);
    expect(encrypted).not.toContain("access-token");
    await expect(decryptCustomerSecret(encrypted, secret)).resolves.toBe(
      "access-token",
    );
    const parts = encrypted.split(".");
    const ciphertext = parts[2];
    if (!ciphertext) throw new Error("Cifrado de prueba incompleto.");
    const replacement = ciphertext[0] === "A" ? "B" : "A";
    const tampered = [
      parts[0],
      parts[1],
      `${replacement}${ciphertext.slice(1)}`,
    ].join(".");
    await expect(decryptCustomerSecret(tampered, secret)).resolves.toBeNull();
  });

  it("caduca el intento OAuth y limita el retorno a la cuenta", async () => {
    const now = Date.now();
    const value = await encodeOAuthAttempt(
      {
        state: "s".repeat(32),
        verifier: "v".repeat(48),
        nonce: "n".repeat(32),
        returnTo: "/cuenta?seccion=pedidos",
        issuedAt: now,
      },
      secret,
    );
    await expect(
      decodeOAuthAttempt(value, { now: now + 60_000, secret }),
    ).resolves.toMatchObject({ returnTo: "/cuenta?seccion=pedidos" });
    await expect(
      decodeOAuthAttempt(value, { now: now + 11 * 60_000, secret }),
    ).resolves.toBeNull();
    expect(safeCustomerReturnPath("//evil.example")).toBe("/cuenta");
    expect(safeCustomerReturnPath("/admin")).toBe("/cuenta");
  });

  it("comprueba estado y nonce sin comparaciones parciales", () => {
    expect(constantTimeEqual("exacto", "exacto")).toBe(true);
    expect(constantTimeEqual("exacto", "exacto-mal")).toBe(false);
    const now = Date.now();
    const token = jwt({
      nonce: "nonce-correcto",
      aud: "cliente-correcto",
      exp: Math.floor(now / 1000) + 300,
    });
    expect(
      validateIdTokenClaims(token, {
        nonce: "nonce-correcto",
        clientId: "cliente-correcto",
        now,
      }),
    ).toBe(true);
    expect(
      validateIdTokenClaims(token, {
        nonce: "otro-nonce",
        clientId: "cliente-correcto",
        now,
      }),
    ).toBe(false);
  });
});

function jwt(payload: Record<string, unknown>) {
  return `${base64Url({ alg: "RS256" })}.${base64Url(payload)}.signature`;
}

function base64Url(value: Record<string, unknown>) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
