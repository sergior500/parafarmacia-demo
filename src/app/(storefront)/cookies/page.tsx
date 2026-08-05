import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder legal"
      intro="No existen servicios de analítica ni cookies de terceros en esta fase."
      title="Cookies"
    >
      <p>
        La demostración utiliza almacenamiento local para conservar el carrito,
        los pedidos mock y el rol seleccionado. La política definitiva dependerá
        de las tecnologías reales incorporadas.
      </p>
    </InfoPage>
  );
}
