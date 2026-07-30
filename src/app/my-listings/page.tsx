import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { MyListingsPage } from "@/components/real-estate/my-listings-page";

export const metadata: Metadata = {
  title: "My Listings - EstatePro",
  description:
    "Manage property drafts, moderation feedback, scheduled publication, and live listings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyListingsRoute() {
  return (
    <PageShell>
      <MyListingsPage />
    </PageShell>
  );
}
