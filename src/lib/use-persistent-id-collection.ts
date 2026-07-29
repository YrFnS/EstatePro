"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  mergeUniqueIds,
  sameIds,
  uniqueIds,
} from "@/lib/account-state";

interface PersistentIdCollectionOptions {
  endpoint: string;
  responseKey: string;
  guestStorageKey: string;
  accountStoragePrefix: string;
  maxItems: number;
}

interface AccountCache {
  ids: string[];
  pending: boolean;
  updatedAt: number;
}

function parseIds(value: string | null, maxItems: number): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return uniqueIds(parsed, maxItems);

    if (parsed && typeof parsed === "object" && "ids" in parsed) {
      return uniqueIds((parsed as { ids?: unknown }).ids, maxItems);
    }
  } catch {
    return [];
  }

  return [];
}

function readGuestIds(storageKey: string, maxItems: number): string[] {
  if (typeof window === "undefined") return [];
  return parseIds(window.localStorage.getItem(storageKey), maxItems);
}

function writeGuestIds(storageKey: string, ids: readonly string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(ids));
}

function readAccountCache(
  storageKey: string,
  maxItems: number
): AccountCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return {
        ids: uniqueIds(parsed, maxItems),
        pending: false,
        updatedAt: 0,
      };
    }

    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<AccountCache>;

    return {
      ids: uniqueIds(record.ids, maxItems),
      pending: Boolean(record.pending),
      updatedAt:
        typeof record.updatedAt === "number" ? record.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

function writeAccountCache(
  storageKey: string,
  ids: readonly string[],
  pending: boolean
): void {
  if (typeof window === "undefined") return;

  const payload: AccountCache = {
    ids: [...ids],
    pending,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(payload));
}

async function fetchCollection(
  endpoint: string,
  responseKey: string,
  maxItems: number
): Promise<string[]> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load account data"
    );
  }

  return uniqueIds(payload[responseKey], maxItems);
}

async function replaceCollection(
  endpoint: string,
  responseKey: string,
  ids: readonly string[],
  maxItems: number
): Promise<string[]> {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to save account data"
    );
  }

  return uniqueIds(payload[responseKey], maxItems);
}

export function usePersistentIdCollection({
  endpoint,
  responseKey,
  guestStorageKey,
  accountStoragePrefix,
  maxItems,
}: PersistentIdCollectionOptions) {
  const { user, isLoading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const activeUserIdRef = useRef<string | null>(user?.id || null);

  useEffect(() => {
    activeUserIdRef.current = user?.id || null;
  }, [user?.id]);

  const queueAccountSync = useCallback(
    (ownerId: string, accountStorageKey: string, desiredIds: string[]) => {
      queueRef.current = queueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (activeUserIdRef.current !== ownerId) return;

          try {
            const serverIds = await replaceCollection(
              endpoint,
              responseKey,
              desiredIds,
              maxItems
            );

            if (activeUserIdRef.current !== ownerId) return;

            const currentCache = readAccountCache(
              accountStorageKey,
              maxItems
            );
            if (
              currentCache &&
              sameIds(currentCache.ids, desiredIds)
            ) {
              writeAccountCache(
                accountStorageKey,
                serverIds,
                false
              );
            }
          } catch (error) {
            console.error(`Failed to synchronize ${responseKey}:`, error);
          }
        });
    },
    [endpoint, maxItems, responseKey]
  );

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const ownerId = user?.id || null;
    const accountStorageKey = ownerId
      ? `${accountStoragePrefix}:${ownerId}`
      : "";

    setIsLoading(true);
    queueRef.current = Promise.resolve();

    const load = async () => {
      const guestIds = readGuestIds(guestStorageKey, maxItems);

      if (!ownerId) {
        if (!cancelled) {
          setIds(guestIds);
          setIsLoading(false);
        }
        return;
      }

      const cached = readAccountCache(accountStorageKey, maxItems);

      try {
        const serverIds = await fetchCollection(
          endpoint,
          responseKey,
          maxItems
        );

        const desiredIds = cached?.pending
          ? mergeUniqueIds(cached.ids, guestIds, maxItems)
          : mergeUniqueIds(serverIds, guestIds, maxItems);

        if (!cancelled) setIds(desiredIds);

        if (!sameIds(serverIds, desiredIds)) {
          writeAccountCache(accountStorageKey, desiredIds, true);
          const synchronizedIds = await replaceCollection(
            endpoint,
            responseKey,
            desiredIds,
            maxItems
          );

          if (!cancelled && activeUserIdRef.current === ownerId) {
            setIds(synchronizedIds);
            writeAccountCache(
              accountStorageKey,
              synchronizedIds,
              false
            );
            window.localStorage.removeItem(guestStorageKey);
          }
        } else {
          writeAccountCache(accountStorageKey, serverIds, false);
          if (guestIds.length) {
            window.localStorage.removeItem(guestStorageKey);
          }
        }
      } catch (error) {
        console.error(`Failed to hydrate ${responseKey}:`, error);
        const fallbackIds = mergeUniqueIds(
          cached?.ids || [],
          guestIds,
          maxItems
        );
        if (!cancelled) setIds(fallbackIds);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    accountStoragePrefix,
    authLoading,
    endpoint,
    guestStorageKey,
    maxItems,
    responseKey,
    user?.id,
  ]);

  const replaceIds = useCallback(
    (nextIds: readonly string[]): string[] => {
      const normalized = uniqueIds(nextIds, maxItems);
      setIds(normalized);

      if (typeof window === "undefined") return normalized;

      const ownerId = user?.id;
      if (!ownerId) {
        writeGuestIds(guestStorageKey, normalized);
        return normalized;
      }

      const accountStorageKey = `${accountStoragePrefix}:${ownerId}`;
      writeAccountCache(accountStorageKey, normalized, true);
      queueAccountSync(ownerId, accountStorageKey, normalized);
      return normalized;
    },
    [
      accountStoragePrefix,
      guestStorageKey,
      maxItems,
      queueAccountSync,
      user?.id,
    ]
  );

  return {
    ids,
    replaceIds,
    isLoading,
  };
}
