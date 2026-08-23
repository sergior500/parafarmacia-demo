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
    developmentIdentityLinked: Boolean(user.userId),
    shopifyIdentityLinked: Boolean(user.shopifyUserId),
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
      <section className="border-forest/10 bg-sage/35 mb-6 rounded-[2rem] border p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow">Transición de acceso protegida</p>
            <h2 className="text-forest mt-1 text-xl font-black">
              Shopify será la identidad definitiva
            </h2>
            <p className="text-ink-muted mt-2 max-w-3xl text-sm leading-6">
              Durante el desarrollo se mantiene el acceso actual. En la tienda
              real, Shopify verificará a cada empleado y este panel conservará
              sus roles y permisos. No se retirará el acceso provisional hasta
              probar al propietario y una vía segura de recuperación.
            </p>
          </div>
          <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-800">
            Migración preparada · activación pendiente
          </span>
        </div>
        <ol className="mt-5 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["1", "Cuenta real", "Transferir la aplicación a Farmacia Picual"],
            ["2", "Acceso individual", "Vincular cada Shopify ID verificado"],
            ["3", "Prueba segura", "Validar roles, 2FA y recuperación"],
            ["4", "Cambio final", "Retirar el acceso de desarrollo"],
          ].map(([number, title, detail]) => (
            <li className="rounded-2xl bg-white/80 p-4" key={number}>
              <span className="text-coral font-black">Paso {number}</span>
              <strong className="text-forest mt-1 block">{title}</strong>
              <span className="text-ink-muted mt-1 block leading-5">
                {detail}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <AdminTeamManager currentEmail={actor.email} initialUsers={users} />
    </>
  );
}
