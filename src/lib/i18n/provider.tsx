"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import en from "./messages/en.json";
import ar from "./messages/ar.json";

type Locale = "en" | "ar";

type Messages = typeof en;

const messagesMap: Record<Locale, Messages> = { en, ar };

let currentLocale: Locale = "en";
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

function initLocale() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && (saved === "en" || saved === "ar")) {
      currentLocale = saved;
    }
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";
  }
}

// Initialize on module load
initLocale();

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    currentLocale = newLocale;
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    }
    notifyListeners();
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(messagesMap[locale] as unknown as Record<string, unknown>, key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale]
  );

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
