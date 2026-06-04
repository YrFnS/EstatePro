import type { Metadata } from "next";
import { MarketInsightsPage } from "@/components/real-estate/market-insights-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Market Insights - EstatePro",
  description: "Stay informed with real estate market insights, trends, price analyses, and expert forecasts to make smarter property decisions.",
};

export default function MarketInsightsRoute() {
  return (
    <PageShell>
      <MarketInsightsPage />
    </PageShell>
  );
}
