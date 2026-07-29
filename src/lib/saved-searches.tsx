"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type AccountSavedSearch,
  MAX_SAVED_SEARCHES,
  mergeSavedSearches,
  normalizeSavedSearchFilters,
  savedSearchSignature,
  type SavedSearchFilters,
} from "@/lib/account-state";

interface SavedSearchInput {
  name: string;
  filters: SavedSearchFilters;
  notificationsEnabled?: boolean;
}

interface SavedSearchesContextType {
  savedSearches: AccountSavedSearch[];
  isLoading: boolean;
  isSynced: boolean;
  createSavedSearch: (
    input: SavedSearchInput
  ) => Promise<AccountSavedSearch | null>;
  updateSavedSearch: (
    id: string,
    input: SavedSearchInput
  ) => Promise<AccountSavedSearch | null>;
  removeSavedSearch: (id: string) => Promise<boolean>;
  refreshSavedSearches: () => Promise<void>;
}

const GUEST_STORAGE_KEY = "estatepro-saved-searches:guest";
const LEGACY_STORAGE_KEY = "estatepro-saved-searches";

const SavedSearchesContext =
  createContext<SavedSearchesContextType | undefined>(undefined);

function makeLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLocalSearch(
  value: unknown
): AccountSavedSearch | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string" ? record.name.trim() : "";
  const filters = normalizeSavedSearchFilters(record.filters);

  if (!name || !Object.keys(filters).length) return null;

  const createdAt =
    typeof record.createdAt === "string"
      ? record.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === "string"
      ? record.updatedAt
      : createdAt;

  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id
        : makeLocalId(),
    name: name.slice(0, 120),
    filters,
    notificationsEnabled: Boolean(
      record.notificationsEnabled
    ),
    createdAt,
    updatedAt,
  };
}

function readStoredSearches(keys: string[]): AccountSavedSearch[] {
  if (typeof window === "undefined") return [];

  const items: AccountSavedSearch[] = [];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) continue;

      for (const value of parsed) {
        const normalized = normalizeLocalSearch(value);
        if (normalized) items.push(normalized);
      }
    } catch {
      // Ignore malformed legacy data.
    }
  }

  return mergeSavedSearches([], items);
}

function writeGuestSearches(
  searches: readonly AccountSavedSearch[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    GUEST_STORAGE_KEY,
    JSON.stringify(searches)
  );
}

function clearStorageKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.localStorage.removeItem(key));
}

function parseServerSearches(
  value: unknown
): AccountSavedSearch[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeLocalSearch)
    .filter(
      (item): item is AccountSavedSearch => item !== null
    )
    .slice(0, MAX_SAVED_SEARCHES);
}

async function requestSavedSearches(): Promise<
  AccountSavedSearch[]
> {
  const response = await fetch("/api/account/saved-searches", {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json()) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load saved searches"
    );
  }

  return parseServerSearches(payload.savedSearches);
}

export function SavedSearchesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const [savedSearches, setSavedSearches] = useState<
    AccountSavedSearch[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const userLegacyStorageKey = useMemo(
    () =>
      user?.id
        ? `${LEGACY_STORAGE_KEY}:${user.id}`
        : null,
    [user?.id]
  );

  const refreshSavedSearches = useCallback(async () => {
    if (!user?.id) {
      setSavedSearches(
        readStoredSearches([
          GUEST_STORAGE_KEY,
          LEGACY_STORAGE_KEY,
        ])
      );
      return;
    }

    setSavedSearches(await requestSavedSearches());
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      if (!user?.id) {
        const local = readStoredSearches([
          GUEST_STORAGE_KEY,
          LEGACY_STORAGE_KEY,
        ]);
        if (!cancelled) {
          setSavedSearches(local);
          setIsLoading(false);
        }
        return;
      }

      const migrationKeys = [
        GUEST_STORAGE_KEY,
        LEGACY_STORAGE_KEY,
        ...(userLegacyStorageKey
          ? [userLegacyStorageKey]
          : []),
      ];
      const localSearches =
        readStoredSearches(migrationKeys);

      try {
        let serverSearches = await requestSavedSearches();

        if (localSearches.length) {
          const serverSignatures = new Set(
            serverSearches.map((item) =>
              savedSearchSignature(item.name, item.filters)
            )
          );
          const missing = localSearches.filter(
            (item) =>
              !serverSignatures.has(
                savedSearchSignature(
                  item.name,
                  item.filters
                )
              )
          );

          if (missing.length) {
            const response = await fetch(
              "/api/account/saved-searches",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  searches: missing.map((item) => ({
                    name: item.name,
                    filters: item.filters,
                    notificationsEnabled:
                      item.notificationsEnabled,
                  })),
                }),
              }
            );
            const payload =
              (await response.json()) as Record<
                string,
                unknown
              >;
            if (!response.ok) {
              throw new Error(
                typeof payload.error === "string"
                  ? payload.error
                  : "Failed to import saved searches"
              );
            }
            serverSearches = parseServerSearches(
              payload.savedSearches
            );
          }

          clearStorageKeys(migrationKeys);
        }

        if (!cancelled) setSavedSearches(serverSearches);
      } catch (error) {
        console.error(
          "Failed to synchronize saved searches:",
          error
        );
        if (!cancelled) {
          setSavedSearches(
            mergeSavedSearches([], localSearches)
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    user?.id,
    userLegacyStorageKey,
  ]);

  const createSavedSearch = useCallback(
    async (
      input: SavedSearchInput
    ): Promise<AccountSavedSearch | null> => {
      const name = input.name.trim().slice(0, 120);
      const filters = normalizeSavedSearchFilters(
        input.filters
      );
      if (!name || !Object.keys(filters).length) return null;

      if (!user?.id) {
        const now = new Date().toISOString();
        const item: AccountSavedSearch = {
          id: makeLocalId(),
          name,
          filters,
          notificationsEnabled: Boolean(
            input.notificationsEnabled
          ),
          createdAt: now,
          updatedAt: now,
        };
        const next = mergeSavedSearches(
          [item],
          savedSearches
        );
        setSavedSearches(next);
        writeGuestSearches(next);
        return item;
      }

      try {
        const response = await fetch(
          "/api/account/saved-searches",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              search: {
                name,
                filters,
                notificationsEnabled: Boolean(
                  input.notificationsEnabled
                ),
              },
            }),
          }
        );
        const payload =
          (await response.json()) as Record<
            string,
            unknown
          >;
        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Failed to save search"
          );
        }

        const next = parseServerSearches(
          payload.savedSearches
        );
        setSavedSearches(next);
        return (
          next.find(
            (item) =>
              savedSearchSignature(
                item.name,
                item.filters
              ) ===
              savedSearchSignature(name, filters)
          ) || null
        );
      } catch (error) {
        console.error("Failed to save search:", error);
        return null;
      }
    },
    [savedSearches, user?.id]
  );

  const updateSavedSearch = useCallback(
    async (
      id: string,
      input: SavedSearchInput
    ): Promise<AccountSavedSearch | null> => {
      const name = input.name.trim().slice(0, 120);
      const filters = normalizeSavedSearchFilters(
        input.filters
      );
      if (!name || !Object.keys(filters).length) return null;

      if (!user?.id) {
        let updated: AccountSavedSearch | null = null;
        const next = savedSearches.map((item) => {
          if (item.id !== id) return item;
          updated = {
            ...item,
            name,
            filters,
            notificationsEnabled: Boolean(
              input.notificationsEnabled
            ),
            updatedAt: new Date().toISOString(),
          };
          return updated;
        });
        setSavedSearches(next);
        writeGuestSearches(next);
        return updated;
      }

      try {
        const response = await fetch(
          `/api/account/saved-searches/${encodeURIComponent(
            id
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              filters,
              notificationsEnabled: Boolean(
                input.notificationsEnabled
              ),
            }),
          }
        );
        const payload =
          (await response.json()) as Record<
            string,
            unknown
          >;
        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Failed to update search"
          );
        }

        const updated = normalizeLocalSearch(
          payload.savedSearch
        );
        if (!updated) return null;

        setSavedSearches((current) =>
          current.map((item) =>
            item.id === id ? updated : item
          )
        );
        return updated;
      } catch (error) {
        console.error("Failed to update search:", error);
        return null;
      }
    },
    [savedSearches, user?.id]
  );

  const removeSavedSearch = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) {
        const next = savedSearches.filter(
          (item) => item.id !== id
        );
        setSavedSearches(next);
        writeGuestSearches(next);
        return true;
      }

      const previous = savedSearches;
      setSavedSearches((current) =>
        current.filter((item) => item.id !== id)
      );

      try {
        const response = await fetch(
          `/api/account/saved-searches/${encodeURIComponent(
            id
          )}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const payload =
            (await response.json()) as Record<
              string,
              unknown
            >;
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Failed to delete search"
          );
        }
        return true;
      } catch (error) {
        console.error("Failed to delete search:", error);
        setSavedSearches(previous);
        return false;
      }
    },
    [savedSearches, user?.id]
  );

  return (
    <SavedSearchesContext.Provider
      value={{
        savedSearches,
        isLoading,
        isSynced: Boolean(user?.id),
        createSavedSearch,
        updateSavedSearch,
        removeSavedSearch,
        refreshSavedSearches,
      }}
    >
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches() {
  const context = useContext(SavedSearchesContext);
  if (!context) {
    throw new Error(
      "useSavedSearches must be used within a SavedSearchesProvider"
    );
  }
  return context;
}
