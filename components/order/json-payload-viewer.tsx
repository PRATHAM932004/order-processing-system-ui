"use client";

import React, { useState, useRef } from "react";
import { Copy, Check, Braces, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JsonPayloadViewerProps {
  payload: string;
  className?: string;
}

export function JsonPayloadViewer({
  payload,
  className,
}: JsonPayloadViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("Copied event JSON payload to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Format JSON nicely when expanded
  const formattedJson = React.useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  }, [payload]);

  // Allow horizontal scrolling using mouse wheel when hovering the single-line bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (expanded || !scrollRef.current) return;
    const el = scrollRef.current;
    if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/95 font-mono text-[11px] transition-all overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pl-3 pr-1.5 h-9">
        {/* Single-line horizontally scrollable text without visible scrollbar track */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex-1 min-w-0 overflow-x-auto no-scrollbar whitespace-nowrap text-muted-foreground select-all py-1 pr-3"
          title="Scroll horizontally or click { } to format JSON"
        >
          {payload}
        </div>

        {/* Pinned Right Action Controls */}
        <div className="shrink-0 flex items-center gap-1 pl-2 border-l border-border/60 bg-background/95">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-sans font-medium transition-colors",
              expanded
                ? "bg-primary-subtle text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={expanded ? "Collapse JSON" : "Format & Expand JSON"}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <Braces className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {expanded ? "Collapse" : "Format"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-sans font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copy JSON payload"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Expanded Pretty-Printed JSON Drawer */}
      {expanded && (
        <pre className="border-t border-border/50 bg-muted/30 px-3 py-2.5 text-[11px] leading-relaxed text-foreground overflow-x-auto no-scrollbar">
          {formattedJson}
        </pre>
      )}
    </div>
  );
}
