import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = { title: "Envíos" };

export default function ShippingPage() {
  return (
    <InfoPage
      legal
      eyebrow="Entrega de pedidos"
      intro="Shopify mostrará las opciones, el coste y el plazo disponibles para cada dirección antes del pago."
      title="Envíos"
    >
      <p>
        La zona de servicio, el transportista, los plazos de preparación y
        entrega, las tarifas y el posible umbral de envío gratuito están
        pendientes de confirmación. No se mostrará una promesa de entrega hasta
        que la farmacia configure y apruebe esas condiciones.
      </p>
    </InfoPage>
  );
}
