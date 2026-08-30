import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";

export const metadata: Metadata = {
  title: "Devoluciones",
  robots: { index: false, follow: true },
};

export default function ReturnsPage() {
  return (
    <InfoPage
      legal
      eyebrow="Derechos y excepciones"
      intro="La tienda no ofrecerá devoluciones voluntarias de productos abiertos cuando, por razones de salud o higiene, no sean aptos para su devolución."
      title="Cambios y devoluciones"
    >
      <p>
        En las compras online se respetará el derecho de desistimiento cuando
        resulte legalmente aplicable. Los productos precintados que no sean
        aptos para ser devueltos por razones de protección de la salud o de
        higiene podrán quedar excluidos una vez desprecintados.
      </p>
      <p>
        Los productos defectuosos, dañados durante el transporte o enviados por
        error se atenderán conforme a la normativa y a las garantías que
        correspondan. La versión definitiva debe incorporar el canal de
        contacto, los plazos, la dirección y el procedimiento acordados por la
        farmacia.
      </p>
    </InfoPage>
  );
}
