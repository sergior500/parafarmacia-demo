import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sobre la tienda",
  description: "Conoce la propuesta de parafarmacia online de Farmacia Picual.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Farmacia Picual"
      intro="Una parafarmacia online pensada para encontrar productos por categoría, necesidad o rutina."
      title={`Sobre ${pharmacyConfig.name}`}
    >
      <h2>Una experiencia clara y cercana</h2>
      <p>
        Organizamos el catálogo para que puedas comparar productos, entender la
        información disponible y comprar con un proceso sencillo.
      </p>
      <h2>Información responsable</h2>
      <p>
        Solo publicamos como comprables los productos cuyo precio, stock y
        disponibilidad hayan sido confirmados. Los datos legales completos de la
        farmacia se incorporarán antes de habilitar la venta definitiva.
      </p>
    </InfoPage>
  );
}
