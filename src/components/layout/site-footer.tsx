import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Newsletter } from "@/components/shared/newsletter";
import { pharmacyConfig } from "@/lib/config";

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

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="page-shell relative z-10 -mb-16">
        <Newsletter />
      </div>
      <div className="bg-forest-dark pt-32 text-white">
        <div className="page-shell grid gap-12 pb-14 lg:grid-cols-[1.15fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-forest grid size-11 place-items-center rounded-2xl bg-white">
                <Leaf aria-hidden="true" className="size-5" />
              </span>
              <strong className="font-display text-2xl tracking-[-.04em]">
                {pharmacyConfig.name}
              </strong>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Una propuesta de parafarmacia online clara, cercana y preparada
              para crecer. Todo el contenido comercial actual es de
              demostración.
            </p>
            <ul className="mt-6 grid gap-3 text-xs text-white/65">
              <li className="flex items-center gap-2">
                <Phone aria-hidden="true" className="size-4" />{" "}
                {pharmacyConfig.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail aria-hidden="true" className="size-4" />{" "}
                {pharmacyConfig.email}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4" /> Sevilla ·
                ubicación pendiente
              </li>
            </ul>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-peach text-[.65rem] font-black tracking-[.15em] uppercase">
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
            <span>© 2026 {pharmacyConfig.name} · demostración</span>
            <Link href="/admin">Acceso al panel interno</Link>
            <span>Tarjeta y Bizum simulados · sin envíos reales</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
