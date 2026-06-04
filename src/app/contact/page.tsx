import type { Metadata } from "next";
import { ContactPage } from "@/components/real-estate/contact-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Contact Us - EstatePro",
  description:
    "Get in touch with the EstatePro team. Whether you have a question about properties, need assistance, or want to list your home — we're here to help.",
  openGraph: {
    title: "Contact Us - EstatePro",
    description:
      "Get in touch with the EstatePro team. We're here to help with all your real estate needs.",
  },
};

export default function ContactRoute() {
  return (
    <PageShell>
      <ContactPage />
    </PageShell>
  );
}
