"use client";

import {
  createElement,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return hydrated;
}

function getServerSnapshot(): boolean {
  return false;
}

function markHydrated(): void {
  if (hydrated) return;
  hydrated = true;
  listeners.forEach((listener) => listener());
}

/**
 * Releases browser-owned state only after the initial React tree has committed.
 * The readiness marker is rendered by React itself so the document root stays
 * immutable while deeper route segments finish selective hydration.
 */
export function HydrationCoordinator() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let releaseFrame = 0;
    let settledFrame = 0;
    const timeout = window.setTimeout(() => {
      releaseFrame = window.requestAnimationFrame(() => {
        markHydrated();
        settledFrame = window.requestAnimationFrame(() => setReady(true));
      });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      if (releaseFrame) window.cancelAnimationFrame(releaseFrame);
      if (settledFrame) window.cancelAnimationFrame(settledFrame);
    };
  }, []);

  return createElement("span", {
    id: "estatepro-hydration-marker",
    "data-state": ready ? "ready" : "pending",
    hidden: true,
    "aria-hidden": true,
  });
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
