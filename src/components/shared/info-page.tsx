import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
  legal = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
  legal?: boolean;
}) {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: title }]} />
      <section className="grid gap-8 pb-16 lg:grid-cols-[.8fr_1.2fr]">
        <header>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display-title text-forest mt-2 text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="text-ink-muted mt-5 text-lg">{intro}</p>
        </header>
        <Card className="prose-demo p-7 md:p-10">
          {legal ? (
            <div className="border-coral/30 bg-coral-light/30 text-forest mb-7 rounded-2xl border p-5 font-bold">
              Contenido pendiente de validación jurídica.
            </div>
          ) : null}
          {children}
        </Card>
      </section>
    </div>
  );
}
