"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import en from "./messages/en.json";
import ar from "./messages/ar.json";

type Locale = "en" | "ar";

type Messages = typeof en;

const messagesMap: Record<Locale, Messages> = { en, ar };

const MESSAGE_KEY_ALIASES: Record<string, string> = {
  "contact.sendMessage": "contact.send",
};

let currentLocale: Locale = "en";
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
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
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

function getMessage(locale: Locale, requestedKey: string): string {
  const key = MESSAGE_KEY_ALIASES[requestedKey] || requestedKey;
  const localized = getNestedValue(
    messagesMap[locale] as unknown as Record<string, unknown>,
    key
  );

  if (localized !== key) {
    return localized;
  }

  if (locale !== "en") {
    const english = getNestedValue(
      messagesMap.en as unknown as Record<string, unknown>,
      key
    );
    if (english !== key) {
      return english;
    }
  }

  return requestedKey;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const saved = window.localStorage.getItem("locale");
    const restoredLocale: Locale = saved === "ar" ? "ar" : "en";

    if (currentLocale !== restoredLocale) {
      currentLocale = restoredLocale;
      notifyListeners();
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "locale") return;
      const nextLocale: Locale = event.newValue === "ar" ? "ar" : "en";
      if (currentLocale !== nextLocale) {
        currentLocale = nextLocale;
        notifyListeners();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    currentLocale = newLocale;
    window.localStorage.setItem("locale", newLocale);
    notifyListeners();
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getMessage(locale, key);
      if (params) {
        Object.entries(params).forEach(([parameter, replacement]) => {
          value = value.replace(`{${parameter}}`, String(replacement));
        });
      }
      return value;
    },
    [locale]
  );

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      <div
        className="contents"
        lang={locale}
        dir={dir}
        data-locale={locale}
        data-direction={dir}
      >
        {children}
      </div>
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
