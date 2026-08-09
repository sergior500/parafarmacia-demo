import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BrandDirectory } from "@/features/brands/brand-directory";
import { brands } from "@/mocks/content";

export const metadata: Metadata = {
  title: "Marcas de parafarmacia",
  description:
    "Explora las marcas del catálogo de parafarmacia y sus productos asociados.",
  alternates: { canonical: "/marcas" },
};

export default function BrandsPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Marcas" }]} />
      <header className="grid gap-6 pb-12 lg:grid-cols-[1fr_.8fr] lg:items-end">
        <div>
          <p className="eyebrow">Índice de marcas</p>
          <h1 className="display-title text-forest mt-3 text-5xl md:text-7xl">
            Encuentra tu marca habitual.
          </h1>
        </div>
        <p className="text-ink-muted max-w-xl text-sm leading-relaxed">
          Este índice muestra únicamente la procedencia declarada en las fichas
          técnicas facilitadas. Los datos comerciales definitivos siguen
          pendientes de validación.
        </p>
      </header>
      <BrandDirectory brands={brands} />
    </div>
  );
}
