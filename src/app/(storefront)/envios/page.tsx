import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Envíos",
  robots: { index: false, follow: true },
};

export default function ShippingPage() {
  return (
    <InfoPage
      legal
      eyebrow="Entrega de pedidos"
      intro="Shopify mostrará las opciones, el coste y el plazo disponibles para cada dirección antes del pago."
      title="Envíos"
    >
      <p>
        La tienda no anticipa una tarifa ni un plazo genéricos. Shopify
        calculará las opciones válidas para la dirección introducida y las
        mostrará antes de confirmar el pago. La farmacia debe configurar allí la
        zona de servicio, los transportistas, los plazos y las tarifas.
      </p>
    </InfoPage>
  );
}
