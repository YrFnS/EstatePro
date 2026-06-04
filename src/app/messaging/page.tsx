import type { Metadata } from "next";
import { MessagingPage } from "@/components/real-estate/messaging-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Messages - EstatePro",
  description:
    "Chat with real estate agents about properties. Get instant answers to your questions and schedule viewings.",
  openGraph: {
    title: "Messages - EstatePro",
    description:
      "Chat with real estate agents about properties on EstatePro.",
  },
};

export default function MessagingRoute() {
  return (
    <PageShell>
      <MessagingPage />
    </PageShell>
  );
}
