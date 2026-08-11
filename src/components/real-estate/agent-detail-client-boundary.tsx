"use client";

import { AgentDetailPage } from "@/components/real-estate/agent-detail-page";
import { PageShell } from "@/components/page-shell";
import { useHydrated } from "@/lib/use-hydrated";

function AgentDetailPlaceholder() {
  return (
    <main
      className="min-h-screen bg-background py-8 md:py-12"
      aria-busy="true"
      aria-label="Loading agent profile"
    >
      <div className="container mx-auto space-y-6 px-4">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}

export function AgentDetailClientBoundary() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <AgentDetailPlaceholder />;
  }

  return (
    <PageShell>
      <AgentDetailPage />
    </PageShell>
  );
}
