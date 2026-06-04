import type { Metadata } from "next";
import { AgentsPage } from "@/components/real-estate/agents-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Our Agents - EstatePro",
  description:
    "Meet our team of experienced real estate agents. Find the right agent to help you buy, sell, or rent your property with expert guidance.",
  openGraph: {
    title: "Our Agents - EstatePro",
    description:
      "Meet our team of experienced real estate agents ready to help you find your dream home.",
  },
};

export default function AgentsRoute() {
  return (
    <PageShell>
      <AgentsPage />
    </PageShell>
  );
}
