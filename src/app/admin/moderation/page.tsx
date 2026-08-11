import type { Metadata } from "next";
import { ListingModerationClient } from "@/components/admin/listing-moderation-client";

export const metadata: Metadata = {
  title: "Listing Moderation - EstatePro",
  description: "Review, approve, schedule, return, or archive property listings.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ListingModerationRoute() {
  return <ListingModerationClient />;
}
