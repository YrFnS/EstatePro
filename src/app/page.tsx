import type { Metadata } from "next";
import { HomePage } from "@/components/real-estate/home-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "EstatePro - Find Your Dream Home",
  description:
    "Discover your perfect property with EstatePro. Browse thousands of homes, apartments, villas, and condos for sale or rent. Expert agents, smart AI recommendations, and powerful search tools.",
  openGraph: {
    title: "EstatePro - Find Your Dream Home",
    description:
      "Discover your perfect property with EstatePro. Browse thousands of homes, apartments, villas, and condos for sale or rent.",
    type: "website",
  },
};

export default function HomeRoute() {
  return (
    <PageShell>
      <HomePage />
    </PageShell>
  );
}
