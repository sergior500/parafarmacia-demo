import { CircleAlert, ContactRound } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { ShopifyCustomersList } from "@/features/admin/shopify-customers-list";
import { requireAdminCapability } from "@/server/admin-auth";
import {
  listShopifyCustomers,
  normalizeCustomerQuery,
} from "@/server/shopify/customers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes · Panel interno",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  await requireAdminCapability("customers:read", "/admin/clientes");
  const parameters = await searchParams;
  const query = normalizeCustomerQuery(parameters.q);
  try {
    const page = await listShopifyCustomers({
      query,
      after: parameters.cursor,
    });
    return (
      <>
        <CustomersHeader />
        <ShopifyCustomersList page={page} query={query} />
      </>
    );
  } catch (error) {
    return (
      <>
        <CustomersHeader />
        <Card className="border-red-200 bg-red-50 p-7 md:p-10">
          <CircleAlert className="size-8 text-red-700" />
          <h2 className="mt-5 text-2xl font-black text-red-900">
            No se pudieron consultar los clientes
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
            {error instanceof Error
              ? error.message
              : "Shopify no ha devuelto la información solicitada."}
          </p>
        </Card>
      </>
    );
  }
}

function CustomersHeader() {
  return (
    <header className="mb-8">
      <p className="eyebrow">Relación comercial · Shopify</p>
      <h1 className="display-title text-forest mt-2 flex items-center gap-3 text-5xl">
        <ContactRound className="text-coral size-9" /> Clientes
      </h1>
      <p className="text-ink-muted mt-3 max-w-3xl">
        Consulta mínima de identidad, actividad y gasto. Los datos personales no
        se copian al navegador ni a una base paralela.
      </p>
    </header>
  );
}
