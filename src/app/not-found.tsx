import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell py-20 text-center">
      <SearchX aria-hidden="true" className="text-coral mx-auto size-12" />
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="display-title text-forest mt-2 text-5xl">
        Esta página no está disponible
      </h1>
      <p className="text-ink-muted mt-4">
        Puede que el producto esté inactivo, retirado o que la dirección no
        exista.
      </p>
      <Button asChild className="mt-7">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
