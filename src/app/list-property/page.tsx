import type { Metadata } from "next";
import { ListPropertyPage } from "@/components/real-estate/list-property-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "List Your Property - EstatePro",
  description:
    "List your property on EstatePro and reach thousands of potential buyers and renters. Easy listing process with professional support.",
  openGraph: {
    title: "List Your Property - EstatePro",
    description:
      "List your property on EstatePro and reach thousands of potential buyers and renters.",
  },
};

export default function ListPropertyRoute() {
  return (
    <PageShell>
      <ListPropertyPage />
    </PageShell>
  );
}
