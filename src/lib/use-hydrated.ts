"use client";

import { useEffect, useSyncExternalStore } from "react";

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
  document.documentElement.dataset.estateproHydrated = "true";
  listeners.forEach((listener) => listener());
}

/**
 * Releases browser-owned state only after the initial React tree has committed.
 * The task + animation-frame boundary prevents a top-level session or storage
 * update from interrupting selective hydration in a deeper route segment.
 */
export function HydrationCoordinator() {
  useEffect(() => {
    let frame = 0;
    const timeout = window.setTimeout(() => {
      frame = window.requestAnimationFrame(markHydrated);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
