import type { Metadata } from "next";
import { PropertyAlertsClientBoundary } from "@/components/real-estate/property-alerts-client-boundary";

export const metadata: Metadata = {
  title: "Property Alerts - EstatePro",
  description: "Set up property alerts and get notified instantly when new listings match your search criteria. Never miss a listing again.",
};

export default function PropertyAlertsRoute() {
  return <PropertyAlertsClientBoundary />;
}
