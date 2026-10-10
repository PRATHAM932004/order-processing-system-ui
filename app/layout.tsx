import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/providers/redux-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "OrderFlow | Event-Driven Order Processing System",
  description:
    "Production-grade frontend for asynchronous Kafka event orders, processing queues, and lifecycle state management.",
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('orderflow_theme');
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = (stored === 'light' || stored === 'dark') ? stored : 'light dark';
    }
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
