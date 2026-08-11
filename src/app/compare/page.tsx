import type { Metadata } from "next";
import { ComparePageClient } from "@/components/real-estate/compare-page-client";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Compare Properties - EstatePro",
  description:
    "Compare properties side by side to make an informed decision. Evaluate prices, features, locations, and more at a glance.",
};

export default function CompareRoute() {
  return (
    <PageShell>
      <ComparePageClient />
    </PageShell>
  );
}
