"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useGetOrderByIdQuery,
  useGetKafkaEventsQuery,
} from "@/store/api/order-api";
import { OrderStatusStepper } from "@/components/order/order-status-stepper";
import { StatusBadge } from "@/components/order/status-badge";
import { JsonPayloadViewer } from "@/components/order/json-payload-viewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatShortId, formatRelativeTime } from "@/lib/utils";
import {
  Copy,
  Check,
  RefreshCw,
  FileJson,
  ArrowLeft,
  Server,
  MapPin,
  Clock,
  Radio,
  CreditCard,
  Building,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";

  const { data: order, isLoading, refetch, isFetching } = useGetOrderByIdQuery(orderId, {
    pollingInterval: 2000,
    skip: !orderId,
  });
  const { data: events = [] } = useGetKafkaEventsQuery(
    { orderId },
    { pollingInterval: 2000, skip: !orderId }
  );

  const [copiedId, setCopiedId] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  const handleCopyEventPayload = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedEventId(id);
    toast.success("Copied event JSON payload to clipboard");
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(true);
    toast.success(`Copied UUID: ${orderId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = () => {
    if (!order) return;
    navigator.clipboard.writeText(JSON.stringify(order, null, 2));
    toast.success("Order payload copied as JSON");
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground font-mono">
          Fetching order #{formatShortId(orderId)} from distributed partitions...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-xs text-muted-foreground">
          No record found for ID: {orderId}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  // Financial calculations
  const subtotal = order.totalAmount;
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;

  return (
    <div className="space-y-6 pb-14">
      {/* Back button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-0"
        >
          <Link href="/orders">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Orders
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Order #{formatShortId(order.id)}
            </h1>

            {/* Status Badge */}
            <StatusBadge status={order.status} />

            {/* Live Polling Indicator */}
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-[11px] font-mono text-muted-foreground"
            >
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Polling GET /api/orders/{formatShortId(order.id)} every 2s</span>
            </div>
          </div>

          {/* Full UUID Copy Bar */}
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground min-w-0">
            <span className="shrink-0">UUID:</span>
            <span className="text-foreground bg-muted px-2 py-0.5 rounded border border-border/60 truncate max-w-[200px] sm:max-w-none">
              {order.id}
            </span>
            <button
              onClick={handleCopyUuid}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-muted shrink-0"
              title="Copy full UUID"
            >
              {copiedId ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <FileJson className="h-3.5 w-3.5" />
            Copy JSON Payload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Re-poll Now
          </Button>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-border bg-card/60 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px]">Created At</span>
          <span className="font-medium text-foreground block mt-0.5">
            {formatRelativeTime(order.createdAt)} • {new Date(order.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px]">Customer Reference</span>
          <span className="font-medium text-foreground block mt-0.5 truncate">
            {order.customerName} ({order.customerEmail})
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px]">Kafka Partition & Offset</span>
          <span className="font-mono text-foreground font-semibold block mt-0.5">
            Partition {order.kafkaPartition ?? 3} • Offset #{order.kafkaOffset ?? 89412}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[11px]">Total Amount (INR)</span>
          <span className="font-semibold text-foreground font-sans tabular-nums text-sm block mt-0.5">
            {formatINR(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Hero Element: Live Asynchronous Lifecycle Stepper */}
      <OrderStatusStepper order={order} onRefresh={refetch} />

      {/* Main Content Area (2-column grid at desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Line Items & Kafka Micro-log (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Line Items Card */}
          <Card className="p-4 sm:p-5 overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">
              Ordered Items & SKUs ({order.items.length})
            </h3>

            <div className="pt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product & SKU</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <span className="font-medium text-foreground block text-xs">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.sku || "SKU-GEN-01"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatINR(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium font-sans text-xs tabular-nums text-foreground">
                        {formatINR(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Kafka Event Stream & Audit Timeline card */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary animate-pulse" />
                <h3 className="text-sm font-semibold text-foreground">
                  Kafka Event Stream & Audit Timeline
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Partition: {order.kafkaPartition ?? 3}
              </span>
            </div>

            <div className="pt-4 space-y-3">
              {events.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No event records emitted for this order partition yet.
                </div>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 font-mono text-xs"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(evt.timestamp)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="px-1.5 py-0.2 rounded bg-muted border">
                          {evt.topic}
                        </span>
                        <span>Offset #{evt.offset}</span>
                        {evt.consumerGroup && <span>• {evt.consumerGroup}</span>}
                      </div>
                      {evt.payloadSummary && (
                        <JsonPayloadViewer payload={evt.payloadSummary} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Financial Breakdown & Dispatch Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Financial Breakdown Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">
              Financial Breakdown
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SGST (9%)</span>
                <span className="tabular-nums">{formatINR(sgst)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>CGST (9%)</span>
                <span className="tabular-nums">{formatINR(cgst)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Logistics / Freight</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  FREE (Priority)
                </span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Grand Total</span>
                <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatINR(subtotal)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Payment: Corporate Line</span>
              </div>
              <span className="font-mono text-[11px]">Auth: auth_tx_998124</span>
            </div>
          </Card>

          {/* Delivery & Destination Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">
              Delivery & Dispatch Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">
                    BLR Tech Park, Campus 4
                  </span>
                  <span className="text-muted-foreground text-[11px] block mt-0.5">
                    Outer Ring Road, Bengaluru, KA 560103, India
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Server className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">
                    Assigned Kafka Broker
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px] block mt-0.5">
                    localhost:9092 (Broker 1 Operational)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">
                    Target Processing SLA
                  </span>
                  <span className="text-muted-foreground text-[11px] block mt-0.5 font-mono">
                    &lt; 2.0s End-to-End Resolution
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
