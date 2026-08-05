import { Search, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell py-20 text-center">
      <SearchX aria-hidden="true" className="text-coral mx-auto size-12" />
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="display-title text-forest mt-3 text-5xl md:text-6xl">
        No encontramos lo que buscabas.
      </h1>
      <p className="text-ink-muted mt-4">
        Puede que el producto haya cambiado de dirección. Prueba el buscador o
        vuelve al catálogo por necesidades.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/parafarmacia">
            <Search aria-hidden="true" className="size-4" />
            Buscar productos
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
