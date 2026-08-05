import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "bg-sage text-forest inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold tracking-[0.06em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
