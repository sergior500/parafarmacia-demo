import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sobre la tienda",
  description: "Identidad provisional de la futura tienda de parafarmacia.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Identidad provisional"
      intro="El nombre definitivo, la titularidad, la dirección y los datos comerciales siguen pendientes."
      title={`Sobre ${pharmacyConfig.name}`}
    >
      <h2>Una base preparada para evolucionar</h2>
      <p>
        Esta experiencia separa el catálogo, el inventario, los pedidos y la
        analítica para poder incorporar más adelante el ERP, el pago, el
        transporte y las notificaciones seleccionados.
      </p>
      <h2>Una demostración, no una tienda activa</h2>
      <p>
        El prototipo no procesa pagos ni descuenta stock real. La identidad, la
        información comercial y las condiciones deberán validarse antes de
        cualquier publicación.
      </p>
    </InfoPage>
  );
}
