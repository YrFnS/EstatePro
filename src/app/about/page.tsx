import type { Metadata } from "next";
import { AboutPage } from "@/components/real-estate/about-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "About Us - EstatePro",
  description:
    "Learn about EstatePro — our mission, values, and the team behind the platform. We're dedicated to making real estate simple, transparent, and accessible for everyone.",
  openGraph: {
    title: "About Us - EstatePro",
    description:
      "Learn about EstatePro — our mission, values, and the team dedicated to transforming real estate.",
  },
};

export default function AboutRoute() {
  return (
    <PageShell>
      <AboutPage />
    </PageShell>
  );
}
