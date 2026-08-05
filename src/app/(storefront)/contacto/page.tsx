import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Datos de contacto provisionales de la demostración.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Datos provisionales"
      intro="Estos datos existen para demostrar el diseño y deben sustituirse antes de cualquier uso público."
      title="Contacto"
    >
      <h2>Oficina de farmacia</h2>
      <dl className="mt-5 grid gap-5">
        <div>
          <dt className="text-ink-muted text-sm">Dirección</dt>
          <dd className="text-forest font-bold">{pharmacyConfig.address}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-sm">Teléfono</dt>
          <dd className="text-forest font-bold">{pharmacyConfig.phone}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-sm">Correo</dt>
          <dd className="text-forest font-bold">{pharmacyConfig.email}</dd>
        </div>
      </dl>
      <p className="bg-sage mt-8 rounded-2xl p-5 text-sm">
        No hay formulario, correo ni WhatsApp conectados en esta fase. Estos
        datos no deben utilizarse para contactar.
      </p>
    </InfoPage>
  );
}
