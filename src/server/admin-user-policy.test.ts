import { describe, expect, it } from "vitest";

import { validateAdminUserChange } from "@/server/admin-user-policy";

describe("validateAdminUserChange", () => {
  const actor = { email: "owner@picual.example", role: "owner" as const };

  it("impide que el usuario se desactive o se quite privilegios", () => {
    expect(
      validateAdminUserChange({
        actor,
        current: { email: actor.email, role: "owner", enabled: true },
        next: { role: "owner", enabled: false },
        enabledOwners: 2,
      }),
    ).toMatch(/propio rol|desactivar/);
  });

  it("impide eliminar el último propietario operativo", () => {
    expect(
      validateAdminUserChange({
        actor,
        current: {
          email: "other-owner@picual.example",
          role: "owner",
          enabled: true,
        },
        next: { role: "auditor", enabled: true },
        enabledOwners: 1,
      }),
    ).toMatch(/al menos un propietario/);
  });

  it("permite repartir responsabilidades cuando queda otro propietario", () => {
    expect(
      validateAdminUserChange({
        actor,
        current: {
          email: "other-owner@picual.example",
          role: "owner",
          enabled: true,
        },
        next: { role: "operations_manager", enabled: true },
        enabledOwners: 2,
      }),
    ).toBeNull();
  });
});
