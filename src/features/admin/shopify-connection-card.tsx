"use client";

import {
  CheckCircle2,
  Cloud,
  LoaderCircle,
  PlugZap,
  RadioTower,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";

interface ShopifyStatusResponse {
  configuration: {
    configured: boolean;
    storeDomain?: string;
    apiVersion: string;
    missing: string[];
  };
  connection:
    | {
        connected: true;
        shop: { name: string; myshopifyDomain: string };
        grantedScopes: string[];
        missingScopes: string[];
        permissionsReady: boolean;
      }
    | { connected: false; error: string }
    | null;
  catalog: { shopifySynced: number; shopifyErrors: number; published: number };
  webhooks:
    | {
        callbackUrl: string;
        configured: number;
        total: number;
        ready: boolean;
        missingTopics: string[];
      }
    | { ready: false; error: string }
    | null;
}

const scopeLabels: Record<string, string> = {
  write_products: "Crear y actualizar productos",
  read_publications: "Leer canales de venta",
  write_publications: "Publicar y ocultar productos",
  write_inventory: "Actualizar inventario",
  read_locations: "Leer ubicaciones",
  read_orders: "Leer pedidos",
  write_merchant_managed_fulfillment_orders: "Preparar y registrar envíos",
  write_orders: "Cancelar y gestionar pedidos",
  read_customers: "Consultar clientes",
  read_discounts: "Consultar promociones y descuentos",
  write_discounts: "Crear y gestionar promociones y descuentos",
  unauthenticated_read_product_listings: "Mostrar el catálogo público",
  unauthenticated_write_checkouts: "Crear carritos de compra",
  unauthenticated_read_checkouts: "Abrir el checkout seguro",
};

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error || "No se pudo completar la comprobación.";
}

export function ShopifyConnectionCard() {
  const [status, setStatus] = useState<ShopifyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [activatingWebhooks, setActivatingWebhooks] = useState(false);
  const [notice, setNotice] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await secureAdminFetch("/api/admin/shopify/status", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await responseError(response));
      setStatus((await response.json()) as ShopifyStatusResponse);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo leer la configuración.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial load synchronizes this client card with the server-only Shopify configuration.
    void loadStatus();
  }, [loadStatus]);

  async function testConnection() {
    setTesting(true);
    setNotice("");
    try {
      const response = await secureAdminFetch("/api/admin/shopify/test", {
        method: "POST",
      });
      if (!response.ok) throw new Error(await responseError(response));
      const body = (await response.json()) as {
        connection: Extract<
          ShopifyStatusResponse["connection"],
          { connected: true }
        >;
      };
      setNotice(
        body.connection.permissionsReady
          ? `Conexión y permisos correctos con ${body.connection.shop.name}.`
          : `La aplicación está instalada, pero faltan ${body.connection.missingScopes.length} permisos por autorizar.`,
      );
      await loadStatus();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con Shopify.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function activateWebhooks() {
    setActivatingWebhooks(true);
    setNotice("");
    try {
      const response = await secureAdminFetch("/api/admin/shopify/webhooks", {
        method: "POST",
      });
      if (!response.ok) throw new Error(await responseError(response));
      const body = (await response.json()) as {
        webhooks: { configured: number; total: number; ready: boolean };
      };
      setNotice(
        body.webhooks.ready
          ? "Automatización activa: Shopify ya notificará stock, productos y pedidos."
          : `Se activaron ${body.webhooks.configured} de ${body.webhooks.total} eventos.`,
      );
      await loadStatus();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudieron activar los webhooks.",
      );
    } finally {
      setActivatingWebhooks(false);
    }
  }

  const configured = status?.configuration.configured ?? false;
  const connected = status?.connection?.connected === true;
  const permissionsReady =
    status?.connection?.connected === true &&
    status.connection.permissionsReady;
  const missingScopes =
    status?.connection?.connected === true
      ? status.connection.missingScopes
      : [];
  const badgeLabel = loading
    ? "Comprobando"
    : !configured
      ? "Pendiente de credenciales"
      : !connected
        ? "Sin conexión"
        : permissionsReady
          ? "Listo para sincronizar"
          : "Permisos pendientes";
  const badgeClassName = permissionsReady
    ? "bg-emerald-100 text-emerald-800"
    : connected
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";
  return (
    <Card className="overflow-hidden p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Comercio conectado</p>
          <h2 className="font-display text-forest mt-2 text-3xl">Shopify</h2>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm">
            El equipo trabaja desde este panel; Shopify queda detrás para
            catálogo comercial, inventario, pedidos, pagos con tarjeta o Bizum y
            checkout.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${loading ? "bg-stone-100 text-stone-700" : badgeClassName}`}
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : permissionsReady ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <TriangleAlert className="size-4" />
          )}
          {badgeLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-sage/45 rounded-2xl p-4">
          <span className="text-ink-muted text-xs">Tienda</span>
          <strong className="text-forest mt-1 block text-sm">
            {status?.configuration.storeDomain ?? "Por conectar"}
          </strong>
        </div>
        <div className="bg-sage/45 rounded-2xl p-4">
          <span className="text-ink-muted text-xs">Automatización</span>
          <strong className="text-forest mt-1 block text-sm">
            {status?.webhooks && "configured" in status.webhooks
              ? `${status.webhooks.configured}/${status.webhooks.total} eventos`
              : "Pendiente"}
          </strong>
        </div>
        <div className="bg-sage/45 rounded-2xl p-4">
          <span className="text-ink-muted text-xs">Aplicación</span>
          <strong className="text-forest mt-1 block text-sm">
            {connected ? "Instalada" : "Pendiente"}
          </strong>
        </div>
        <div className="bg-sage/45 rounded-2xl p-4">
          <span className="text-ink-muted text-xs">
            Productos sincronizados
          </span>
          <strong className="text-forest mt-1 block text-2xl">
            {status?.catalog.shopifySynced ?? "—"}
          </strong>
        </div>
        <div className="bg-sage/45 rounded-2xl p-4">
          <span className="text-ink-muted text-xs">
            Errores de sincronización
          </span>
          <strong className="text-forest mt-1 block text-2xl">
            {status?.catalog.shopifyErrors ?? "—"}
          </strong>
        </div>
      </div>

      {connected ? (
        <div className="border-forest/10 mt-5 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-forest text-sm">Permisos necesarios</strong>
            <span className="text-ink-muted text-xs">
              {Object.keys(scopeLabels).length - missingScopes.length} de{" "}
              {Object.keys(scopeLabels).length} concedidos
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(scopeLabels).map(([scope, label]) => {
              const granted = !missingScopes.includes(scope);
              return (
                <span
                  className={`flex items-center gap-2 text-xs font-bold ${granted ? "text-emerald-700" : "text-amber-700"}`}
                  key={scope}
                >
                  {granted ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <TriangleAlert className="size-4" />
                  )}
                  {label}
                </span>
              );
            })}
          </div>
          {!permissionsReady ? (
            <p className="text-ink-muted mt-3 text-xs">
              Añade estos permisos en la versión de la aplicación de Shopify y
              aprueba la actualización en la tienda.
            </p>
          ) : null}
        </div>
      ) : null}

      {!configured && status ? (
        <p className="text-ink-muted mt-4 text-xs">
          Para activarlo hay que guardar en el hosting:{" "}
          {status.configuration.missing.join(" y ")}. Las credenciales nunca se
          muestran ni se envían al navegador.
        </p>
      ) : null}
      {status?.connection?.connected === false ? (
        <p className="mt-4 text-sm font-bold text-red-700" role="alert">
          {status.connection.error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="border-forest/10 bg-cream text-forest mt-4 rounded-2xl border px-4 py-3 text-sm font-bold"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          disabled={!configured || testing}
          onClick={() => void testConnection()}
        >
          {testing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <PlugZap className="size-4" />
          )}
          Probar conexión
        </Button>
        <Button
          disabled={
            !permissionsReady ||
            activatingWebhooks ||
            status?.webhooks?.ready === true
          }
          onClick={() => void activateWebhooks()}
          variant="secondary"
        >
          {activatingWebhooks ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RadioTower className="size-4" />
          )}
          {status?.webhooks?.ready
            ? "Automatización activa"
            : "Activar automatización"}
        </Button>
        <span className="text-ink-muted inline-flex items-center gap-2 text-xs">
          <Cloud className="size-4" />
          Admin API {status?.configuration.apiVersion ?? "2026-07"}
        </span>
      </div>
    </Card>
  );
}
