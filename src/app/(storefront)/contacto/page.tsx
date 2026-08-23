import type { Metadata } from "next";

import { InfoPage } from "@/components/shared/info-page";
import { pharmacyConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Canales de contacto de Farmacia Picual.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Atención al cliente"
      intro="Los canales de atención se publicarán cuando la farmacia confirme sus datos oficiales."
      title="Contacto"
    >
      <h2>Oficina de farmacia</h2>
      {pharmacyConfig.address ||
      pharmacyConfig.phone ||
      pharmacyConfig.email ? (
        <dl className="mt-5 grid gap-5">
          {pharmacyConfig.address ? (
            <div>
              <dt className="text-ink-muted text-sm">Dirección</dt>
              <dd className="text-forest font-bold">
                {pharmacyConfig.address}
              </dd>
            </div>
          ) : null}
          {pharmacyConfig.phone ? (
            <div>
              <dt className="text-ink-muted text-sm">Teléfono</dt>
              <dd className="text-forest font-bold">{pharmacyConfig.phone}</dd>
            </div>
          ) : null}
          {pharmacyConfig.email ? (
            <div>
              <dt className="text-ink-muted text-sm">Correo</dt>
              <dd className="text-forest font-bold">{pharmacyConfig.email}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="bg-sage mt-8 rounded-2xl p-5 text-sm">
          Canales de atención pendientes de publicación.
        </p>
      )}
    </InfoPage>
  );
}
