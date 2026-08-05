import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-forest/8 rounded-[1.75rem] border bg-white shadow-[0_22px_70px_-44px_rgba(18,63,56,.45)]",
        className,
      )}
      {...props}
    />
  );
}
