import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-muted text-foreground border",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "border-border text-foreground border",
        subtle:
          "border-transparent bg-primary-subtle text-primary font-semibold",
        pending:
          "border border-amber-200 dark:border-amber-800 bg-[#FEF3C7] dark:bg-[#451A03] text-[#92400E] dark:text-[#FCD34D]",
        confirmed:
          "border border-emerald-200 dark:border-emerald-800 bg-[#DCFCE7] dark:bg-[#052E16] text-[#166534] dark:text-[#86EFAC]",
        cancelled:
          "border border-red-200 dark:border-red-800 bg-[#FEE2E2] dark:bg-[#450A0A] text-[#991B1B] dark:text-[#FCA5A5]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
