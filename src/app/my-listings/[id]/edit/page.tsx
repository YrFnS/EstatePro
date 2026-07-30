import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ListingEditor } from "@/components/real-estate/listing-editor";

export const metadata: Metadata = {
  title: "Edit Listing - EstatePro",
  description: "Edit a property draft and manage its media and review workflow.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditListingRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <ListingEditor listingId={id} />
    </PageShell>
  );
}
