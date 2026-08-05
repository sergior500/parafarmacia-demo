import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-forest/15 text-ink placeholder:text-ink-muted focus:border-forest focus:ring-sage min-h-12 w-full rounded-2xl border bg-white px-4 text-base shadow-sm outline-none focus:ring-3",
        className,
      )}
      {...props}
    />
  );
}
