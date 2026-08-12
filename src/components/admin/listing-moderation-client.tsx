"use client";

import dynamic from "next/dynamic";
import { Loader2, ShieldCheck } from "lucide-react";

function ListingModerationFallback() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-muted/20 px-4"
      aria-busy="true"
      aria-label="Loading listing moderation"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold">Loading listing moderation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifying the protected administrator session.
          </p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      </div>
    </main>
  );
}

const BrowserListingModerationPage = dynamic(
  () =>
    import("@/components/admin/listing-moderation-page").then(
      (module) => module.ListingModerationPage
    ),
  {
    ssr: false,
    loading: ListingModerationFallback,
  }
);

export function ListingModerationClient() {
  return <BrowserListingModerationPage />;
}
