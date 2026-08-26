"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="border-forest/10 bg-white p-7 sm:p-10">
      <AlertTriangle aria-hidden="true" className="text-coral size-9" />
      <p className="eyebrow mt-6">Panel de gestión</p>
      <h1 className="display-title text-forest mt-3 text-5xl">
        No hemos podido completar esta operación.
      </h1>
      <p className="text-ink-muted mt-4 max-w-2xl">
        No se ha confirmado ningún cambio. Reintenta la operación o vuelve al
        resumen del panel.
      </p>
      {error.digest ? (
        <p className="text-ink-muted mt-3 text-xs">
          Referencia: {error.digest.slice(0, 10).toUpperCase()}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" className="size-4" /> Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Volver al resumen</Link>
        </Button>
      </div>
    </section>
  );
}
