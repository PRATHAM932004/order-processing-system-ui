import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/providers/redux-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "OrderFlow | Event-Driven Order Processing System",
  description:
    "Production-grade frontend for asynchronous Kafka event orders, processing queues, and lifecycle state management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ReduxProvider>
          <QueryProvider>
            <AppShell>{children}</AppShell>
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
            />
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
