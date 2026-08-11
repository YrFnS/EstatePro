"use client";

import { PageShell } from "@/components/page-shell";
import { PropertyAlertsPage } from "@/components/real-estate/property-alerts-page";
import { useHydrated } from "@/lib/use-hydrated";

function PropertyAlertsPlaceholder() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-label="Loading property alerts"
    >
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  );
}

export function PropertyAlertsClientBoundary() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <PropertyAlertsPlaceholder />;
  }

  return (
    <PageShell>
      <PropertyAlertsPage />
    </PageShell>
  );
}
