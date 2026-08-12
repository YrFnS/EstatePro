"use client";

import dynamic from "next/dynamic";
import { BrowserOnlyPageFallback } from "@/components/browser-only-page-fallback";

const BrowserComparePage = dynamic(
  () =>
    import("@/components/real-estate/compare-page").then(
      (module) => module.ComparePage
    ),
  {
    ssr: false,
    loading: () => (
      <BrowserOnlyPageFallback label="Loading property comparison" />
    ),
  }
);

export function ComparePageClient() {
  return <BrowserComparePage />;
}
