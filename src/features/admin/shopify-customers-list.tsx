import { ChevronRight, Mail, MapPin, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { ShopifyCustomersPage } from "@/server/shopify/customers";

import { formatShopifyDate, formatShopifyMoney } from "./shopify-order-format";

const STATE_LABELS: Record<string, string> = {
  ENABLED: "Cuenta activa",
  DISABLED: "Sin cuenta",
  INVITED: "Invitación enviada",
  DECLINED: "Invitación rechazada",
};

export function ShopifyCustomersList({
  page,
  query,
}: {
  page: ShopifyCustomersPage;
  query: string;
}) {
  return (
    <Card className="overflow-hidden">
      <form
        action="/admin/clientes"
        className="border-forest/10 grid gap-3 border-b p-5 sm:grid-cols-[1fr_auto] sm:p-6"
      >
        <label className="border-forest/15 flex min-h-12 items-center gap-3 rounded-2xl border bg-white px-4">
          <Search className="text-ink-muted size-4" />
          <span className="sr-only">Buscar clientes</span>
          <input
            className="text-forest min-w-0 flex-1 bg-transparent text-sm outline-none"
            defaultValue={query}
            maxLength={100}
            name="q"
            placeholder="Nombre, correo o etiqueta"
            type="search"
          />
        </label>
        <button
          className="bg-forest min-h-12 rounded-full px-6 text-sm font-black text-white"
          type="submit"
        >
          Buscar
        </button>
      </form>

      <div className="divide-forest/10 divide-y">
        {page.customers.map((customer) => (
          <article
            className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.2fr_.8fr_auto] lg:items-center"
            key={customer.id}
          >
            <div className="min-w-0">
              <strong className="text-forest block truncate">
                {customer.displayName}
              </strong>
              {customer.email ? (
                <span className="text-ink-muted mt-1 flex items-center gap-2 text-xs break-all">
                  <Mail className="size-3.5 shrink-0" /> {customer.email}
                </span>
              ) : (
                <span className="text-ink-muted mt-1 block text-xs">
                  Sin correo disponible
                </span>
              )}
              {customer.location ? (
                <span className="text-ink-muted mt-1 flex items-center gap-2 text-xs">
                  <MapPin className="size-3.5 shrink-0" /> {customer.location}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-ink-muted block text-xs">Pedidos</span>
                <strong className="text-forest mt-1 flex items-center gap-1">
                  <ShoppingBag className="size-4" /> {customer.numberOfOrders}
                </strong>
              </div>
              <div>
                <span className="text-ink-muted block text-xs">Gastado</span>
                <strong className="text-forest mt-1 block">
                  {formatShopifyMoney(
                    customer.amountSpent,
                    customer.currencyCode,
                  )}
                </strong>
              </div>
            </div>

            <div className="lg:text-right">
              <span className="bg-sage text-forest inline-flex rounded-full px-3 py-1.5 text-xs font-black">
                {STATE_LABELS[customer.state] ?? customer.state}
              </span>
              <span className="text-ink-muted mt-2 block text-xs">
                Alta {formatShopifyDate(customer.createdAt)}
              </span>
            </div>
          </article>
        ))}
        {page.customers.length === 0 ? (
          <div className="p-10 text-center">
            <Search className="text-coral mx-auto size-7" />
            <p className="text-forest mt-3 font-black">
              No hay clientes que coincidan
            </p>
            <p className="text-ink-muted mt-1 text-sm">
              Revisa el término de búsqueda o espera a que entren pedidos.
            </p>
          </div>
        ) : null}
      </div>

      {page.hasNextPage && page.endCursor ? (
        <div className="border-forest/10 flex justify-end border-t p-5">
          <Link
            className="border-forest/15 text-forest hover:bg-sage inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-black"
            href={`/admin/clientes?${new URLSearchParams({
              ...(query ? { q: query } : {}),
              cursor: page.endCursor,
            }).toString()}`}
          >
            Siguiente página <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
