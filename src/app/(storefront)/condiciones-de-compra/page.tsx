import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Condiciones de compra" };

export default function TermsPage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder legal"
      intro="La demostración no acepta pedidos ni formaliza contratos de compraventa."
      title="Condiciones de compra"
    >
      <p>
        Precios, disponibilidad, territorio, medios de pago, preparación,
        entrega, cancelación y obligaciones de las partes deberán definirse y
        validarse antes del lanzamiento.
      </p>
    </InfoPage>
  );
}
