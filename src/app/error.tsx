"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell py-20 text-center">
      <AlertTriangle
        aria-hidden="true"
        className="text-coral mx-auto size-12"
      />
      <h1 className="display-title text-forest mt-5 text-5xl">
        Algo no ha salido bien
      </h1>
      <p className="text-ink-muted mt-3">
        No hemos podido mostrar este contenido.
      </p>
      <Button className="mt-7" onClick={reset}>
        Intentar de nuevo
      </Button>
    </div>
  );
}
