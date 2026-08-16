import type { Metadata } from "next";

import { ReadinessDashboard } from "@/features/admin/readiness-dashboard";
import { requireAdminCapability } from "@/server/admin-auth";
import { getProductionReadiness } from "@/server/production-readiness";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preparación para producción · Panel interno",
  description:
    "Bloqueos, decisiones y comprobaciones necesarias para abrir Farmacia Picual.",
};

export default async function ProductionReadinessPage() {
  await requireAdminCapability("readiness:write", "/admin/preparacion");
  const report = await getProductionReadiness();
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Control de apertura</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Preparación para producción
        </h1>
        <p className="text-ink-muted mt-3 max-w-3xl text-sm leading-6">
          Un único lugar para saber qué está listo, qué bloquea la venta y qué
          necesita todavía una decisión de la farmacia.
        </p>
      </header>
      <ReadinessDashboard initialReport={report} />
    </>
  );
}
