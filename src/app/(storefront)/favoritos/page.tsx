import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FavoritesView } from "@/features/account/favorites-view";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Productos guardados en este navegador.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/favoritos" },
};

export default function FavoritesPage() {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: "Favoritos" }]} />
      <header className="pb-10">
        <p className="eyebrow">Tu selección</p>
        <h1 className="display-title text-forest mt-3 text-5xl md:text-6xl">
          Favoritos
        </h1>
        <p className="text-ink-muted mt-4 max-w-xl text-sm">
          Guardados localmente en este dispositivo para comparar y volver más
          tarde.
        </p>
      </header>
      <FavoritesView />
    </div>
  );
}
