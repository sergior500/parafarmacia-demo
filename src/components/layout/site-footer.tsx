import Link from "next/link";

import { pharmacyConfig } from "@/lib/config";

const legalLinks = [
  ["Aviso legal", "/aviso-legal"],
  ["Privacidad", "/privacidad"],
  ["Cookies", "/cookies"],
  ["Condiciones de compra", "/condiciones-de-compra"],
  ["Envíos", "/envios"],
  ["Devoluciones", "/devoluciones"],
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-forest-dark mt-24 text-white">
      <div className="page-shell grid gap-12 py-16 md:grid-cols-[1.2fr_.75fr_.85fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative grid size-10 place-items-center rounded-xl bg-white">
              <span className="bg-forest absolute h-5 w-1.5 rounded-full" />
              <span className="bg-forest absolute h-1.5 w-5 rounded-full" />
            </span>
            <p className="text-lg font-extrabold tracking-[-0.03em]">
              {pharmacyConfig.name}
            </p>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            Prototipo funcional de una tienda online de parafarmacia en Sevilla.
            No admite compras ni pagos reales.
          </p>
        </div>
        <div>
          <p className="text-coral-light text-[0.65rem] font-extrabold tracking-[0.16em] uppercase">
            Te ayudamos
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-white/65">
            <li>
              <Link href="/contacto">Contacto</Link>
            </li>
            <li>
              <Link href="/sobre-la-farmacia">Sobre la farmacia</Link>
            </li>
            <li>
              <Link href="/admin">Panel interno demo</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-coral-light text-[0.65rem] font-extrabold tracking-[0.16em] uppercase">
            Información
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-white/65">
            {legalLinks.map(([label, href]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/8 py-5">
        <div className="page-shell flex flex-wrap justify-between gap-3 text-[0.65rem] text-white/40">
          <span>© 2026 {pharmacyConfig.name} · demostración</span>
          <span>
            Referencias de muestra · precios, stock, códigos e imágenes
            ficticios
          </span>
        </div>
      </div>
    </footer>
  );
}
