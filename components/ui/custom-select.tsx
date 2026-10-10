"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  icon?: React.ReactNode;
  className?: string;
  menuAlign?: "left" | "right";
  ariaLabel?: string;
}

export function CustomSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  icon,
  className,
  menuAlign = "left",
  ariaLabel = "Select option",
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "h-9 inline-flex items-center justify-between gap-3 rounded-lg border border-border bg-background pl-3.5 pr-3.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full",
          open && "border-primary ring-2 ring-primary/20"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180 text-primary"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 min-w-full w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150",
            menuAlign === "right" ? "right-0" : "left-0"
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                  isSelected
                    ? "bg-primary-subtle text-primary font-semibold dark:bg-primary/20 dark:text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
