"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  GitBranch,
  Lock,
  Layers,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Place Order",
    href: "/orders/new",
    icon: PlusCircle,
    badge: "Live API",
  },
  {
    title: "Kafka Event Stream",
    href: "/kafka-stream",
    icon: GitBranch,
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onMobileClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full w-full bg-card text-foreground">
      {/* Top Brand Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-border/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-foreground block leading-tight">
              OrderFlow
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Event-Driven Core
            </span>
          </div>
        </Link>

        {/* Close button visible only on mobile/tablet drawer */}
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable Middle Navigation Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {user?.role === "ADMIN" ? "Admin Console" : "Customer Portal"}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors select-none",
                isActive
                  ? "bg-primary-subtle text-primary font-semibold dark:bg-primary/20 dark:text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>

              {item.badge && (
                <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-mono font-semibold shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Pinned Bottom Cluster Footer Status */}
      <div className="shrink-0 p-4 border-t border-border/60 space-y-3 bg-card">
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 border border-border/40 text-[11px]">
          <div className="flex items-center justify-between font-mono">
            <span className="text-muted-foreground">Backend</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              :8080
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-muted-foreground">
            <span>Kafka</span>
            <span>localhost:9092</span>
          </div>
          <div className="flex items-center justify-between font-mono text-muted-foreground">
            <span>Role</span>
            <span className="font-semibold text-foreground">
              {user?.role || "GUEST"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="font-mono">OrderFlow v2.0</span>
          <span className="flex items-center gap-1">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            Live DB
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (Always pinned to viewport height h-dvh) */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-60 border-r border-border bg-card h-dvh">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 w-64 max-w-[80vw] h-dvh border-r border-border bg-card shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
