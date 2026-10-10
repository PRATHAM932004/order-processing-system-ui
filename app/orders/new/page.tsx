import React from "react";
import { PlaceOrderForm } from "@/components/order/place-order-form";
import { Badge } from "@/components/ui/badge";
import { Zap, Radio } from "lucide-react";

export default function PlaceOrderPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Place Order
            </h1>
            <Badge variant="subtle" className="text-xs font-mono shrink-0">
              Topic: order.created
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Create a new customer order dispatched asynchronously via the Transactional Outbox and Kafka cluster.
          </p>
        </div>

        {/* Top action badges / indicator */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Radio className="h-3 w-3 animate-pulse shrink-0" />
            <span>Kafka Outbox: Ready</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground text-xs font-mono">
            <Zap className="h-3 w-3 text-primary shrink-0" />
            <span>Relay: 500ms</span>
          </div>
        </div>
      </div>

      {/* Advanced React Hook Form + Zod FormProvider */}
      <PlaceOrderForm />
    </div>
  );
}
