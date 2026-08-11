"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns false for server rendering and React's first hydration snapshot,
 * then true for browser-owned renders. React controls the transition so a
 * timer cannot expose session or storage state while deeper routes are still
 * being selectively hydrated.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
