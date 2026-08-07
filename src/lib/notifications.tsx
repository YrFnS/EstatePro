"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type AccountNotification,
  type AccountNotificationType,
  MAX_NOTIFICATIONS,
  notificationTimestamp,
} from "@/lib/account-state";

export type NotificationType = AccountNotificationType;
export type Notification = AccountNotification;

type NotificationsState = Notification[];

interface NotificationsContextType {
  notifications: NotificationsState;
  unreadCount: number;
  isLoading: boolean;
  addNotification: (
    notification: Omit<
      Notification,
      "id" | "timestamp" | "read"
    >
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = "estatepro-notifications";
const PENDING_PREFIX =
  "estatepro-notifications-pending";
const INITIALIZED_KEY =
  "estatepro-notifications-initialized";

const NotificationsContext =
  createContext<NotificationsContextType | undefined>(
    undefined
  );

function makeId(prefix = "notification"): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeNotification(
  value: unknown
): Notification | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const type =
    record.type === "property_alert"
      ? "search"
      : record.type === "tour"
        ? "inquiry"
        : ["property", "price", "search", "system", "inquiry"].includes(
            String(record.type),
          )
          ? (record.type as NotificationType)
          : "system";
  const title =
    typeof record.title === "string"
      ? record.title.trim()
      : "";
  const message =
    typeof record.message === "string"
      ? record.message.trim()
      : "";

  if (!title || !message) return null;

  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id
        : makeId(),
    type: type as NotificationType,
    title: title.slice(0, 160),
    message: message.slice(0, 2_000),
    timestamp: notificationTimestamp(
      record.timestamp ?? record.createdAt
    ),
    read: Boolean(record.read),
    actionUrl:
      typeof record.actionUrl === "string" &&
      record.actionUrl.trim()
        ? record.actionUrl.trim().slice(0, 500)
        : undefined,
    sourceId:
      typeof record.sourceId === "string" &&
      record.sourceId.trim()
        ? record.sourceId.trim().slice(0, 200)
        : undefined,
  };
}

function parseNotifications(
  value: unknown
): Notification[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeNotification)
    .filter(
      (item): item is Notification => item !== null
    )
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_NOTIFICATIONS);
}

function readStorage(key: string): Notification[] {
  if (typeof window === "undefined") return [];

  try {
    return parseNotifications(
      JSON.parse(
        window.localStorage.getItem(key) || "[]"
      )
    );
  } catch {
    return [];
  }
}

function writeStorage(
  key: string,
  notifications: readonly Notification[]
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    key,
    JSON.stringify(notifications)
  );
}

function mergeNotifications(
  primary: readonly Notification[],
  secondary: readonly Notification[]
): Notification[] {
  const seen = new Set<string>();
  const merged: Notification[] = [];

  for (const item of [...primary, ...secondary].sort(
    (left, right) => right.timestamp - left.timestamp
  )) {
    const key = item.sourceId || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= MAX_NOTIFICATIONS) break;
  }

  return merged;
}

async function fetchNotifications(): Promise<
  Notification[]
> {
  const response = await fetch(
    "/api/account/notifications",
    {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }
  );
  const payload = (await response.json()) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load notifications"
    );
  }
  return parseNotifications(payload.notifications);
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] =
    useState<NotificationsState>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pendingKey = user?.id
    ? `${PENDING_PREFIX}:${user.id}`
    : null;

  const reloadServer = useCallback(async () => {
    if (!user?.id) return;
    try {
      setNotifications(await fetchNotifications());
    } catch (error) {
      console.error(
        "Failed to reload notifications:",
        error
      );
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      const guestNotifications = readStorage(STORAGE_KEY);

      if (!user?.id) {
        if (!cancelled) {
          setNotifications(guestNotifications);
          setIsLoading(false);
        }
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            INITIALIZED_KEY,
            "true"
          );
        }
        return;
      }

      const accountPending = pendingKey
        ? readStorage(pendingKey)
        : [];
      const importable = mergeNotifications(
        guestNotifications,
        accountPending
      );

      try {
        let serverNotifications =
          await fetchNotifications();

        if (importable.length) {
          const response = await fetch(
            "/api/account/notifications",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                notifications: importable.map((item) => ({
                  sourceId:
                    item.sourceId || `legacy:${item.id}`,
                  type: item.type,
                  title: item.title,
                  message: item.message,
                  actionUrl: item.actionUrl,
                  timestamp: item.timestamp,
                  read: item.read,
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
                : "Failed to import notifications"
            );
          }
          serverNotifications = parseNotifications(
            payload.notifications
          );
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(STORAGE_KEY);
            if (pendingKey) {
              window.localStorage.removeItem(pendingKey);
            }
          }
        }

        if (!cancelled) {
          setNotifications(serverNotifications);
        }
      } catch (error) {
        console.error(
          "Failed to synchronize notifications:",
          error
        );
        if (!cancelled) {
          setNotifications(importable);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, pendingKey, user?.id]);

  const addNotification = useCallback(
    (
      notification: Omit<
        Notification,
        "id" | "timestamp" | "read"
      >
    ) => {
      const sourceId =
        notification.sourceId || makeId("client");
      const optimistic: Notification = {
        ...notification,
        id: sourceId,
        sourceId,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((current) =>
        mergeNotifications([optimistic], current)
      );

      if (!user?.id) {
        const next = mergeNotifications(
          [optimistic],
          readStorage(STORAGE_KEY)
        );
        writeStorage(STORAGE_KEY, next);
        return;
      }

      if (pendingKey) {
        const pending = mergeNotifications(
          [optimistic],
          readStorage(pendingKey)
        );
        writeStorage(pendingKey, pending);
      }

      void (async () => {
        try {
          const response = await fetch(
            "/api/account/notifications",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                notification: {
                  sourceId,
                  type: optimistic.type,
                  title: optimistic.title,
                  message: optimistic.message,
                  actionUrl: optimistic.actionUrl,
                  timestamp: optimistic.timestamp,
                  read: false,
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
                : "Failed to add notification"
            );
          }

          setNotifications(
            parseNotifications(payload.notifications)
          );
          if (pendingKey) {
            const remaining = readStorage(
              pendingKey
            ).filter(
              (item) => item.sourceId !== sourceId
            );
            writeStorage(pendingKey, remaining);
          }
        } catch (error) {
          console.error(
            "Failed to persist notification:",
            error
          );
        }
      })();
    },
    [pendingKey, user?.id]
  );

  const markAsRead = useCallback(
    (id: string) => {
      const previous = notifications;
      const next = notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      );
      setNotifications(next);

      if (!user?.id) {
        writeStorage(STORAGE_KEY, next);
        return;
      }

      void fetch(
        `/api/account/notifications/${encodeURIComponent(
          id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ read: true }),
        }
      ).then((response) => {
        if (!response.ok) {
          setNotifications(previous);
          void reloadServer();
        }
      });
    },
    [notifications, reloadServer, user?.id]
  );

  const markAllAsRead = useCallback(() => {
    const previous = notifications;
    const next = notifications.map((item) => ({
      ...item,
      read: true,
    }));
    setNotifications(next);

    if (!user?.id) {
      writeStorage(STORAGE_KEY, next);
      return;
    }

    void fetch("/api/account/notifications", {
      method: "PATCH",
    }).then((response) => {
      if (!response.ok) {
        setNotifications(previous);
        void reloadServer();
      }
    });
  }, [notifications, reloadServer, user?.id]);

  const deleteNotification = useCallback(
    (id: string) => {
      const previous = notifications;
      const next = notifications.filter(
        (item) => item.id !== id
      );
      setNotifications(next);

      if (!user?.id) {
        writeStorage(STORAGE_KEY, next);
        return;
      }

      void fetch(
        `/api/account/notifications/${encodeURIComponent(
          id
        )}`,
        { method: "DELETE" }
      ).then((response) => {
        if (!response.ok) {
          setNotifications(previous);
          void reloadServer();
        }
      });
    },
    [notifications, reloadServer, user?.id]
  );

  const clearAll = useCallback(() => {
    const previous = notifications;
    setNotifications([]);

    if (!user?.id) {
      writeStorage(STORAGE_KEY, []);
      return;
    }

    void fetch("/api/account/notifications", {
      method: "DELETE",
    }).then((response) => {
      if (!response.ok) {
        setNotifications(previous);
        void reloadServer();
      }
    });
  }, [notifications, reloadServer, user?.id]);

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
