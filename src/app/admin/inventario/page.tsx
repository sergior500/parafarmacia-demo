import { CircleAlert, RefreshCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ShopifyInventoryManager } from "@/features/admin/shopify-inventory-manager";
import { requireAdminCapability } from "@/server/admin-auth";
import { listShopifyInventory } from "@/server/shopify/inventory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventario · Panel interno",
  description: "Stock real por producto y ubicación de Shopify.",
};

export default async function InventoryPage() {
  await requireAdminCapability("inventory:read", "/admin/inventario");
  let report;
  let loadError: unknown;
  try {
    report = await listShopifyInventory();
  } catch (error) {
    loadError = error;
  }
  if (!report) {
    return (
      <>
        <InventoryHeader />
        <Card className="border-red-200 bg-red-50 p-7 md:p-10">
          <CircleAlert className="size-8 text-red-700" />
          <h2 className="mt-5 text-2xl font-black text-red-900">
            No se pudo consultar el inventario
          </h2>
          <p className="mt-3 text-sm text-red-800">
            {loadError instanceof Error
              ? loadError.message
              : "Shopify no ha respondido."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-5 text-sm font-bold text-white"
            href="/admin/inventario"
          >
            <RefreshCcw className="size-4" /> Reintentar
          </Link>
        </Card>
      </>
    );
  }
  return (
    <>
      <InventoryHeader />
      <ShopifyInventoryManager initialReport={report} />
    </>
  );
}

function InventoryHeader() {
  return (
    <header className="mb-8">
      <p className="eyebrow">Operación comercial · Shopify</p>
      <h1 className="display-title text-forest mt-2 text-5xl">Inventario</h1>
      <p className="text-ink-muted mt-3 max-w-3xl">
        Consulta y corrige el stock disponible por ubicación sin salir del panel
        de Farmacia Picual.
      </p>
    </header>
  );
}
