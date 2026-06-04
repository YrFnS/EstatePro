"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { logActivity } from "@/lib/activity-log";

type RecentlyViewedState = string[];

let recentlyViewed: RecentlyViewedState = [];
const listeners = new Set<() => void>();

// Cached server snapshot to avoid infinite loop warning
const emptyArr: string[] = [];

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): RecentlyViewedState {
  return recentlyViewed;
}

function getServerSnapshot(): RecentlyViewedState {
  return emptyArr;
}

function initRecentlyViewed() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("estatepro-recently-viewed");
      if (saved) {
        recentlyViewed = JSON.parse(saved);
      }
    } catch {
      recentlyViewed = [];
    }
  }
}

function saveRecentlyViewed() {
  if (typeof window !== "undefined") {
    localStorage.setItem("estatepro-recently-viewed", JSON.stringify(recentlyViewed));
  }
}

initRecentlyViewed();

interface RecentlyViewedContextType {
  recentlyViewedList: string[];
  recentlyViewedCount: number;
  addViewed: (id: string) => void;
  isRecentlyViewed: (id: string) => boolean;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addViewed = useCallback((id: string) => {
    // Remove if already exists, then add to front
    recentlyViewed = recentlyViewed.filter((i) => i !== id);
    recentlyViewed = [id, ...recentlyViewed].slice(0, 10);
    logActivity("view", `Viewed property`);
    saveRecentlyViewed();
    notifyListeners();
  }, []);

  const isRecentlyViewed = useCallback((id: string) => recentlyViewed.includes(id), [list]);

  const clearRecentlyViewed = useCallback(() => {
    recentlyViewed = [];
    saveRecentlyViewed();
    notifyListeners();
  }, []);

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewedList: list,
        recentlyViewedCount: list.length,
        addViewed,
        isRecentlyViewed,
        clearRecentlyViewed,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return context;
}
