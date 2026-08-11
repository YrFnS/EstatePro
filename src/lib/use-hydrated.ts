"use client";

import { useEffect, useState } from "react";

/**
 * Returns false during server rendering and the browser's first hydration
 * pass, then switches to true on the next animation frame.
 *
 * Keeping the first browser render identical to the server fallback prevents
 * browser-owned state such as localStorage, media queries, and session
 * snapshots from changing markup while React is hydrating it.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return hydrated;
}
