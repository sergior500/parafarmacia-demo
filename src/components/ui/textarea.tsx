import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "border-forest/20 text-ink placeholder:text-ink-muted focus:border-forest focus:ring-sage min-h-28 w-full rounded-xl border bg-white px-4 py-3 text-base outline-none focus:ring-3",
        className,
      )}
      {...props}
    />
  );
}
