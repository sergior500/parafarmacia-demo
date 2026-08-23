import { cookies } from "next/headers";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Repeat2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getCustomerAccountProfile,
  ShopifyCustomerAccountError,
  type CustomerAccountOrder,
  type CustomerAccountProfile,
} from "@/server/shopify/customer-account-api";
import { getShopifyCustomerAccountConfiguration } from "@/server/shopify/customer-account-config";
import {
  customerSessionCookieName,
  readCustomerSession,
} from "@/server/shopify/customer-account-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Pedidos, direcciones y datos de tu cuenta de Farmacia Picual.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cuenta" },
};

const guestFeatures: Array<[LucideIcon, string, string]> = [
  [Package, "Pedidos", "Consulta el estado y el historial de compras"],
  [MapPin, "Direcciones", "Revisa tus datos de entrega guardados"],
  [Repeat2, "Volver a comprar", "Recupera tus productos habituales"],
  [Heart, "Favoritos", "Tus productos guardados siguen disponibles"],
];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ acceso?: string; sesion?: string }>;
}) {
  const configuration = getShopifyCustomerAccountConfiguration();
  const sessionId = (await cookies()).get(customerSessionCookieName())?.value;
  const session = await readCustomerSession(sessionId).catch(() => null);
  let profile: CustomerAccountProfile | null = null;
  let accountError: ShopifyCustomerAccountError | null = null;
  if (session) {
    try {
      profile = await getCustomerAccountProfile(session.accessToken);
    } catch (error) {
      accountError =
        error instanceof ShopifyCustomerAccountError
          ? error
          : new ShopifyCustomerAccountError(
              "No se pudo cargar la cuenta en este momento.",
            );
    }
  }
  const status = await searchParams;
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Mi cuenta" }]} />
      {profile ? (
        <AuthenticatedAccount profile={profile} />
      ) : (
        <GuestAccount
          accountError={accountError}
          configured={configuration.configured}
          status={status}
        />
      )}
    </div>
  );
}

function GuestAccount({
  configured,
  accountError,
  status,
}: {
  configured: boolean;
  accountError: ShopifyCustomerAccountError | null;
  status: { acceso?: string; sesion?: string };
}) {
  const message = accountError
    ? accountError.message
    : status.acceso === "no-validado"
      ? "No pudimos validar el acceso. Inténtalo de nuevo desde esta página."
      : status.acceso === "limite"
        ? "Se han realizado demasiados intentos. Espera unos minutos antes de volver a entrar."
        : status.acceso === "fallo"
          ? "Shopify no pudo completar el acceso. Puedes volver a intentarlo."
          : status.sesion === "cerrada"
            ? "La sesión se ha cerrado correctamente."
            : null;
  return (
    <div className="grid gap-7 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
      <Card className="bg-petrol overflow-hidden p-7 text-white sm:p-9">
        <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
          <UserRound aria-hidden="true" className="size-7" />
        </span>
        <p className="text-peach mt-7 text-[.65rem] font-black tracking-[.14em] uppercase">
          Cuenta segura de cliente
        </p>
        <h1 className="font-display mt-3 max-w-xl text-4xl tracking-[-.045em] sm:text-5xl">
          Tus compras y direcciones, en un solo lugar.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
          Accede mediante Shopify con un código de un solo uso. Farmacia Picual
          no almacena tu contraseña ni la muestra a su personal.
        </p>
        {message ? (
          <p
            className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold"
            role="status"
          >
            {message}
          </p>
        ) : null}
        {configured ? (
          <Link
            className={cn(
              buttonVariants({ size: "lg" }),
              "text-forest hover:bg-cream mt-7 bg-white",
            )}
            href="/api/customer/auth/login?return_to=%2Fcuenta"
          >
            <LogIn aria-hidden="true" className="size-4" />
            Entrar o crear cuenta
          </Link>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/15 bg-white/8 p-4 text-sm">
            <strong className="text-peach block">Integración preparada</strong>
            <span className="mt-1 block text-white/70">
              Se activará al autorizar la URL de esta tienda en Shopify.
            </span>
          </div>
        )}
        <div className="mt-7 flex flex-wrap gap-4 text-xs font-bold text-white/65">
          <span className="flex items-center gap-2">
            <LockKeyhole className="size-4" /> Sin contraseñas propias
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Sesión cifrada
          </span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {guestFeatures.map(([Icon, title, text]) => (
          <Card className="p-5 sm:p-6" key={title}>
            <Icon aria-hidden="true" className="text-coral size-6" />
            <strong className="text-forest mt-5 block">{title}</strong>
            <span className="text-ink-muted mt-2 block text-sm leading-6">
              {text}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuthenticatedAccount({
  profile,
}: {
  profile: CustomerAccountProfile;
}) {
  const email = profile.emailAddress?.emailAddress;
  return (
    <div className="grid gap-8 xl:grid-cols-[21rem_1fr]">
      <aside>
        <Card className="bg-petrol p-7 text-white xl:sticky xl:top-28">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
            <UserRound aria-hidden="true" />
          </span>
          <p className="text-peach mt-6 text-[.65rem] font-black tracking-[.14em] uppercase">
            Cuenta verificada por Shopify
          </p>
          <h1 className="font-display mt-3 text-4xl tracking-[-.045em]">
            Hola, {profile.firstName || profile.displayName}
          </h1>
          {email ? (
            <p className="mt-3 text-sm break-all text-white/65">{email}</p>
          ) : null}
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-200">
            <CheckCircle2 className="size-4" /> Sesión protegida
          </div>
          <form action="/api/customer/auth/logout" method="post">
            <button
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-forest mt-7 w-full bg-white",
              )}
              type="submit"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </Card>
      </aside>

      <main className="min-w-0 space-y-8">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Historial real</p>
              <h2 className="display-title text-forest mt-1 text-4xl">
                Tus pedidos
              </h2>
            </div>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/parafarmacia"
            >
              Seguir comprando <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {profile.orders.nodes.length ? (
              profile.orders.nodes.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <Card className="p-7 text-center">
                <Package className="text-coral mx-auto size-7" />
                <strong className="text-forest mt-3 block">
                  Aún no hay pedidos
                </strong>
                <p className="text-ink-muted mt-2 text-sm">
                  Cuando completes una compra aparecerá aquí automáticamente.
                </p>
              </Card>
            )}
          </div>
        </section>

        <section>
          <p className="eyebrow">Entrega</p>
          <h2 className="display-title text-forest mt-1 text-4xl">
            Direcciones
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {profile.addresses.nodes.length ? (
              profile.addresses.nodes.map((address) => (
                <Card className="p-5" key={address.id}>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-coral mt-0.5 size-5 shrink-0" />
                    <div>
                      <strong className="text-forest block">
                        {address.id === profile.defaultAddress?.id
                          ? "Dirección principal"
                          : address.name || "Dirección guardada"}
                      </strong>
                      <address className="text-ink-muted mt-2 text-sm leading-6 not-italic">
                        {address.formatted.map((line) => (
                          <span className="block" key={line}>
                            {line}
                          </span>
                        ))}
                      </address>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 md:col-span-2">
                <p className="text-ink-muted text-sm">
                  No hay direcciones guardadas. Shopify solicitará una durante
                  el checkout cuando sea necesaria.
                </p>
              </Card>
            )}
          </div>
        </section>

        <Card className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <strong className="text-forest">Tus favoritos</strong>
            <p className="text-ink-muted mt-1 text-sm">
              Los productos guardados permanecen disponibles en este
              dispositivo.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/favoritos"
          >
            <Heart className="size-4" /> Ver favoritos
          </Link>
        </Card>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: CustomerAccountOrder }) {
  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-6">
      <div>
        <strong className="text-forest block text-lg">{order.name}</strong>
        <span className="text-ink-muted mt-1 block text-xs">
          {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
            new Date(order.processedAt),
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-black">
        <span className="bg-sage text-forest rounded-full px-3 py-1.5">
          {financialStatusLabel(order.financialStatus)}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">
          {fulfillmentStatusLabel(order.fulfillmentStatus)}
        </span>
      </div>
      <div className="sm:text-right">
        <strong className="text-forest block text-lg">
          {formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}
        </strong>
        <a
          className="text-coral mt-1 inline-flex items-center gap-1 text-xs font-black"
          href={order.statusPageUrl}
          rel="noreferrer"
        >
          Ver pedido <ArrowRight className="size-3.5" />
        </a>
      </div>
    </Card>
  );
}

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

function financialStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PAID: "Pagado",
    PENDING: "Pago pendiente",
    AUTHORIZED: "Autorizado",
    PARTIALLY_PAID: "Pago parcial",
    REFUNDED: "Reembolsado",
    PARTIALLY_REFUNDED: "Reembolso parcial",
    VOIDED: "Anulado",
  };
  return status ? labels[status] || status : "Estado de pago";
}

function fulfillmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    FULFILLED: "Enviado",
    IN_PROGRESS: "En preparación",
    ON_HOLD: "En espera",
    OPEN: "Pendiente",
    PARTIALLY_FULFILLED: "Envío parcial",
    RESTOCKED: "Repuesto",
    SCHEDULED: "Programado",
    UNFULFILLED: "Pendiente",
  };
  return labels[status] || status;
}
