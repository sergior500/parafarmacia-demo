"use client";

import { CheckCircle2, Cloud, LoaderCircle, PlugZap, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ShopifyStatusResponse {
  configuration: {
    configured: boolean;
    storeDomain?: string;
    apiVersion: string;
    missing: string[];
  };
  catalog: { shopifySynced: number; shopifyErrors: number; published: number };
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || "No se pudo completar la comprobación.";
}

export function ShopifyConnectionCard() {
  const [status, setStatus] = useState<ShopifyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shopify/status", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      setStatus((await response.json()) as ShopifyStatusResponse);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo leer la configuración.");
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
      const response = await fetch("/api/admin/shopify/test", { method: "POST" });
      if (!response.ok) throw new Error(await responseError(response));
      const body = (await response.json()) as { shop: { name: string; myshopifyDomain: string } };
      setNotice(`Conexión correcta con ${body.shop.name} (${body.shop.myshopifyDomain}).`);
      await loadStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo conectar con Shopify.");
    } finally {
      setTesting(false);
    }
  }

  const configured = status?.configuration.configured ?? false;
  return (
    <Card className="overflow-hidden p-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Comercio conectado</p>
          <h2 className="font-display text-forest mt-2 text-3xl">Shopify</h2>
          <p className="text-ink-muted mt-2 max-w-2xl text-sm">
            El equipo trabaja desde este panel; Shopify queda detrás para catálogo comercial,
            inventario, pedidos, pagos con tarjeta o Bizum y checkout.
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : configured ? <CheckCircle2 className="size-4" /> : <TriangleAlert className="size-4" />}
          {loading ? "Comprobando" : configured ? "Configurado" : "Pendiente de credenciales"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="bg-sage/45 rounded-2xl p-4"><span className="text-ink-muted text-xs">Tienda</span><strong className="text-forest mt-1 block text-sm">{status?.configuration.storeDomain ?? "Por conectar"}</strong></div>
        <div className="bg-sage/45 rounded-2xl p-4"><span className="text-ink-muted text-xs">Productos sincronizados</span><strong className="text-forest mt-1 block text-2xl">{status?.catalog.shopifySynced ?? "—"}</strong></div>
        <div className="bg-sage/45 rounded-2xl p-4"><span className="text-ink-muted text-xs">Errores de sincronización</span><strong className="text-forest mt-1 block text-2xl">{status?.catalog.shopifyErrors ?? "—"}</strong></div>
      </div>

      {!configured && status ? (
        <p className="text-ink-muted mt-4 text-xs">
          Para activarlo hay que guardar en el hosting: {status.configuration.missing.join(" y ")}.
          Las credenciales nunca se muestran ni se envían al navegador.
        </p>
      ) : null}
      {notice ? <p className="border-forest/10 bg-cream text-forest mt-4 rounded-2xl border px-4 py-3 text-sm font-bold" role="status">{notice}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={!configured || testing} onClick={() => void testConnection()}>
          {testing ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
          Probar conexión
        </Button>
        <span className="text-ink-muted inline-flex items-center gap-2 text-xs"><Cloud className="size-4" />Admin API {status?.configuration.apiVersion ?? "2026-07"}</span>
      </div>
    </Card>
  );
}
