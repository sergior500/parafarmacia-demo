import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <section className="border-forest/10 bg-white p-7 sm:p-10">
      <SearchX aria-hidden="true" className="text-coral size-9" />
      <p className="eyebrow mt-6">Registro no encontrado</p>
      <h1 className="display-title text-forest mt-3 text-5xl">
        Este elemento ya no está disponible.
      </h1>
      <p className="text-ink-muted mt-4 max-w-xl">
        Puede que haya cambiado en Shopify o que otra persona lo haya
        actualizado. Vuelve al panel para consultar el estado actual.
      </p>
      <Button asChild className="mt-7">
        <Link href="/admin">Volver al resumen</Link>
      </Button>
    </section>
  );
}
