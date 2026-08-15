import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  ImageOff,
  ScanSearch,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getCatalogHealth } from "@/server/catalog-repository";
import { listShopifyOrders } from "@/server/shopify/orders";

export async function AdminDashboard() {
  const [catalog, ordersReport] = await Promise.all([
    getCatalogHealth(),
    listShopifyOrders().catch(() => null),
  ]);
  const completionChecks = catalog.total * 4;
  const missingChecks =
    catalog.missingPrice +
    catalog.missingStock +
    catalog.missingImage +
    catalog.missingSize;
  const completion = completionChecks
    ? Math.round(((completionChecks - missingChecks) / completionChecks) * 100)
    : 0;

  const metrics = [
    {
      label: "Productos reales",
      value: String(catalog.total),
      detail: "Importados de los PDF",
      icon: Boxes,
      tone: "bg-[#dff1e9] text-[#1d806d]",
    },
    {
      label: "Pendientes de revisión",
      value: String(catalog.pending),
      detail: `${catalog.reviewed} revisados`,
      icon: ScanSearch,
      tone: "bg-[#fff0e7] text-[#c7653c]",
    },
    {
      label: "Aprobados para Shopify",
      value: String(catalog.published),
      detail: "Sin publicar comercialmente",
      icon: BadgeCheck,
      tone: "bg-[#e7eef8] text-[#3d6fa8]",
    },
    {
      label: "Preparación comercial",
      value: `${completion} %`,
      detail: "Precio, stock, imagen y formato",
      icon: CircleDollarSign,
      tone: "bg-[#f0e9f7] text-[#7b5aa6]",
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card className="p-5" key={label}>
            <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <p className="text-forest mt-5 text-3xl font-black tracking-[-0.04em]">{value}</p>
            <p className="text-ink-muted mt-1 text-sm">{label}</p>
            <p className="text-ink-muted mt-3 text-xs font-bold">{detail}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Trabajo pendiente</p>
              <h2 className="font-display text-forest mt-2 text-3xl">Preparar el catálogo comercial</h2>
            </div>
            <Link className="text-coral inline-flex items-center gap-1 text-sm font-bold" href="/admin/productos">
              Abrir productos <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              ["Sin precio verificado", catalog.missingPrice],
              ["Sin stock verificado", catalog.missingStock],
              ["Sin imagen definitiva", catalog.missingImage],
              ["Sin formato confirmado", catalog.missingSize],
            ].map(([label, value]) => (
              <div className="border-forest/10 bg-cream rounded-2xl border p-4" key={label}>
                <strong className="text-forest text-2xl">{value}</strong>
                <p className="text-ink-muted mt-1 text-xs font-bold">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <span className="bg-sage text-forest grid size-11 place-items-center rounded-xl"><ShoppingBag className="size-5" /></span>
          <p className="eyebrow mt-6">Comercio</p>
          <h2 className="font-display text-forest mt-2 text-3xl">
            {ordersReport ? "Shopify conectado" : "Shopify necesita atención"}
          </h2>
          {ordersReport ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="border-forest/10 bg-cream rounded-2xl border p-4">
                  <strong className="text-forest block text-xl">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: ordersReport.currencyCode,
                    }).format(ordersReport.metrics.monthSales)}
                  </strong>
                  <span className="text-ink-muted text-xs font-bold">
                    Ventas este mes
                  </span>
                </div>
                <div className="border-forest/10 bg-cream rounded-2xl border p-4">
                  <strong className="text-forest block text-xl">
                    {ordersReport.metrics.pendingPreparation}
                  </strong>
                  <span className="text-ink-muted text-xs font-bold">
                    Por preparar
                  </span>
                </div>
              </div>
              <Link className="text-coral mt-5 inline-flex items-center gap-1 text-sm font-bold" href="/admin/pedidos">
                Ver pedidos y ventas <ArrowUpRight className="size-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-ink-muted mt-3 text-sm leading-6">
                No se han podido consultar los pedidos. Revisa la conexión para
                recuperar la actividad comercial real.
              </p>
              <Link className="text-coral mt-5 inline-flex items-center gap-1 text-sm font-bold" href="/admin/configuracion">
                Ver integración <ArrowUpRight className="size-4" />
              </Link>
            </>
          )}
        </Card>
      </div>

      <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center md:p-8">
        <span className="bg-coral-light text-coral grid size-11 shrink-0 place-items-center rounded-xl"><ImageOff className="size-5" /></span>
        <div>
          <h2 className="text-forest font-black">Siguiente cuello de botella: imágenes y precios</h2>
          <p className="text-ink-muted mt-1 text-sm">La estructura y el contenido técnico ya están cargados; estos datos deben facilitarlos o validarlos desde la farmacia.</p>
        </div>
      </Card>
    </>
  );
}
