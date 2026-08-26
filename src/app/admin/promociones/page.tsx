import { BadgePercent, CircleAlert } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { DiscountsManager } from "@/features/admin/discounts-manager";
import {
  hasAdminCapability,
  requireAdminCapability,
} from "@/server/admin-auth";
import { listShopifyDiscounts } from "@/server/shopify/discounts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promociones · Panel interno",
};

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const actor = await requireAdminCapability(
    "discounts:read",
    "/admin/promociones",
  );
  const { cursor } = await searchParams;
  try {
    const page = await listShopifyDiscounts(cursor);
    return (
      <>
        <DiscountsHeader />
        <DiscountsManager
          canWrite={hasAdminCapability(actor, "discounts:write")}
          discounts={page.discounts}
        />
      </>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Shopify no ha devuelto la información solicitada.";
    const isConfigurationError = errorMessage.startsWith(
      "Shopify no está configurado.",
    );

    return (
      <>
        <DiscountsHeader />
        <Card className="border-red-200 bg-red-50 p-7 md:p-10">
          <CircleAlert className="size-8 text-red-700" />
          <h2 className="mt-5 text-2xl font-black text-red-900">
            No se pudieron consultar las promociones
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
            {errorMessage}
          </p>
          <p className="mt-3 text-sm font-bold text-red-900">
            {isConfigurationError
              ? "Completa la configuración privada del entorno y reinicia el servidor local."
              : "Si acabamos de añadir este módulo, reinstala la versión de la app que concede el permiso de descuentos."}
          </p>
        </Card>
      </>
    );
  }
}

function DiscountsHeader() {
  return (
    <header className="mb-8">
      <p className="eyebrow">Venta y fidelización · Shopify</p>
      <h1 className="display-title text-forest mt-2 flex items-center gap-3 text-5xl">
        <BadgePercent className="text-coral size-9" /> Promociones
      </h1>
      <p className="text-ink-muted mt-3 max-w-3xl">
        Crea, pausa y reactiva códigos sin acceder al administrador de Shopify.
        Los límites se aplican directamente durante el checkout.
      </p>
    </header>
  );
}
