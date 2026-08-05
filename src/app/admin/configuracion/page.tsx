import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Configuración · Panel interno",
};

const adapters = [
  ["Catálogo de parafarmacia", "Datos locales de demostración", "Activo"],
  ["Inventario", "Stock local simulado", "Activo"],
  ["Pedidos", "Flujo comercial local", "Activo"],
  ["Analítica de ventas", "Cálculos sobre pedidos demo", "Activo"],
  ["Pago", "Proveedor por seleccionar", "Pendiente"],
  ["Transporte", "Proveedor por seleccionar", "Pendiente"],
  ["Notificaciones", "Sin envíos reales", "Pendiente"],
] as const;

export default function ConfigurationPage() {
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow">Entorno de demostración</p>
        <h1 className="display-title text-forest mt-2 text-5xl">
          Configuración
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-forest text-3xl">
            Identidad provisional
          </h2>
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
