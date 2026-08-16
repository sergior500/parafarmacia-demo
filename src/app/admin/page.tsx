import type { Metadata } from "next";

import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { requireAdminActor } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel interno",
  description: "Estado real del catálogo y de las integraciones comerciales.",
};

export default async function AdminPage() {
  await requireAdminActor("/admin");
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Vista general</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Control del negocio
        </h1>
      </header>
      <AdminDashboard />
    </>
  );
}
