"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const incident = error.digest?.slice(0, 10).toUpperCase();
  return (
    <section className="page-shell py-16 md:py-24">
      <div className="paper-grid border-forest/10 grid min-h-[28rem] overflow-hidden border lg:grid-cols-[.34fr_.66fr]">
        <div className="bg-forest-dark relative flex flex-col justify-between p-7 text-white sm:p-10">
          <span className="brand-seal size-14 border-white/20">FP</span>
          <div>
            <p className="text-ochre text-[.62rem] font-black tracking-[.15em] uppercase">
              Incidencia temporal
            </p>
            <p className="catalog-number mt-3 text-7xl text-white/20">500</p>
          </div>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <AlertTriangle aria-hidden="true" className="text-coral size-9" />
          <h1 className="display-title text-forest mt-6 text-5xl sm:text-6xl">
            Esta página necesita un momento.
          </h1>
          <p className="text-ink-muted mt-5 max-w-xl">
            No hemos podido mostrar el contenido. Puedes reintentarlo o volver
            al inicio; si estabas finalizando una compra, comprueba su estado
            antes de repetirla.
          </p>
          {incident ? (
            <p className="text-ink-muted mt-4 text-xs">
              Referencia de incidencia: <strong>{incident}</strong>
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={reset}>
              <RotateCcw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft aria-hidden="true" className="size-4" /> Volver al
                inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
