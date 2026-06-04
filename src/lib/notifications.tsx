"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";

export type NotificationType = "property" | "price" | "search" | "system" | "inquiry";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

type NotificationsState = Notification[];

let notifications: NotificationsState = [];
const listeners = new Set<() => void>();

// Cached server snapshot to avoid infinite loop warning
const emptyNotifications: NotificationsState = [];

const STORAGE_KEY = "estatepro-notifications";
const MAX_NOTIFICATIONS = 50;
const INITIALIZED_KEY = "estatepro-notifications-initialized";

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): NotificationsState {
  return notifications;
}

function getServerSnapshot(): NotificationsState {
  return emptyNotifications;
}

function saveNotifications() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}



function initNotifications() {
  if (typeof window !== "undefined") {
    try {
      // Check if first-time initialization
      const initialized = localStorage.getItem(INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        notifications = JSON.parse(saved) as NotificationsState;
      }

      if (!initialized) {
        localStorage.setItem(INITIALIZED_KEY, "true");
      }
    } catch {
      notifications = [];
    }
  }
}

initNotifications();

interface NotificationsContextType {
  notifications: NotificationsState;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const currentNotifications = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const unreadCount = currentNotifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        timestamp: Date.now(),
        read: false,
      };
      notifications = [newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS);
      saveNotifications();
      notifyListeners();
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications();
    notifyListeners();
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications();
    notifyListeners();
  }, []);

  const deleteNotification = useCallback((id: string) => {
    notifications = notifications.filter((n) => n.id !== id);
    saveNotifications();
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    notifications = [];
    saveNotifications();
    notifyListeners();
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications: currentNotifications,
        unreadCount,
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
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
