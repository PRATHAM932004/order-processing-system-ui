"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Zap,
  ChevronRight,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/auth-slice";
import { orderApi } from "@/store/api/order-api";
import { toast } from "sonner";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    dispatch(orderApi.util.resetApiState());
    toast.info("Signed out of OrderFlow");
    router.push("/auth/login");
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      return [{ label: "Dashboard", href: "/" }];
    }

    const breadcrumbs = [{ label: "Pages", href: "/" }];
    let currentPath = "";

    parts.forEach((part) => {
      currentPath += `/${part}`;
      let label = part;
      if (part === "orders") label = "Orders";
      else if (part === "new") label = "Place Order";
      else if (part === "kafka-stream") label = "Kafka Stream";
      else if (part === "auth") label = "Auth";
      else if (part === "login") label = "Login";
      else if (part === "register") label = "Register";
      else if (part.length > 10) label = `#${part.substring(0, 8)}...`;

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30">
      {/* Left: Mobile/Tablet Menu Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-9 w-9 shrink-0 rounded-lg"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4 text-foreground" />
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 sm:gap-1.5 text-xs text-muted-foreground min-w-0 overflow-hidden"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              {idx > 0 && (
                <ChevronRight
                  className={`h-3 w-3 text-border shrink-0 ${idx < breadcrumbs.length - 2 ? "hidden sm:inline" : ""
                    }`}
                />
              )}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`hover:text-foreground transition-colors truncate ${idx < breadcrumbs.length - 2 ? "hidden sm:inline" : ""
                    }`}
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search orders, topics... (⌘K)"
            className="pl-8 pr-12 h-9 text-xs w-52 xl:w-72 bg-background"
          />
          <kbd className="absolute right-2 top-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Live Kafka Latency Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-mono text-muted-foreground">
          <Zap className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span className="hidden xl:inline">Outbox:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            500ms
          </span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0"
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex h-9 w-9 rounded-lg relative shrink-0"
          title="Kafka consumer event notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User Profile Pill */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
              {currentUser.name[0]}
            </div>
            <div className="hidden sm:flex flex-col text-left max-w-[140px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground leading-none truncate">
                  {currentUser.name}
                </span>
                <Badge
                  variant={
                    currentUser.role === "ADMIN" ? "confirmed" : "subtle"
                  }
                  className="text-[9px] px-1.5 py-0 shrink-0"
                >
                  {currentUser.role}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {currentUser.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
          >
            <Link href="/auth/login">
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
