import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { ShopifyConnectionCard } from "@/features/admin/shopify-connection-card";
import { pharmacyConfig } from "@/lib/config";
import { requireAdminCapability } from "@/server/admin-auth";
import { getShopifyCustomerAccountConfiguration } from "@/server/shopify/customer-account-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración · Panel interno",
};

const adapters = [
  ["Catálogo editorial", "D1 · 183 fichas reales", "Activo"],
  ["Revisión y auditoría", "Cambios persistentes con identidad", "Activo"],
  ["Catálogo comercial", "Sincronización preparada con Shopify", "Preparado"],
  ["Inventario", "Shopify será la fuente final de stock", "Preparado"],
  ["Pedidos y ventas", "Consulta, preparación y cancelación", "Preparado"],
  ["Clientes", "Consulta mínima desde Shopify", "Preparado"],
  ["Promociones", "Códigos, activación y pausa", "Preparado"],
  ["Reembolsos", "Parciales, auditados e idempotentes", "Preparado"],
  ["Pago", "Tarjeta y Bizum mediante Shopify", "Pendiente"],
  ["Transporte", "Zonas, plazos y tarifas por seleccionar", "Pendiente"],
  ["Notificaciones", "Proveedor y plantillas por definir", "Pendiente"],
] as const;

export default async function ConfigurationPage() {
  await requireAdminCapability("shopify:manage", "/admin/configuracion");
  const customerAccounts = getShopifyCustomerAccountConfiguration();
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
              <dd className="font-bold">
                {pharmacyConfig.address || "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Sitio</dt>
              <dd className="font-bold">{pharmacyConfig.siteUrl}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Área de cliente</p>
              <h2 className="font-display text-forest mt-1 text-3xl">
                Cuentas de Shopify
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-2 text-xs font-black ${
                customerAccounts.configured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {customerAccounts.configured ? "Preparado" : "Pendiente"}
            </span>
          </div>
          <p className="text-ink-muted mt-3 text-sm leading-6">
            Acceso sin contraseñas propias, sesiones cifradas y lectura de
            pedidos y direcciones desde Shopify.
          </p>
          {customerAccounts.callbackUri ? (
            <div className="bg-sage/40 mt-4 rounded-2xl p-4 text-xs">
              <span className="text-ink-muted block">
                URL de retorno autorizada
              </span>
              <code className="text-forest mt-1 block font-bold break-all">
                {customerAccounts.callbackUri}
              </code>
            </div>
          ) : null}
          {!customerAccounts.configured ? (
            <p className="mt-4 text-xs font-bold text-amber-800">
              Pendiente: {customerAccounts.missing.join(" · ")}
            </p>
          ) : null}
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
