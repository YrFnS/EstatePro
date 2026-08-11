"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/page-shell";

function DashboardPlaceholder() {
  return (
    <div
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
    </div>
  );
}

const BrowserDashboardPage = dynamic(
  () =>
    import("@/components/real-estate/dashboard-page").then(
      (module) => module.DashboardPage
    ),
  {
    ssr: false,
    loading: DashboardPlaceholder,
  }
);

export function DashboardClientBoundary() {
  return (
    <PageShell>
      <BrowserDashboardPage />
    </PageShell>
  );
}
