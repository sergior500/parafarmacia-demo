import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder legal"
      intro="No se presenta este texto como política de privacidad definitiva."
      title="Privacidad"
    >
      <p>
        El prototipo guarda datos ficticios únicamente en el almacenamiento
        local del navegador. El tratamiento real, los plazos, bases jurídicas y
        derechos quedan pendientes de validación especializada.
      </p>
    </InfoPage>
  );
}
