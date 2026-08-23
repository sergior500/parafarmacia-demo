import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <InfoPage
      legal
      eyebrow="Información provisional"
      intro="La política definitiva se completará con la identidad y los proveedores confirmados por la farmacia."
      title="Privacidad"
    >
      <p>
        El sitio conserva la cesta y los favoritos en el almacenamiento local de
        este dispositivo. Los datos de cuenta, pedido y pago se tratarán
        mediante Shopify cuando se habilite la venta, con los plazos, bases
        jurídicas y derechos que se publiquen tras la validación especializada.
      </p>
    </InfoPage>
  );
}
