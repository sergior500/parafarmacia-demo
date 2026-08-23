import type { Metadata } from "next";

import {
  AdminTeamManager,
  type AdminTeamUser,
} from "@/features/admin/admin-team-manager";
import { requireAdminCapability } from "@/server/admin-auth";
import { listAdminUsers } from "@/server/admin-users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Equipo y permisos · Panel interno",
  description: "Usuarios autorizados y roles del panel de Farmacia Picual.",
};

export default async function AdminTeamPage() {
  const actor = await requireAdminCapability("team:read", "/admin/equipo");
  const users: AdminTeamUser[] = (await listAdminUsers()).map((user) => ({
    email: user.email,
    displayName: user.displayName,
    role:
      user.role === "owner" ||
      user.role === "catalog_manager" ||
      user.role === "operations_manager"
        ? user.role
        : "auditor",
    enabled: user.enabled,
    linked: Boolean(user.userId),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Acceso administrativo</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Equipo y permisos
        </h1>
        <p className="text-ink-muted mt-3 max-w-3xl leading-7">
          Cada persona entra con su propia identidad y recibe únicamente las
          funciones necesarias para su trabajo. Los cambios quedan auditados.
        </p>
      </header>
      <AdminTeamManager currentEmail={actor.email} initialUsers={users} />
    </>
  );
}
