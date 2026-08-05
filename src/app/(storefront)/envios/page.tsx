import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Envíos" };

export default function ShippingPage() {
  return (
    <InfoPage
      legal
      eyebrow="Placeholder operativo"
      intro="No existe transportista, zona de servicio ni tarifa configurados."
      title="Envíos"
    >
      <p>
        La política de envíos deberá incorporar el territorio autorizado, los
        requisitos especiales, plazos, costes y seguimiento aprobados.
      </p>
    </InfoPage>
  );
}
