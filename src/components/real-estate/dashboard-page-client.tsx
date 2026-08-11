"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/real-estate/dashboard-page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function DashboardLoadingState() {
  return (
    <div
      className="py-8 md:py-12"
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="container mx-auto max-w-7xl space-y-8 px-4">
        <div className="h-44 animate-pulse rounded-2xl bg-primary/15" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 max-w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="h-6 w-44 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DashboardLoadingState />;
  }

  return <DashboardPage />;
}