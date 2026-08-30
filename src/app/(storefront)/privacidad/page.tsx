import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Privacidad",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      legal
      eyebrow="Tratamiento de datos"
      intro="Resumen técnico del tratamiento previsto, pendiente de incorporar la identidad legal y la revisión jurídica de la farmacia."
      title="Privacidad"
    >
      <p>
        El sitio conserva la cesta y los favoritos en el almacenamiento local de
        este dispositivo. Los datos de cuenta, pedido y pago se tratarán
        mediante Shopify al utilizar el acceso de cliente o el proceso de
        compra. La versión definitiva debe detallar responsables, proveedores,
        plazos, bases jurídicas y el ejercicio de derechos.
      </p>
    </InfoPage>
  );
}
