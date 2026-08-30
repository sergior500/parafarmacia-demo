import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminActor, hasAdminCapability } from "@/server/admin-auth";

import { SiteFooter } from "./site-footer";

vi.mock("@/server/admin-auth", () => ({
  getAdminActor: vi.fn(),
  hasAdminCapability: vi.fn(),
}));

const mockedGetAdminActor = vi.mocked(getAdminActor);
const mockedHasAdminCapability = vi.mocked(hasAdminCapability);

describe("SiteFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oculta el acceso interno cuando no hay una sesión autorizada", async () => {
    mockedGetAdminActor.mockResolvedValue(null);

    render(await SiteFooter());

    expect(
      screen.queryByRole("link", { name: "Acceso al panel interno" }),
    ).not.toBeInTheDocument();
    expect(mockedHasAdminCapability).not.toHaveBeenCalled();
  });

  it("muestra el acceso interno cuando la sesión tiene permiso", async () => {
    const actor = {
      userId: "owner-id",
      email: "owner@example.com",
      displayName: "Owner",
      role: "owner" as const,
    };
    mockedGetAdminActor.mockResolvedValue(actor);
    mockedHasAdminCapability.mockReturnValue(true);

    render(await SiteFooter());

    expect(
      screen.getByRole("link", { name: "Acceso al panel interno" }),
    ).toHaveAttribute("href", "/admin");
    expect(mockedHasAdminCapability).toHaveBeenCalledWith(
      actor,
      "dashboard:read",
    );
  });

  it("oculta el acceso interno si la sesión carece del permiso", async () => {
    mockedGetAdminActor.mockResolvedValue({
      userId: "limited-id",
      email: "limited@example.com",
      displayName: "Limited",
      role: "auditor",
    });
    mockedHasAdminCapability.mockReturnValue(false);

    render(await SiteFooter());

    expect(
      screen.queryByRole("link", { name: "Acceso al panel interno" }),
    ).not.toBeInTheDocument();
  });
});
