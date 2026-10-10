"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAppDispatch, useAppSelector } from "@/store";
import { hydrateAuth } from "@/store/auth-slice";

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !isAuthPage) {
      router.replace("/auth/login");
    }
  }, [isHydrated, isAuthenticated, isAuthPage, router]);

  if (!isHydrated || (!isAuthenticated && !isAuthPage)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-2.5 text-xs font-mono text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Initializing session...</span>
        </div>
      </div>
    );
  }

  // Standalone full-screen layout for Login & Register (no Sidebar or Header navbar)
  if (isAuthPage) {
    return (
      <div className="min-h-dvh flex flex-col justify-center bg-background text-foreground px-4 py-8">
        <main className="w-full max-w-md mx-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex bg-background text-foreground overflow-x-hidden">
      {/* Fixed Desktop Sidebar & Mobile/Tablet Slide-Over Drawer */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by lg:pl-60 on desktop for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
