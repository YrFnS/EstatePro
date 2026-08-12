import type { Metadata } from "next";
import { DashboardClientBoundary } from "@/components/real-estate/dashboard-client-boundary";

export const metadata: Metadata = {
  title: "Dashboard - EstatePro",
  description: "Your personal dashboard — manage listings, track inquiries, view saved properties, and monitor market activity all in one place.",
};

export default function DashboardRoute() {
  return <DashboardClientBoundary />;
}
