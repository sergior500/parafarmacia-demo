import { Search, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="page-shell py-16 md:py-24">
      <div className="paper-grid border-forest/10 relative overflow-hidden rounded-[.35rem_3rem_.35rem_.35rem] border px-6 py-16 sm:px-12 md:py-24">
        <span className="catalog-number text-forest pointer-events-none absolute -top-10 right-4 text-[13rem] leading-none opacity-[.05] sm:text-[18rem]">
          404
        </span>
        <SearchX aria-hidden="true" className="text-coral size-10" />
        <p className="eyebrow mt-7">Página fuera de catálogo · 404</p>
        <h1 className="display-title text-forest mt-4 max-w-3xl text-5xl md:text-7xl">
          Aquí no hay nada, pero podemos ayudarte a encontrarlo.
        </h1>
        <p className="text-ink-muted mt-6 max-w-xl">
          Puede que el producto haya cambiado de dirección o ya no forme parte
          del catálogo. Prueba el buscador o explora por necesidades.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/parafarmacia">
              <Search aria-hidden="true" className="size-4" /> Buscar productos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
