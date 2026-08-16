import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { ShopifyConnectionCard } from "@/features/admin/shopify-connection-card";
import { pharmacyConfig } from "@/lib/config";
import { requireAdminCapability } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración · Panel interno",
};

const adapters = [
  ["Catálogo editorial", "D1 · 183 fichas reales", "Activo"],
  ["Revisión y auditoría", "Cambios persistentes con identidad", "Activo"],
  ["Catálogo comercial", "Sincronización preparada con Shopify", "Preparado"],
  ["Inventario", "Shopify será la fuente final de stock", "Preparado"],
  ["Pedidos y ventas", "Lectura desde Shopify", "Pendiente"],
  ["Pago", "Tarjeta y Bizum mediante Shopify", "Pendiente"],
  ["Transporte", "Zonas, plazos y tarifas por seleccionar", "Pendiente"],
  ["Notificaciones", "Proveedor y plantillas por definir", "Pendiente"],
] as const;

export default async function ConfigurationPage() {
  await requireAdminCapability("shopify:manage", "/admin/configuracion");
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Estado del sistema</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Configuración
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <ShopifyConnectionCard />
        <Card className="p-6">
          <h2 className="font-display text-forest text-3xl">
            Identidad provisional
          </h2>
          <p className="text-ink-muted mt-2 text-sm">
            Estos datos se sustituirán cuando la empresa facilite su información
            definitiva.
          </p>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-ink-muted">Nombre</dt>
              <dd className="font-bold">{pharmacyConfig.name}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Dirección</dt>
              <dd className="font-bold">{pharmacyConfig.address}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Sitio</dt>
              <dd className="font-bold">{pharmacyConfig.siteUrl}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-forest text-3xl">
            Servicios e integraciones
          </h2>
          <div className="divide-forest/10 mt-5 divide-y">
            {adapters.map(([name, adapter, status]) => (
              <div
                className="flex items-center justify-between gap-4 py-3 text-sm"
                key={name}
              >
                <span>
                  <strong className="text-forest block">{name}</strong>
                  <span className="text-ink-muted text-xs">{adapter}</span>
                </span>
                <span
                  className={
                    status === "Activo"
                      ? "text-xs font-bold text-emerald-700"
                      : status === "Preparado"
                        ? "text-xs font-bold text-sky-700"
                        : "text-xs font-bold text-amber-700"
                  }
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
