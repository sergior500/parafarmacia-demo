import { describe, expect, it } from "vitest";

import { isAdminIdentityAllowed } from "@/server/admin-auth";

describe("isAdminIdentityAllowed", () => {
  const identity = { userId: "user-123", email: "admin@picual.example" };

  it("falla de forma cerrada cuando no hay lista de administradores", () => {
    expect(
      isAdminIdentityAllowed(identity, {
        allowedEmails: "",
        allowedUserIds: "",
      }),
    ).toBe(false);
  });

  it("acepta correos exactos ignorando espacios y mayúsculas", () => {
    expect(
      isAdminIdentityAllowed(identity, {
        allowedEmails: " otro@example.com, ADMIN@PICUAL.EXAMPLE ",
      }),
    ).toBe(true);
  });

  it("no acepta coincidencias parciales", () => {
    expect(
      isAdminIdentityAllowed(identity, {
        allowedEmails: "superadmin@picual.example",
      }),
    ).toBe(false);
  });

  it("también permite una identidad estable configurada", () => {
    expect(
      isAdminIdentityAllowed(identity, {
        allowedUserIds: "user-123",
      }),
    ).toBe(true);
  });
});
