import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Envíos" };

export default function ShippingPage() {
  return (
    <InfoPage
      legal
      eyebrow="Operativa prevista"
      intro="Los pedidos se prepararán para entrega a domicilio con seguimiento cuando se conecte el transportista."
      title="Envíos"
    >
      <p>
        La zona de servicio, el transportista, los plazos de preparación y
        entrega, las tarifas y el posible umbral de envío gratuito están
        pendientes de acuerdo. La demo no genera expediciones ni códigos de
        seguimiento reales.
      </p>
    </InfoPage>
  );
}
