"use client";

import React from "react";
import { Order, EventPhase } from "@/lib/types";
import {
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OrderStatusStepperProps {
  order: Order;
  onRefresh?: () => void;
}

interface StepItem {
  id: EventPhase;
  title: string;
  topic: string;
  description: string;
  detail: string;
}

const STEPS: StepItem[] = [
  {
    id: "ORDER_PLACED",
    title: "Order Placed",
    topic: "order.created",
    description: "Saved to DB & Outbox table",
    detail: "Relayed by OutboxPublisher",
  },
  {
    id: "INVENTORY_RESERVED",
    title: "Inventory Reserved",
    topic: "order.inventory",
    description: "Pessimistic stock lock verified",
    detail: "Processed by InventoryConsumer",
  },
  {
    id: "PAYMENT_PROCESSED",
    title: "Payment Processed",
    topic: "order.payment",
    description: "Payment authorization & ledger",
    detail: "Processed by PaymentConsumer",
  },
  {
    id: "ORDER_CONFIRMED",
    title: "Order Confirmed",
    topic: "order.payment",
    description: "Final lifecycle status committed",
    detail: "Updated by OrderStatusConsumer",
  },
];

export function OrderStatusStepper({
  order,
  onRefresh,
}: OrderStatusStepperProps) {
  const getStepStatus = (stepId: EventPhase, index: number) => {
    if (order.status === "CANCELLED") {
      const reason = (order.failureReason || "").toLowerCase();
      const failedAtPayment = reason.includes("payment");
      if (failedAtPayment) {
        if (index <= 1) return "completed";
        if (index === 2) return "failed";
        return "waiting";
      }
      if (index === 0) return "completed";
      if (index === 1) return "failed";
      return "waiting";
    }

    if (order.status === "CONFIRMED") {
      return "completed";
    }

    // PENDING state logic
    const phaseOrder: string[] = [
      "ORDER_PLACED",
      "INVENTORY_RESERVED",
      "PAYMENT_PROCESSED",
      "ORDER_CONFIRMED",
    ];

    const currentIdx = phaseOrder.indexOf(
      order.currentPhase || "ORDER_PLACED"
    );

    if (index < currentIdx) return "completed";
    if (index === currentIdx) return "active";
    return "waiting";
  };

  return (
    <Card className="p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-base font-semibold text-foreground">
              Asynchronous Kafka Saga Lifecycle Pipeline
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live progression across Spring Boot Kafka consumers (<code className="font-mono">order.created</code> → <code className="font-mono">order.inventory</code> → <code className="font-mono">order.payment</code>).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1.5 h-8 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-poll Status
          </Button>
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="pt-6 sm:pt-8 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, idx) => {
            const status = getStepStatus(step.id, idx);

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-start group"
              >
                {/* Connecting Line (desktop only) */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "hidden lg:block absolute top-4 left-8 right-[-24px] h-[2px] transition-colors",
                      status === "completed"
                        ? "bg-primary"
                        : status === "active"
                        ? "bg-gradient-to-r from-primary to-border animate-pulse"
                        : "bg-border"
                    )}
                  />
                )}

                {/* Step Circle & Topic Badge */}
                <div className="flex items-center gap-3 z-10 mb-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all shadow-sm",
                      status === "completed" &&
                        "border-primary bg-primary text-primary-foreground",
                      status === "active" &&
                        "border-primary bg-primary-subtle text-primary ring-4 ring-primary/20 animate-pulse",
                      status === "failed" &&
                        "border-destructive bg-destructive text-destructive-foreground ring-4 ring-destructive/20",
                      status === "waiting" &&
                        "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {status === "completed" && (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    )}
                    {status === "active" && (
                      <Clock className="h-4 w-4 animate-spin stroke-[2]" />
                    )}
                    {status === "failed" && (
                      <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
                    )}
                    {status === "waiting" && <span>{idx + 1}</span>}
                  </div>

                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {step.topic}
                  </span>
                </div>

                {/* Step Text Info */}
                <div className="space-y-1">
                  <h4
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      status === "active" && "text-primary",
                      status === "failed" && "text-destructive",
                      status === "completed" && "text-foreground",
                      status === "waiting" && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {step.description}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground/80">
                    {status === "failed" ? "❌ Failed" : step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Callout Banner if Cancelled */}
      {order.status === "CANCELLED" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-destructive">
              Workflow Terminated &amp; Compensating Saga Executed
            </span>
            <p className="text-destructive/90">
              {order.failureReason ||
                "Order was cancelled due to inventory stockout or payment failure."}
            </p>
          </div>
        </div>
      )}

      {/* Real-time Consumer Footer */}
      <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Phase: {order.currentPhase || order.status}</span>
          </span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Outbox Relay: Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-muted">
            Consumers: inventory-service • payment-service • order-service
          </span>
        </div>
      </div>
    </Card>
  );
}
