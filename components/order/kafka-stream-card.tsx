"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KafkaEvent } from "@/lib/types";
import { useGetKafkaEventsQuery } from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import { Radio, Play, Pause, RefreshCw, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface KafkaStreamCardProps {
  orderId?: string;
  maxEvents?: number;
}

export function KafkaStreamCard({
  orderId,
  maxEvents = 6,
}: KafkaStreamCardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: events, refetch } = useGetKafkaEventsQuery(
    orderId ? { orderId } : undefined,
    { skip: !isAuthenticated }
  );
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamList, setStreamList] = useState<KafkaEvent[]>([]);

  useEffect(() => {
    if (events) {
      setStreamList(events.slice(0, maxEvents));
    }
  }, [events, maxEvents]);

  // Live polling effect
  useEffect(() => {
    if (!isStreaming || !isAuthenticated) return;
    const interval = setInterval(() => {
      refetch();
    }, 2500);
    return () => clearInterval(interval);
  }, [isStreaming, isAuthenticated, refetch]);

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "order.created":
        return "border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300";
      case "order.inventory":
        return "border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300";
      case "order.payment":
        return "border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300";
      default:
        return "border-border bg-muted text-foreground";
    }
  };

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isStreaming ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              Live Outbox &amp; Kafka Stream
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {isStreaming
                ? "Polling GET /api/events every 2.5s"
                : "Stream paused"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            className="h-8 px-2 text-xs"
            title={isStreaming ? "Pause Stream" : "Resume Stream"}
          >
            {isStreaming ? (
              <Pause className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Play className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 px-2 text-xs"
            title="Refresh Log"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Stream Rows */}
      <div className="py-3 space-y-2 overflow-hidden">
        {streamList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No Kafka outbox events recorded yet. Place an order to emit events.
          </div>
        ) : (
          streamList.map((evt) => (
            <div
              key={evt.id}
              className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors text-xs font-mono"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    evt.status === "FAILED"
                      ? "bg-rose-500"
                      : evt.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${getTopicColor(
                    evt.topic
                  )}`}
                >
                  {evt.topic}
                </span>
                <span className="font-semibold text-foreground truncate">
                  {evt.eventType}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 text-muted-foreground text-[11px] ml-auto">
                <span className="text-[10px] sm:text-[11px]">
                  P:{evt.partition} #{evt.offset}
                </span>
                <span className="text-[10px]">
                  {formatRelativeTime(evt.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
          Outbox table • localhost:9092
        </span>
        <Link
          href="/kafka-stream"
          className="text-primary hover:underline flex items-center gap-1 font-sans text-xs font-medium"
        >
          View topology <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
