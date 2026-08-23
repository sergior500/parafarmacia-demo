import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <InfoPage
      legal
      eyebrow="Privacidad y almacenamiento"
      intro="Actualmente no se han activado servicios de analítica ni publicidad de terceros."
      title="Cookies"
    >
      <p>
        El sitio utiliza almacenamiento local estrictamente funcional para
        conservar la cesta y los favoritos en este dispositivo. Esta política se
        actualizará antes de activar cualquier servicio opcional.
      </p>
    </InfoPage>
  );
}
