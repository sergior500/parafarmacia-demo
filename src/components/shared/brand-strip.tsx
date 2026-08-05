import Link from "next/link";

import { brands } from "@/mocks/content";

export function BrandStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {brands
        .filter((brand) => brand.featured)
        .map((brand) => (
          <Link
            className="border-forest/8 group flex min-h-28 items-center justify-center rounded-[1.5rem] border px-4 text-center transition-transform hover:-translate-y-1"
            href={`/marcas/${brand.slug}`}
            key={brand.id}
            style={{ backgroundColor: brand.accent }}
          >
            <span>
              <strong className="text-forest block text-lg tracking-[-.03em]">
                {brand.name}
              </strong>
              <span className="text-ink-muted mt-1 block text-[.65rem] font-bold tracking-[.12em] uppercase opacity-0 transition-opacity group-hover:opacity-100">
                Ver marca
              </span>
            </span>
          </Link>
        ))}
    </div>
  );
}
