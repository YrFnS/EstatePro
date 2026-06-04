import type { Metadata } from "next";
import { PropertiesPage } from "@/components/real-estate/properties-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Properties - EstatePro",
  description:
    "Browse our extensive collection of properties for sale and rent. Filter by type, price, location, bedrooms, and more to find your ideal home.",
  openGraph: {
    title: "Properties - EstatePro",
    description:
      "Browse our extensive collection of properties for sale and rent. Find apartments, villas, condos, and more.",
  },
};

export default function PropertiesRoute() {
  return (
    <PageShell>
      <PropertiesPage />
    </PageShell>
  );
}
