"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type ThemeMode = "light" | "dark" | "auto";
type ResolvedTheme = "light" | "dark";

type ThemeContextType = {
  theme: ResolvedTheme; // Resolved theme actually active ("light" or "dark")
  themeMode: ThemeMode; // The configured preference ("light", "dark", or "auto")
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = "theme-mode";
const LEGACY_THEME_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/* --------------------------- theme-mode store ---------------------------- */

const modeListeners = new Set<() => void>();

function readMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(THEME_MODE_KEY);
  if (saved === "light" || saved === "dark" || saved === "auto") return saved;
  const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
  return legacy === "dark" || legacy === "light" ? legacy : "light";
}

function subscribeMode(listener: () => void) {
  modeListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_MODE_KEY || event.key === LEGACY_THEME_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    modeListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_MODE_KEY, mode);
  modeListeners.forEach((listener) => listener());
}

/* ---------------------- prefers-color-scheme store ----------------------- */

function subscribeDark(listener: () => void) {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

function getDarkSnapshot() {
  return window.matchMedia(DARK_QUERY).matches;
}

function getDarkServerSnapshot() {
  return false;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const themeMode = useSyncExternalStore(
    subscribeMode,
    readMode,
    () => "light" as ThemeMode,
  );
  const prefersDark = useSyncExternalStore(
    subscribeDark,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );

  const theme: ResolvedTheme =
    themeMode === "auto" ? (prefersDark ? "dark" : "light") : themeMode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-color-scheme", theme);
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => writeMode(mode), []);

  const toggleTheme = useCallback(() => {
    writeMode(theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, themeMode, setThemeMode, toggleTheme }),
    [theme, themeMode, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
