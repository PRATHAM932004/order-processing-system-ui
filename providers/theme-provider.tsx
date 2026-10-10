"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "orderflow_theme";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => { },
  cycleTheme: () => { },
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDocumentTheme(mode: ThemeMode, resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", mode === "system" ? "light dark" : mode);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Initialize from localStorage (defaulting to "system")
  useEffect(() => {
    let initialMode: ThemeMode = "system";
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initialMode = stored;
      }
    } catch {
      // Ignore storage access errors
    }

    const resolved = initialMode === "system" ? getSystemTheme() : initialMode;
    setThemeState(initialMode);
    setResolvedTheme(resolved);
    applyDocumentTheme(initialMode, resolved);
  }, []);

  // Listen to OS prefers-color-scheme changes and cross-tab storage events
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      setThemeState((currentMode) => {
        if (currentMode === "system") {
          const nextResolved = mediaQuery.matches ? "dark" : "light";
          setResolvedTheme(nextResolved);
          applyDocumentTheme("system", nextResolved);
        }
        return currentMode;
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const nextMode: ThemeMode =
          e.newValue === "light" || e.newValue === "dark" ? e.newValue : "system";
        const nextResolved = nextMode === "system" ? getSystemTheme() : nextMode;
        setThemeState(nextMode);
        setResolvedTheme(nextResolved);
        applyDocumentTheme(nextMode, nextResolved);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    const resolved = mode === "system" ? getSystemTheme() : mode;
    setThemeState(mode);
    setResolvedTheme(resolved);
    applyDocumentTheme(mode, resolved);

    try {
      if (mode === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
