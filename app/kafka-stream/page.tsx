"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/order/kpi-card";
import { JsonPayloadViewer } from "@/components/order/json-payload-viewer";
import { useGetKafkaEventsQuery } from "@/store/api/order-api";
import { useAppSelector } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import { Radio, Layers, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TopicInfo {
  name: string;
  partitions: number;
  replicationFactor: number;
  consumerGroups: string[];
  description: string;
}

const TOPICS: TopicInfo[] = [
  {
    name: "ALL",
    partitions: 3,
    replicationFactor: 1,
    consumerGroups: [
      "inventory-service",
      "payment-service",
      "order-service",
    ],
    description:
      "All transactional outbox events across order.created, order.inventory, and order.payment",
  },
  {
    name: "order.created",
    partitions: 1,
    replicationFactor: 1,
    consumerGroups: ["inventory-service"],
    description:
      "OrderCreated events written to outbox_events by OrderService and consumed by InventoryConsumer",
  },
  {
    name: "order.inventory",
    partitions: 1,
    replicationFactor: 1,
    consumerGroups: ["payment-service", "order-service"],
    description:
      "InventoryReserved and InventoryFailed events emitted by InventoryService",
  },
  {
    name: "order.payment",
    partitions: 1,
    replicationFactor: 1,
    consumerGroups: ["order-service", "inventory-service"],
    description:
      "PaymentSucceeded and PaymentFailed events emitted by PaymentService (triggers order confirmation or compensating stock restoration)",
  },
];

export default function KafkaStreamPage() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const {
    data: events = [],
    refetch,
    isFetching,
  } = useGetKafkaEventsQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 3000,
  });
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  const handleCopyPayload = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedEventId(id);
    toast.success("Copied event JSON payload to clipboard");
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const filteredEvents = events.filter(
    (e) => selectedTopic === "ALL" || e.topic === selectedTopic
  );

  const getTopicBadgeClass = (topic: string) => {
    switch (topic) {
      case "order.created":
        return "border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300";
      case "order.inventory":
        return "border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300";
      case "order.payment":
        return "border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              Kafka Event Stream &amp; Outbox Log
            </h1>
            <Badge
              variant="subtle"
              className="text-xs font-mono whitespace-nowrap shrink-0"
            >
              Cluster: localhost:9092
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Live observability of the{" "}
            <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
              outbox_events
            </code>{" "}
            table and Kafka topics (
            <code className="font-mono text-[11px]">order.created</code>,{" "}
            <code className="font-mono text-[11px]">order.inventory</code>,{" "}
            <code className="font-mono text-[11px]">order.payment</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Synchronized outbox & Kafka events from backend");
            }}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Sync Events
          </Button>
        </div>
      </div>

      {/* Cluster KPI Grid using KpiCard so badges & numbers never collide or overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Broker Nodes"
          value="1 / 1"
          subtext="localhost:9092"
          badge="KRaft Leader"
          badgeVariant="success"
        />

        <KpiCard
          label="Configured Topics"
          value="3 Topics"
          subtext="order.created / inventory / payment"
          badge="KafkaTopics.java"
          badgeVariant="default"
        />

        <KpiCard
          label="Total Outbox Events"
          value={events.length}
          subtext="Recorded in outbox_events"
          badge="Live Stream"
          badgeVariant="success"
          pulsingDot={true}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />

        <KpiCard
          label="Outbox Poll Interval"
          value="500ms"
          subtext="OutboxPublisher scheduled relay"
          badge="Batch: 50"
          badgeVariant="neutral"
        />
      </div>

      {/* Topics Selector & Details */}
      <Card className="p-4 sm:p-6 space-y-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary shrink-0" />
              Backend Event Topics Architecture
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a topic to filter events emitted by the Spring Boot services
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TOPICS.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTopic(t.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${selectedTopic === t.name
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t.name === "ALL" ? "All Topics" : t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Topic Description */}
        {(() => {
          const current =
            TOPICS.find((t) => t.name === selectedTopic) || TOPICS[0];
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-border/70 bg-muted/20 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-medium">
                  Topic Role
                </span>
                <span className="font-medium text-foreground block mt-1 leading-relaxed">
                  {current.description}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-medium">
                  Spring Kafka Consumer Groups
                </span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {current.consumerGroups.map((cg) => (
                    <span
                      key={cg}
                      className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold"
                    >
                      {cg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Live Stream Micro-Log for Selected Topic */}
      <Card className="p-4 sm:p-6 space-y-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="h-4 w-4 text-emerald-500 animate-pulse shrink-0" />
            <h3 className="text-sm font-semibold text-foreground truncate">
              Outbox &amp; Event Stream Inspector ({selectedTopic})
            </h3>
          </div>
          <Badge variant="subtle" className="text-[11px] font-mono shrink-0">
            Showing {filteredEvents.length} events
          </Badge>
        </div>

        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
              No events recorded for {selectedTopic} yet
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 sm:p-4 rounded-xl border border-border/70 bg-muted/15 font-mono text-xs space-y-2.5 overflow-hidden"
              >
                {/* Row 1: Event Type + Topic Badge + Order Link */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${evt.status === "FAILED"
                        ? "bg-rose-500"
                        : evt.status === "IN_PROGRESS"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        }`}
                    />
                    <span className="font-semibold text-foreground text-xs sm:text-sm">
                      {evt.eventType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold border ${getTopicBadgeClass(
                        evt.topic
                      )}`}
                    >
                      {evt.topic}
                    </span>
                  </div>

                  <Link
                    href={`/orders/${evt.orderId}`}
                    className="text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-2 py-0.5 rounded transition-colors shrink-0"
                  >
                    Order #{evt.orderId.substring(0, 8)}
                  </Link>
                </div>

                {/* Row 2: Partition, Offset, Timestamp & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>Partition {evt.partition}</span>
                    <span>•</span>
                    <span>Offset #{evt.offset}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(evt.timestamp)}</span>
                  </div>

                  <span
                    className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${evt.status === "FAILED"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : evt.status === "IN_PROGRESS"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                  >
                    {evt.status}
                  </span>
                </div>

                {/* Row 3: Single-line JSON Payload with Hidden Scrollbar, Format Toggle & Copy Button */}
                {evt.payloadSummary && (
                  <JsonPayloadViewer payload={evt.payloadSummary} />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
