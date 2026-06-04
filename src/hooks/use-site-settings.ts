"use client";

import { useEffect, useCallback, useReducer } from "react";

type Locale = "en" | "ar";

interface SettingValue {
  valueEn: string;
  valueAr: string;
  category: string;
  type: string;
}

type SettingsMap = Record<string, SettingValue>;

// Module-level cache so settings are shared across hook instances.
// null = not fetched yet; object = fetched (may be empty if no settings in DB).
let cachedSettings: SettingsMap | null = null;
let fetchPromise: Promise<SettingsMap | null> | null = null;

async function fetchSettingsFromAPI(): Promise<SettingsMap | null> {
  if (cachedSettings !== null) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      cachedSettings = data.settings || {};
      return cachedSettings;
    } catch (error) {
      console.error("Error fetching site settings:", error);
      // Do NOT cache the failure — keep cachedSettings as null so the next
      // mount / render will retry the fetch.
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// Use a reducer to batch settings + loading state updates
interface State {
  settings: SettingsMap;
  loading: boolean;
}

type Action =
  | { type: "LOADING" }
  | { type: "LOADED"; settings: SettingsMap };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true };
    case "LOADED":
      return { settings: action.settings, loading: false };
    default:
      return state;
  }
}

export function useSiteSettings() {
  const [state, dispatch] = useReducer(reducer, {
    settings: cachedSettings || {},
    loading: cachedSettings === null,
  });

  useEffect(() => {
    if (cachedSettings !== null) {
      dispatch({ type: "LOADED", settings: cachedSettings });
      return;
    }

    let cancelled = false;
    dispatch({ type: "LOADING" });

    fetchSettingsFromAPI().then((data) => {
      if (!cancelled) {
        if (data) {
          dispatch({ type: "LOADED", settings: data });
        } else {
          // Fetch failed — use empty settings but stop loading so the page renders with fallbacks.
          // The next mount will retry because cachedSettings is still null.
          dispatch({ type: "LOADED", settings: {} });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const getSetting = useCallback(
    (key: string, locale: Locale): string => {
      const setting = state.settings[key];
      if (!setting) return "";
      return locale === "ar" ? setting.valueAr : setting.valueEn;
    },
    [state.settings]
  );

  return { settings: state.settings, getSetting, loading: state.loading };
}
