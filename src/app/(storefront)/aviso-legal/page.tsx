import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Aviso legal" };

export default function LegalNoticePage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder legal"
      intro="Este documento no constituye un aviso legal válido."
      title="Aviso legal"
    >
      <p>
        La identidad del titular, los datos registrales, la autorización y los
        canales oficiales deberán ser aportados y revisados por el asesor
        jurídico.
      </p>
    </InfoPage>
  );
}
