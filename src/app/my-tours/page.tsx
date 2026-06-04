import type { Metadata } from "next";
import { MyToursPage } from "@/components/real-estate/my-tours-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "My Tours - EstatePro",
  description: "Manage your scheduled property tours. View upcoming visits, reschedule, or cancel tours with ease.",
};

export default function MyToursRoute() {
  return (
    <PageShell>
      <MyToursPage />
    </PageShell>
  );
}
