"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Activity,
  Cpu,
} from "lucide-react";
import { useGetSystemStatusQuery } from "@/store/api/order-api";

export function SystemHealthBanner() {
  const { data: status, isError, isLoading } = useGetSystemStatusQuery(
    undefined,
    {
      pollingInterval: 4000,
    }
  );

  const isBackendConnected = !isError && status?.backendStatus === "CONNECTED";
  const isDbHealthy = isBackendConnected && status?.dbStatus === "HEALTHY";
  const isKafkaOperational =
    isBackendConnected && status?.kafkaStatus === "OPERATIONAL";

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3.5 px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
        {/* Spring Boot Backend */}
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              isLoading
                ? "bg-amber-500 animate-pulse"
                : isBackendConnected
                ? "bg-emerald-500 animate-pulse"
                : "bg-rose-500"
            }`}
          />
          <Server className="h-3.5 w-3.5 text-primary" />
          <span>Spring Boot Backend:</span>
          <span
            className={`font-semibold font-mono ${
              isBackendConnected
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isLoading
              ? "Probing..."
              : isBackendConnected
              ? `Connected (:${status.backendPort})`
              : "Disconnected"}
          </span>
        </div>

        <span className="text-border hidden sm:inline">•</span>

        {/* PostgreSQL */}
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-blue-500" />
          <span>PostgreSQL:</span>
          <span
            className={`font-semibold font-mono ${
              isDbHealthy
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isLoading
              ? "Checking..."
              : isDbHealthy
              ? `Healthy (${status.dbEndpoint} • ${status.dbPingMs}ms)`
              : "Unreachable"}
          </span>
        </div>

        <span className="text-border hidden md:inline">•</span>

        {/* Kafka Cluster */}
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-indigo-500" />
          <span>Kafka Cluster:</span>
          <span
            className={`font-semibold font-mono ${
              isKafkaOperational
                ? "text-emerald-600 dark:text-emerald-400"
                : isBackendConnected && status?.kafkaStatus === "DEGRADED"
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isLoading
              ? "Checking..."
              : isBackendConnected
              ? `${status.kafkaBootstrapServers} (${
                  status.activeBrokers > 0
                    ? `Broker ${status.activeBrokers} ${status.kafkaStatus === "OPERATIONAL" ? "Operational" : "Degraded"}`
                    : "Broker Offline"
                })`
              : "Offline"}
          </span>
        </div>

        <span className="text-border hidden lg:inline">•</span>

        {/* Consumer Groups */}
        <div className="flex items-center gap-1.5 font-mono">
          <Cpu className="h-3.5 w-3.5 text-amber-500" />
          <span>Consumer Groups:</span>
          <span className="font-semibold text-foreground">
            {isBackendConnected
              ? `${status.activeConsumerGroups} / ${status.totalConsumerGroups} Active`
              : "0 / 0 Active"}
          </span>
        </div>
      </div>

      {/* End-to-End Latency */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground ml-auto">
        {isBackendConnected ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
        )}
        <span>End-to-End Latency:</span>
        <span
          className={`font-semibold ${
            isBackendConnected
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {isBackendConnected ? `${status.endToEndLatencyMs}ms` : "N/A"}
        </span>
      </div>
    </div>
  );
}
