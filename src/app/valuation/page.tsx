import type { Metadata } from "next";
import { ValuationPage } from "@/components/real-estate/valuation-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Property Valuation - EstatePro",
  description:
    "Get an instant property valuation estimate. Use our AI-powered tool to find out how much your property is worth in today's market.",
};

export default function ValuationRoute() {
  return (
    <PageShell>
      <ValuationPage />
    </PageShell>
  );
}
