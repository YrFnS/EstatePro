import type { Metadata } from "next";
import { NotificationsPage } from "@/components/real-estate/notifications-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Notifications - EstatePro",
  description: "View your latest notifications — property updates, inquiry responses, and important alerts from EstatePro.",
};

export default function NotificationsRoute() {
  return (
    <PageShell>
      <NotificationsPage />
    </PageShell>
  );
}
