"use client";

import { DashboardPage } from "@/components/real-estate/dashboard-page";
import { PageShell } from "@/components/page-shell";
import { useHydrated } from "@/lib/use-hydrated";

function DashboardPlaceholder() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}

export function DashboardClientBoundary() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <DashboardPlaceholder />;
  }

  return (
    <PageShell>
      <DashboardPage />
    </PageShell>
  );
}
