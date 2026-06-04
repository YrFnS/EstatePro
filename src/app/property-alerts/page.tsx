import type { Metadata } from "next";
import { PropertyAlertsPage } from "@/components/real-estate/property-alerts-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Property Alerts - EstatePro",
  description: "Set up property alerts and get notified instantly when new listings match your search criteria. Never miss a listing again.",
};

export default function PropertyAlertsRoute() {
  return (
    <PageShell>
      <PropertyAlertsPage />
    </PageShell>
  );
}
