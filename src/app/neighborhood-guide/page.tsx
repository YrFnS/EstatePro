import type { Metadata } from "next";
import { NeighborhoodGuidePage } from "@/components/real-estate/neighborhood-guide-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Neighborhood Guide - EstatePro",
  description:
    "Explore neighborhoods with our comprehensive area guides. Discover schools, amenities, transport links, and lifestyle insights for every area.",
};

export default function NeighborhoodGuideRoute() {
  return (
    <PageShell>
      <NeighborhoodGuidePage />
    </PageShell>
  );
}
