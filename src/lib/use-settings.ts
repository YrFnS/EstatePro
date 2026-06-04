"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { SETTINGS_DEFAULTS } from "@/lib/settings";

// ============================================================================
// Client-side Settings Hook
// Provides reactive access to site settings with fallback defaults
// ============================================================================

// In-memory cache shared across hook instances
let settingsCache: Record<string, string> = {};
let settingsLoaded = false;
let loadPromise: Promise<Record<string, string>> | null = null;

// Subscriber management for reactive updates
const subscribers = new Set<() => void>();

function emitChange() {
  subscribers.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot(): Record<string, string> {
  return settingsCache;
}

function getServerSnapshot(): Record<string, string> {
  return SETTINGS_DEFAULTS;
}

/**
 * Load settings from the API and update the cache.
 */
async function loadSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to fetch settings");
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const s of data.settings) {
      map[s.key] = s.value;
    }
    settingsCache = map;
    settingsLoaded = true;
    emitChange();
    return map;
  } catch {
    // Return defaults on error
    settingsCache = { ...SETTINGS_DEFAULTS };
    settingsLoaded = true;
    emitChange();
    return settingsCache;
  }
}

/**
 * Ensure settings are loaded (deduped)
 */
function ensureSettings(): Promise<Record<string, string>> {
  if (settingsLoaded) return Promise.resolve(settingsCache);
  if (!loadPromise) {
    loadPromise = loadSettings().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

/**
 * Get a single setting value with fallback to defaults
 */
export function getSettingValue(key: string): string {
  if (key in settingsCache) return settingsCache[key];
  if (key in SETTINGS_DEFAULTS) return SETTINGS_DEFAULTS[key];
  return "";
}

/**
 * Hook that provides access to all site settings.
 * Returns settings object, loading state, and refresh function.
 */
export function useSettings() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [loading, setLoading] = useState(!settingsLoaded);

  useEffect(() => {
    if (!settingsLoaded) {
      ensureSettings().then(() => setLoading(false));
    } else {
      // Use a microtask to avoid calling setState synchronously in the effect
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadSettings();
    setLoading(false);
  }, []);

  /**
   * Get a single setting value
   */
  const get = useCallback(
    (key: string): string => {
      if (key in snapshot) return snapshot[key];
      if (key in SETTINGS_DEFAULTS) return SETTINGS_DEFAULTS[key];
      return "";
    },
    [snapshot]
  );

  return {
    settings: snapshot,
    loading,
    refresh,
    get,
  };
}
