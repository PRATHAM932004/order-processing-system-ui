import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "neutral";
  pulsingDot?: boolean;
  colorClass?: string;
}

export function KpiCard({
  label,
  value,
  subtext,
  badge,
  badgeVariant = "neutral",
  pulsingDot = false,
  colorClass,
}: KpiCardProps) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-primary/40 overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          {pulsingDot && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          )}
        </div>

        <div className="mt-2.5 sm:mt-3">
          <span
            className={cn(
              "text-2xl sm:text-3xl font-semibold tracking-tight font-sans tabular-nums text-foreground",
              colorClass
            )}
          >
            {value}
          </span>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {subtext && (
          <span className="text-muted-foreground truncate max-w-full">
            {subtext}
          </span>
        )}
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium shrink-0",
              badgeVariant === "success" &&
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              badgeVariant === "warning" &&
                "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
              badgeVariant === "danger" &&
                "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
              badgeVariant === "neutral" && "bg-muted text-muted-foreground",
              badgeVariant === "default" && "bg-primary-subtle text-primary"
            )}
          >
            {badge}
          </span>
        )}
      </div>
    </Card>
  );
}
