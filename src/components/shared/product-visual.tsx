import { Baby, Droplets, Package, Smile, Sparkles, Sun } from "lucide-react";

import type { Product } from "@/domain/product/product";
import { cn } from "@/lib/utils";

const visualThemes = {
  facial: {
    background: "from-[#eee7f7] via-[#f8f4fb] to-[#e4d9f1]",
    accent: "bg-[#7b5aa6]",
    accentText: "text-[#7b5aa6]",
    soft: "bg-[#d8c9eb]",
    icon: Sparkles,
  },
  corporal: {
    background: "from-[#dcefe7] via-[#edf7f1] to-[#cce5db]",
    accent: "bg-[#1d806d]",
    accentText: "text-[#1d806d]",
    soft: "bg-[#b9dfd2]",
    icon: Package,
  },
  solar: {
    background: "from-[#fff0d1] via-[#fff8e8] to-[#f8d99d]",
    accent: "bg-[#d88926]",
    accentText: "text-[#c77718]",
    soft: "bg-[#f2ce83]",
    icon: Sun,
  },
  hygiene: {
    background: "from-[#dbf0f1] via-[#f2f9f8] to-[#cae7e8]",
    accent: "bg-[#21818a]",
    accentText: "text-[#21818a]",
    soft: "bg-[#b9dfe1]",
    icon: Droplets,
  },
  bucal: {
    background: "from-[#e5edfa] via-[#f5f8fd] to-[#d4e1f4]",
    accent: "bg-[#3d6fa8]",
    accentText: "text-[#3d6fa8]",
    soft: "bg-[#c5d7ee]",
    icon: Smile,
  },
  child: {
    background: "from-[#fff0df] via-[#fff8ef] to-[#f9ddc5]",
    accent: "bg-[#dc7c53]",
    accentText: "text-[#c7653c]",
    soft: "bg-[#f3cdb0]",
    icon: Baby,
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
    product.categoryId === "cat-infantil"
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

  return (
    <div
      role="img"
      aria-label={`Representación de demostración de ${product.name}`}
      className={cn(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br",
        theme.background,
        className,
      )}
    >
      <span
        className={cn(
          "absolute -top-12 -right-9 size-36 rounded-full opacity-60 blur-[1px]",
          theme.soft,
        )}
      />
      <span className="absolute -bottom-16 -left-8 size-36 rounded-full border-[1.8rem] border-white/45" />
      <span className="absolute top-4 left-4 text-[0.52rem] font-black tracking-[0.16em] text-black/30 uppercase">
        Producto demo
      </span>

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
    </div>
  );
}
