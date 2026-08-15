import { CircleAlert, RefreshCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ShopifyOrdersDashboard } from "@/features/admin/shopify-orders-dashboard";
import { listShopifyOrders } from "@/server/shopify/orders";

export const metadata: Metadata = {
  title: "Pedidos · Panel interno",
  description: "Pedidos, ventas y actividad comercial real de Shopify.",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let report;
  try {
    report = await listShopifyOrders();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron consultar los pedidos de Shopify.";
    return (
      <>
        <OrdersHeader />
        <Card className="border-red-200 bg-red-50 p-7 md:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-red-100 text-red-700">
            <CircleAlert className="size-6" />
          </span>
          <h2 className="mt-6 text-2xl font-black text-red-900">
            No hemos podido leer los pedidos
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
            {message}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-5 text-sm font-bold text-white"
            href="/admin/pedidos"
          >
            <RefreshCcw className="size-4" /> Reintentar
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <OrdersHeader />
      <ShopifyOrdersDashboard report={report} />
    </>
  );
}

function OrdersHeader() {
  return (
    <header className="mb-8">
      <p className="eyebrow">Operación comercial · Shopify</p>
      <h1 className="display-title text-forest mt-2 text-5xl">Pedidos y ventas</h1>
      <p className="text-ink-muted mt-3 max-w-3xl">
        Seguimiento de ingresos, preparación y productos vendidos con datos
        obtenidos directamente de la tienda.
      </p>
    </header>
  );
}
