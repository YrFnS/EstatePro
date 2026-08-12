"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function PropertyDetailFallback() {
  return (
    <div
      className="container mx-auto px-4 py-8 md:py-12"
      aria-busy="true"
      aria-label="Loading property details"
    >
      <Skeleton className="mb-5 h-9 w-44" />
      <Skeleton className="mb-8 h-[420px] w-full rounded-3xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    </div>
  );
}

const BrowserPropertyDetailPage = dynamic(
  () =>
    import("@/components/real-estate/property-detail-page").then(
      (module) => module.PropertyDetailPage
    ),
  {
    ssr: false,
    loading: PropertyDetailFallback,
  }
);

export function PropertyDetailClient() {
  return <BrowserPropertyDetailPage />;
}
