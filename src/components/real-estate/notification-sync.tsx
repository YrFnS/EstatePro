"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useNotifications,
  type NotificationType,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 45_000;
const ALLOWED_TYPES = new Set<NotificationType>([
  "property",
  "price",
  "search",
  "system",
  "inquiry",
]);

interface ServerNotification {
  id: string;
  sourceId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
}

function parseServerNotifications(
  value: unknown
): ServerNotification[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const id =
      typeof record.id === "string" ? record.id.trim() : "";
    const type = record.type as NotificationType;
    const title =
      typeof record.title === "string"
        ? record.title.trim()
        : "";
    const message =
      typeof record.message === "string"
        ? record.message.trim()
        : "";

    if (
      !id ||
      !ALLOWED_TYPES.has(type) ||
      !title ||
      !message
    ) {
      return [];
    }

    return [
      {
        id,
        sourceId:
          typeof record.sourceId === "string" &&
          record.sourceId.trim()
            ? record.sourceId.trim()
            : undefined,
        type,
        title,
        message,
        actionUrl:
          typeof record.actionUrl === "string" &&
          record.actionUrl.trim()
            ? record.actionUrl.trim()
            : undefined,
        read: Boolean(record.read),
      },
    ];
  });
}

export function NotificationSync() {
  const { user } = useAuth();
  const { notifications, addNotification } = useNotifications();
  const knownRef = useRef<Set<string>>(new Set());
  const runningRef = useRef(false);

  useEffect(() => {
    knownRef.current = new Set(
      notifications.map((item) => item.sourceId || item.id)
    );
  }, [notifications]);

  const synchronize = useCallback(async () => {
    if (!user?.id || runningRef.current) return;
    runningRef.current = true;

    try {
      const response = await fetch(
        "/api/account/notifications",
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) return;

      const payload = (await response.json()) as Record<
        string,
        unknown
      >;
      const serverNotifications = parseServerNotifications(
        payload.notifications
      );

      for (const item of serverNotifications.reverse()) {
        const key = item.sourceId || item.id;
        if (item.read || knownRef.current.has(key)) continue;
        knownRef.current.add(key);

        addNotification({
          sourceId: item.sourceId || item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          actionUrl: item.actionUrl,
        });

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          new window.Notification(item.title, {
            body: item.message,
            tag: key,
          });
        }
      }
    } catch (error) {
      console.error("Failed to synchronize notifications:", error);
    } finally {
      runningRef.current = false;
    }
  }, [addNotification, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = window.setInterval(
      () => void synchronize(),
      POLL_INTERVAL_MS
    );
    const onFocus = () => void synchronize();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void synchronize();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, [synchronize, user?.id]);

  return null;
}
