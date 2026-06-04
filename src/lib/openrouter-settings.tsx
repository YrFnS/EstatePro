"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { DEFAULT_MODEL, AVAILABLE_MODELS, type OpenRouterConfig } from "./openrouter";

type OpenRouterSettings = OpenRouterConfig & {
  isConfigured: boolean;
};

const STORAGE_KEY = "estatepro-openrouter-settings";

function loadSettings(): OpenRouterSettings {
  if (typeof window === "undefined") {
    return { apiKey: "", model: DEFAULT_MODEL, isConfigured: false };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || "",
        model: parsed.model || DEFAULT_MODEL,
        isConfigured: !!(parsed.apiKey),
      };
    }
  } catch {
    // ignore parse errors
  }
  return { apiKey: "", model: DEFAULT_MODEL, isConfigured: false };
}

interface OpenRouterSettingsContextType {
  settings: OpenRouterSettings;
  updateSettings: (newSettings: Partial<OpenRouterConfig>) => void;
  clearSettings: () => void;
  availableModels: typeof AVAILABLE_MODELS;
}

const OpenRouterSettingsContext = createContext<OpenRouterSettingsContextType | undefined>(undefined);

export function OpenRouterSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<OpenRouterSettings>(loadSettings);

  const updateSettings = useCallback((newSettings: Partial<OpenRouterConfig>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        isConfigured: !!(newSettings.apiKey ?? prev.apiKey),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          apiKey: updated.apiKey,
          model: updated.model,
        }));
      }
      return updated;
    });
  }, []);

  const clearSettings = useCallback(() => {
    setSettings({ apiKey: "", model: DEFAULT_MODEL, isConfigured: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <OpenRouterSettingsContext.Provider value={{ settings, updateSettings, clearSettings, availableModels: AVAILABLE_MODELS }}>
      {children}
    </OpenRouterSettingsContext.Provider>
  );
}

export function useOpenRouterSettings() {
  const context = useContext(OpenRouterSettingsContext);
  if (!context) {
    throw new Error("useOpenRouterSettings must be used within an OpenRouterSettingsProvider");
  }
  return context;
}
