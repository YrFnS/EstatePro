import type { Metadata } from "next";
import { ComparePage } from "@/components/real-estate/compare-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Compare Properties - EstatePro",
  description:
    "Compare properties side by side to make an informed decision. Evaluate prices, features, locations, and more at a glance.",
};

export default function CompareRoute() {
  return (
    <PageShell>
      <ComparePage />
    </PageShell>
  );
}
