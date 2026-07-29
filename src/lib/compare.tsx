"use client";

import React, {
  createContext,
  useCallback,
  useContext,
} from "react";
import { MAX_COMPARISON_ITEMS } from "@/lib/account-state";
import { logActivity } from "@/lib/activity-log";
import { usePersistentIdCollection } from "@/lib/use-persistent-id-collection";

type CompareState = string[];

interface CompareContextType {
  compareList: CompareState;
  isInCompare: (id: string) => boolean;
  toggleCompare: (id: string) => boolean;
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  compareCount: number;
  isLoading: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(
  undefined
);

export function CompareProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    ids: compareList,
    replaceIds,
    isLoading,
  } = usePersistentIdCollection({
    endpoint: "/api/account/comparison",
    responseKey: "comparison",
    guestStorageKey: "estatepro-compare",
    accountStoragePrefix: "estatepro-compare",
    maxItems: MAX_COMPARISON_ITEMS,
  });

  const isInCompare = useCallback(
    (id: string) => compareList.includes(id),
    [compareList]
  );

  const toggleCompare = useCallback(
    (id: string) => {
      if (compareList.includes(id)) {
        replaceIds(
          compareList.filter((propertyId) => propertyId !== id)
        );
        logActivity("compare", "Removed property from comparison");
        return false;
      }

      if (compareList.length >= MAX_COMPARISON_ITEMS) return false;

      replaceIds([...compareList, id]);
      logActivity("compare", "Added property to comparison");
      return true;
    },
    [compareList, replaceIds]
  );

  const addToCompare = useCallback(
    (id: string) => {
      if (compareList.includes(id)) return true;
      if (compareList.length >= MAX_COMPARISON_ITEMS) return false;

      replaceIds([...compareList, id]);
      logActivity("compare", "Added property to comparison");
      return true;
    },
    [compareList, replaceIds]
  );

  const removeFromCompare = useCallback(
    (id: string) => {
      if (!compareList.includes(id)) return;
      replaceIds(
        compareList.filter((propertyId) => propertyId !== id)
      );
      logActivity("compare", "Removed property from comparison");
    },
    [compareList, replaceIds]
  );

  const clearCompare = useCallback(() => {
    replaceIds([]);
  }, [replaceIds]);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        isInCompare,
        toggleCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        compareCount: compareList.length,
        isLoading,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error(
      "useCompare must be used within a CompareProvider"
    );
  }
  return context;
}
