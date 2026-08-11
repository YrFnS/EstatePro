"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme?: string;
  resolvedTheme?: string;
  systemTheme?: "light" | "dark";
  forcedTheme?: string;
  themes: string[];
  setTheme: (theme: string) => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: string | string[];
  defaultTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: string;
  storageKey?: string;
  themes?: string[];
  value?: Record<string, string>;
  nonce?: string;
  scriptProps?: Record<string, unknown>;
};

const DEFAULT_THEMES = ["light", "dark"];
const DEFAULT_CONTEXT: ThemeContextValue = {
  theme: "system",
  resolvedTheme: "light",
  systemTheme: "light",
  themes: DEFAULT_THEMES,
  setTheme: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_CONTEXT);

function normalizeTheme(
  candidate: string | null | undefined,
  fallback: Theme,
  enableSystem: boolean,
  themes: string[]
): Theme {
  if (candidate === "system" && enableSystem) return "system";
  if (candidate === "dark" && themes.includes("dark")) return "dark";
  if (candidate === "light" && themes.includes("light")) return "light";
  return fallback;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  enableColorScheme = true,
  forcedTheme,
  storageKey = "theme",
  themes = DEFAULT_THEMES,
}: ThemeProviderProps) {
  const fallbackTheme = normalizeTheme(
    defaultTheme,
    enableSystem ? "system" : "light",
    enableSystem,
    themes
  );
  const [theme, setThemeState] = useState<Theme>(fallbackTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(media.matches ? "dark" : "light");
    };
    const savedTheme = normalizeTheme(
      window.localStorage.getItem(storageKey),
      fallbackTheme,
      enableSystem,
      themes
    );
    const initialSyncFrame = window.requestAnimationFrame(() => {
      syncSystemTheme();
      setThemeState(savedTheme);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setThemeState(
        normalizeTheme(event.newValue, fallbackTheme, enableSystem, themes)
      );
    };

    media.addEventListener("change", syncSystemTheme);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.cancelAnimationFrame(initialSyncFrame);
      media.removeEventListener("change", syncSystemTheme);
      window.removeEventListener("storage", handleStorage);
    };
  }, [enableSystem, fallbackTheme, storageKey, themes]);

  const setTheme = useCallback(
    (nextTheme: string) => {
      const normalized = normalizeTheme(
        nextTheme,
        fallbackTheme,
        enableSystem,
        themes
      );
      setThemeState(normalized);
      window.localStorage.setItem(storageKey, normalized);
    },
    [enableSystem, fallbackTheme, storageKey, themes]
  );

  const activeTheme = normalizeTheme(
    forcedTheme,
    theme,
    enableSystem,
    themes
  );
  const resolvedTheme: ResolvedTheme =
    activeTheme === "system" ? systemTheme : activeTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: activeTheme,
      resolvedTheme,
      systemTheme,
      forcedTheme,
      themes,
      setTheme,
    }),
    [activeTheme, forcedTheme, resolvedTheme, setTheme, systemTheme, themes]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        id="estatepro-theme-root"
        data-theme={resolvedTheme}
        className={
          resolvedTheme === "dark"
            ? "dark min-h-screen bg-background text-foreground"
            : "min-h-screen bg-background text-foreground"
        }
        style={enableColorScheme ? { colorScheme: resolvedTheme } : undefined}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
