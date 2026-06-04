"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { logActivity } from "@/lib/activity-log";

type CompareState = string[];

let compareList: CompareState = [];
const listeners = new Set<() => void>();

// Cached server snapshot to avoid infinite loop warning
const emptyArray: CompareState = [];

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): CompareState {
  return compareList;
}

function getServerSnapshot(): CompareState {
  return emptyArray;
}

function initCompare() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("estatepro-compare");
      if (saved) {
        compareList = JSON.parse(saved);
      }
    } catch {
      compareList = [];
    }
  }
}

function saveCompare() {
  if (typeof window !== "undefined") {
    localStorage.setItem("estatepro-compare", JSON.stringify(compareList));
  }
}

initCompare();

interface CompareContextType {
  compareList: CompareState;
  isInCompare: (id: string) => boolean;
  toggleCompare: (id: string) => boolean;
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  compareCount: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isInCompare = useCallback((id: string) => compareList.includes(id), [list]);

  const toggleCompare = useCallback((id: string) => {
    if (compareList.includes(id)) {
      compareList = compareList.filter((i) => i !== id);
      logActivity("compare", `Removed property from comparison`);
    } else {
      if (compareList.length >= 3) return false;
      compareList = [...compareList, id];
      logActivity("compare", `Added property to comparison`);
    }
    saveCompare();
    notifyListeners();
    return compareList.includes(id);
  }, []);

  const addToCompare = useCallback((id: string) => {
    if (compareList.length >= 3) return false;
    if (compareList.includes(id)) return true;
    compareList = [...compareList, id];
    saveCompare();
    notifyListeners();
    return true;
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    compareList = compareList.filter((i) => i !== id);
    saveCompare();
    notifyListeners();
  }, []);

  const clearCompare = useCallback(() => {
    compareList = [];
    saveCompare();
    notifyListeners();
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareList: list,
        isInCompare,
        toggleCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        compareCount: list.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
