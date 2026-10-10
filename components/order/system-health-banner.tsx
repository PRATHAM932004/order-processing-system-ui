import React from "react";
import { CheckCircle2, Server, Database, Activity, Cpu } from "lucide-react";

export function SystemHealthBanner() {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3.5 px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <Server className="h-3.5 w-3.5 text-primary" />
          <span>Spring Boot Backend:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            Connected (:8080)
          </span>
        </div>

        <span className="text-border hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-blue-500" />
          <span>PostgreSQL:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            Healthy (:5432)
          </span>
        </div>

        <span className="text-border hidden md:inline">•</span>

        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-indigo-500" />
          <span>Kafka Cluster:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            localhost:9092 (Broker 1 Operational)
          </span>
        </div>

        <span className="text-border hidden lg:inline">•</span>

        <div className="flex items-center gap-1.5 font-mono">
          <Cpu className="h-3.5 w-3.5 text-amber-500" />
          <span>Consumer Groups:</span>
          <span className="font-semibold text-foreground">3 / 3 Active</span>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground ml-auto">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span>End-to-End Latency:</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          14ms
        </span>
      </div>
    </div>
  );
}
