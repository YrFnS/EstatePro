import type { Metadata } from "next";
import { SettingsPage } from "@/components/real-estate/settings-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "AI Settings - EstatePro",
  description: "Configure your AI preferences, notification settings, and personalization options for a tailored EstatePro experience.",
};

export default function SettingsRoute() {
  return (
    <PageShell>
      <SettingsPage />
    </PageShell>
  );
}
