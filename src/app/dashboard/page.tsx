import type { Metadata } from "next";
import { DashboardPage } from "@/components/real-estate/dashboard-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Dashboard - EstatePro",
  description: "Your personal dashboard — manage listings, track inquiries, view saved properties, and monitor market activity all in one place.",
};

export default function DashboardRoute() {
  return (
    <PageShell>
      <DashboardPage />
    </PageShell>
  );
}
