"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/lib/use-hydrated";

interface ClientHydrationBoundaryProps {
  children: ReactNode;
  label: string;
}

export function ClientHydrationBoundary({
  children,
  label,
}: ClientHydrationBoundaryProps) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <main
        className="min-h-[60vh] bg-background"
        aria-busy="true"
        aria-label={label}
        role="status"
      >
        <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 md:py-12">
          <div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return children;
}
