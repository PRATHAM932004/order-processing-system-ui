import React from "react";
import { OrderStatus } from "@/lib/types";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
  pulsing?: boolean;
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
  pulsing = true,
}: StatusBadgeProps) {
  if (status === "PENDING") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-amber-200 dark:border-amber-900/60 bg-[#FEF3C7] dark:bg-[#451A03] text-[#92400E] dark:text-[#FCD34D] select-none",
          className
        )}
      >
        {showIcon ? (
          <Clock
            className={cn("h-3.5 w-3.5 shrink-0", pulsing && "animate-pulse")}
          />
        ) : (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-[#F59E0B] shrink-0",
              pulsing && "animate-pulse"
            )}
          />
        )}
        <span>PENDING</span>
      </span>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-emerald-200 dark:border-emerald-900/60 bg-[#DCFCE7] dark:bg-[#052E16] text-[#166534] dark:text-[#86EFAC] select-none",
          className
        )}
      >
        {showIcon ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
        )}
        <span>CONFIRMED</span>
      </span>
    );
  }

  // CANCELLED
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-red-200 dark:border-red-900/60 bg-[#FEE2E2] dark:bg-[#450A0A] text-[#991B1B] dark:text-[#FCA5A5] select-none",
        className
      )}
    >
      {showIcon ? (
        <XCircle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] shrink-0" />
      )}
      <span>CANCELLED</span>
    </span>
  );
}
