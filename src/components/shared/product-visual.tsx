import {
  Activity,
  Apple,
  Baby,
  Droplets,
  Package,
  Smile,
  Sparkles,
  Sun,
} from "lucide-react";
import Image from "next/image";

import type { Product } from "@/domain/product/product";
import { cn } from "@/lib/utils";

const visualThemes = {
  facial: {
    background: "from-[#eee9de] via-[#f8f5ec] to-[#e3decf]",
    accent: "bg-[#6d773f]",
    accentText: "text-[#6d773f]",
    icon: Sparkles,
  },
  corporal: {
    background: "from-[#e1e4d5] via-[#f3f2e9] to-[#d3dbc7]",
    accent: "bg-[#486a52]",
    accentText: "text-[#486a52]",
    icon: Package,
  },
  solar: {
    background: "from-[#f2dfbd] via-[#fbf4e5] to-[#e8c991]",
    accent: "bg-[#b78032]",
    accentText: "text-[#9f6d25]",
    icon: Sun,
  },
  hygiene: {
    background: "from-[#dce7e2] via-[#f4f5ef] to-[#cadbd4]",
    accent: "bg-[#396c61]",
    accentText: "text-[#396c61]",
    icon: Droplets,
  },
  bucal: {
    background: "from-[#e0e5df] via-[#f5f4ec] to-[#d2dacf]",
    accent: "bg-[#486b63]",
    accentText: "text-[#486b63]",
    icon: Smile,
  },
  child: {
    background: "from-[#efe0d2] via-[#faf3e9] to-[#e6cdb8]",
    accent: "bg-[#b55b3f]",
    accentText: "text-[#a65037]",
    icon: Baby,
  },
  nutrition: {
    background: "from-[#eee8d4] via-[#f9f6ec] to-[#dfd4ad]",
    accent: "bg-[#796a31]",
    accentText: "text-[#796a31]",
    icon: Apple,
  },
  recovery: {
    background: "from-[#e3ddd1] via-[#f6f2e8] to-[#cfd8ce]",
    accent: "bg-[#596b55]",
    accentText: "text-[#596b55]",
    icon: Activity,
  },
} as const;

export function ProductVisual({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const themeKey =
    product.categoryId === "cat-nutricion"
      ? "nutrition"
      : product.categoryId === "cat-ortopedia" ||
          product.categoryId === "cat-salud"
        ? "recovery"
        : product.categoryId === "cat-infantil"
          ? "child"
          : product.categoryId === "cat-higiene"
            ? "hygiene"
            : product.categoryId === "cat-bucal"
              ? "bucal"
              : product.categoryId === "cat-solar"
                ? "solar"
                : product.categoryId === "cat-corporal"
                  ? "corporal"
                  : "facial";
  const theme = visualThemes[themeKey];
  const Icon = theme.icon;
  const usesCatalogImage = Boolean(product.sourceDocument && product.imageUrl);

  return (
    <div
      role={usesCatalogImage ? undefined : "img"}
      aria-label={
        usesCatalogImage
          ? undefined
          : `Representación gráfica de ${product.name}`
      }
      className={cn(
        "border-forest/10 relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[.4rem_1.8rem_.4rem_1.8rem] border bg-gradient-to-br",
        theme.background,
        className,
      )}
    >
      <span className="bg-forest/20 absolute inset-x-0 top-0 h-px" />
      <span className={cn("absolute top-0 right-0 h-14 w-1", theme.accent)} />
      <span className="absolute top-4 left-4 z-10 text-[0.52rem] font-black tracking-[0.16em] text-black/30 uppercase">
        {usesCatalogImage ? "Archivo Picual" : "Vista orientativa"}
      </span>

      {usesCatalogImage ? (
        <div className="relative h-[78%] w-[72%] transition-transform duration-300 group-hover:-translate-y-1">
          <Image
            alt={product.name}
            className="object-contain mix-blend-multiply drop-shadow-[0_22px_20px_rgba(18,63,56,.18)]"
            fill
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 34vw, 24vw"
            src={product.imageUrl}
            unoptimized
          />
        </div>
      ) : (
        <div className="relative flex h-[68%] w-[42%] min-w-28 flex-col items-center justify-between rounded-[1.7rem_1.7rem_1.1rem_1.1rem] border border-white/85 bg-white px-3 pt-4 pb-3 shadow-[0_24px_45px_-20px_rgba(18,63,56,.42)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[1deg]">
          <span className="absolute -top-2 h-3 w-[58%] rounded-t-lg bg-white/90 shadow-sm" />
          <span className="text-center text-[0.5rem] font-extrabold tracking-[0.1em] text-black/40 uppercase">
            {product.brandOrLaboratory}
          </span>
          <Icon
            aria-hidden="true"
            className={cn("my-1 size-6", theme.accentText)}
            strokeWidth={1.7}
          />
          <span className="text-forest text-center text-[0.7rem] leading-[1.05] font-extrabold tracking-[-0.02em]">
            {product.name}
          </span>
          <span className={cn("mt-2 h-1.5 w-10 rounded-full", theme.accent)} />
        </div>
      )}
    </div>
  );
}
