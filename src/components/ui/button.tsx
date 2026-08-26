import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[.35rem_1rem_.35rem_1rem] px-5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-forest text-white shadow-[0_10px_24px_-12px_rgba(9,45,41,.85)] hover:-translate-y-0.5 hover:bg-forest-light active:translate-y-0 active:bg-forest-dark",
        secondary: "bg-sage text-forest hover:bg-sage-dark",
        outline:
          "border border-forest/15 bg-white text-forest hover:-translate-y-0.5 hover:border-forest/25 hover:bg-cream",
        ghost: "text-forest hover:bg-sage/60",
        danger: "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-4 text-xs",
        lg: "min-h-13 px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
