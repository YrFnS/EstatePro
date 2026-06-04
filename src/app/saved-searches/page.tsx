import type { Metadata } from "next";
import { SavedSearchesPage } from "@/components/real-estate/saved-searches-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Saved Searches - EstatePro",
  description:
    "Manage your saved property searches. Get notified when new listings match your criteria.",
};

export default function SavedSearchesRoute() {
  return (
    <PageShell>
      <SavedSearchesPage />
    </PageShell>
  );
}
