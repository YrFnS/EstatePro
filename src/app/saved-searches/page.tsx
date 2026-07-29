import type { Metadata } from "next";
import { SavedSearchesAccountPage } from "@/components/real-estate/saved-searches-account-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Saved Searches - EstatePro",
  description:
    "Manage property searches that synchronize with your EstatePro account.",
};

export default function SavedSearchesRoute() {
  return (
    <PageShell>
      <SavedSearchesAccountPage />
    </PageShell>
  );
}
