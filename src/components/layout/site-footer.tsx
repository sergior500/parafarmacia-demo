import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { pharmacyConfig } from "@/lib/config";
import { getAdminActor, hasAdminCapability } from "@/server/admin-auth";

const groups = [
  {
    title: "Comprar",
    links: [
      ["Todos los productos", "/parafarmacia"],
      ["Dermocosmética", "/categorias/cuidado-facial"],
      ["Protección solar", "/categorias/proteccion-solar"],
      ["Bebé y maternidad", "/categorias/cuidado-infantil"],
      ["Marcas", "/marcas"],
    ],
  },
  {
    title: "Te acompañamos",
    links: [
      ["Centro de consejos", "/consejos"],
      ["Cómo comprar", "/como-comprar"],
      ["Envíos", "/envios"],
      ["Devoluciones", "/devoluciones"],
      ["Contacto", "/contacto"],
    ],
  },
  {
    title: "Información",
    links: [
      ["Sobre la tienda", "/sobre-la-farmacia"],
      ["Aviso legal", "/aviso-legal"],
      ["Privacidad", "/privacidad"],
      ["Cookies", "/cookies"],
      ["Condiciones", "/condiciones-de-compra"],
    ],
  },
] as const;

export async function SiteFooter() {
  const actor = await getAdminActor();
  const canAccessAdmin = Boolean(
    actor && hasAdminCapability(actor, "dashboard:read"),
  );

  return (
    <footer className="bg-forest-dark relative mt-24 overflow-hidden pt-16 text-white">
      <span className="catalog-number pointer-events-none absolute -right-8 -bottom-28 text-[19rem] leading-none text-white/[.025]">
        FP
      </span>
      <div className="page-shell grid gap-12 pb-14 lg:grid-cols-[1.15fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-seal size-12 border-white/25 text-sm">
              FP
            </span>
            <strong className="font-display text-2xl tracking-[-.04em]">
              {pharmacyConfig.name}
            </strong>
          </div>
          <p className="font-display mt-7 max-w-sm text-3xl leading-[1.05] tracking-[-.04em] text-white">
            Cuidarse bien empieza por entender bien.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Parafarmacia online con información clara, selección cuidada y
            compra conectada con Shopify.
          </p>
          {pharmacyConfig.phone ||
          pharmacyConfig.email ||
          pharmacyConfig.address ? (
            <ul className="mt-6 grid gap-3 text-xs text-white/65">
              {pharmacyConfig.phone ? (
                <li className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-4" />
                  {pharmacyConfig.phone}
                </li>
              ) : null}
              {pharmacyConfig.email ? (
                <li className="flex items-center gap-2">
                  <Mail aria-hidden="true" className="size-4" />
                  {pharmacyConfig.email}
                </li>
              ) : null}
              {pharmacyConfig.address ? (
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4" />
                  {pharmacyConfig.address}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-ochre text-[.65rem] font-black tracking-[.15em] uppercase">
                {group.title}
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-white/65">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link className="hover:text-white" href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-wrap justify-between gap-3 py-5 text-[.65rem] text-white/45">
          <span>© 2026 {pharmacyConfig.name}</span>
          {canAccessAdmin ? (
            <a href="/admin">Acceso al panel interno</a>
          ) : null}
          <span>Pago seguro gestionado por Shopify</span>
        </div>
      </div>
    </footer>
  );
}
