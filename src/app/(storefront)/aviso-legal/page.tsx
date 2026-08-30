import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Aviso legal",
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <InfoPage
      legal
      eyebrow="Información del titular"
      intro="Borrador preparado para incorporar la identidad mercantil y los datos profesionales de la farmacia."
      title="Aviso legal"
    >
      <p>
        La identidad del titular, los datos registrales, la autorización y los
        canales oficiales deben ser aportados por la farmacia y revisados por su
        asesoría jurídica antes de activar las ventas.
      </p>
    </InfoPage>
  );
}
