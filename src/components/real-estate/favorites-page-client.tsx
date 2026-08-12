"use client";

import dynamic from "next/dynamic";
import { BrowserOnlyPageFallback } from "@/components/browser-only-page-fallback";

const BrowserFavoritesPage = dynamic(
  () =>
    import("@/components/real-estate/favorites-page").then(
      (module) => module.FavoritesPage
    ),
  {
    ssr: false,
    loading: () => <BrowserOnlyPageFallback label="Loading saved properties" />,
  }
);

export function FavoritesPageClient() {
  return <BrowserFavoritesPage />;
}
