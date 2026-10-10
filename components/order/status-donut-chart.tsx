"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Order } from "@/lib/types";

interface StatusBreakdown {
  label: string;
  count: number;
  percentage: number;
  color: string;
  textColor: string;
}

export function StatusDonutChart({ orders = [] }: { orders?: Order[] }) {
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("today");

  const now = Date.now();
  const rangeMs =
    timeRange === "today"
      ? 24 * 60 * 60 * 1000
      : timeRange === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;

  const filtered = orders.filter((o) => {
    const ts = new Date(o.createdAt).getTime();
    return Number.isNaN(ts) || now - ts <= rangeMs;
  });

  const total = filtered.length;
  const confirmed = filtered.filter((o) => o.status === "CONFIRMED").length;
  const pending = filtered.filter((o) => o.status === "PENDING").length;
  const cancelled = filtered.filter((o) => o.status === "CANCELLED").length;

  const toPct = (c: number) =>
    total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0;

  const currentStats: StatusBreakdown[] = [
    {
      label: "Confirmed",
      count: confirmed,
      percentage: toPct(confirmed),
      color: "#22C55E",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending",
      count: pending,
      percentage: toPct(pending),
      color: "#F59E0B",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Cancelled",
      count: cancelled,
      percentage: toPct(cancelled),
      color: "#EF4444",
      textColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  // SVG Donut calculation
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDashoffset for segments
  let accumulatedPercent = 0;
  const segments = currentStats.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Order Status Distribution
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live execution outcomes from PostgreSQL &amp; Kafka saga consumers
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs shrink-0">
          {(["today", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all",
                timeRange === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range === "today" ? "Today" : range === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className="w-40 h-40 sm:w-44 sm:h-44 -rotate-90 transform"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r={radius}
              className="stroke-muted"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {segments.map((seg, i) =>
              seg.percentage > 0 ? (
                <circle
                  key={i}
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              ) : null
            )}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Orders
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 w-full sm:w-auto min-w-[180px]">
          {currentStats.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground tabular-nums">
                  {item.count.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums px-2 py-0.5 rounded bg-muted text-[11px]",
                    item.textColor
                  )}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          Outbox relay interval: 500ms
        </span>
        <span className="font-mono text-[11px] truncate max-w-full">
          Topics: order.created • order.inventory • order.payment
        </span>
      </div>
    </Card>
  );
}
