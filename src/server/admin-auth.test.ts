import { describe, expect, it } from "vitest";

import {
  hasAdminCapability,
  isAdminIdentityAllowed,
  isSameOriginRequest,
  resolveAdminRole,
} from "@/server/admin-auth";

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

  it("asigna el rol más privilegiado cuando una identidad aparece en varias listas", () => {
    expect(
      resolveAdminRole(identity, {
        ownerEmails: "admin@picual.example",
        auditorEmails: "admin@picual.example",
      }),
    ).toBe("owner");
  });

  it("separa las capacidades de catálogo, operaciones y auditoría", () => {
    expect(
      hasAdminCapability({ role: "catalog_manager" }, "catalog:write"),
    ).toBe(true);
    expect(
      hasAdminCapability({ role: "catalog_manager" }, "orders:fulfill"),
    ).toBe(false);
    expect(
      hasAdminCapability({ role: "operations_manager" }, "orders:fulfill"),
    ).toBe(true);
    expect(
      hasAdminCapability({ role: "operations_manager" }, "orders:cancel"),
    ).toBe(true);
    expect(
      hasAdminCapability({ role: "catalog_manager" }, "orders:cancel"),
    ).toBe(false);
    expect(hasAdminCapability({ role: "auditor" }, "inventory:write")).toBe(
      false,
    );
    expect(hasAdminCapability({ role: "owner" }, "team:write")).toBe(true);
    expect(
      hasAdminCapability({ role: "operations_manager" }, "team:read"),
    ).toBe(false);
  });
});

describe("isSameOriginRequest", () => {
  it("acepta únicamente el origen exacto", () => {
    expect(
      isSameOriginRequest(
        new Request("https://farmacia.example/api/admin/products", {
          method: "POST",
          headers: {
            origin: "https://farmacia.example",
            "sec-fetch-site": "same-origin",
          },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginRequest(
        new Request("https://farmacia.example/api/admin/products", {
          method: "POST",
          headers: {
            origin: "https://evil.example",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toBe(false);
  });
});
