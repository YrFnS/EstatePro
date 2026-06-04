import type { Metadata } from "next";
import { FavoritesPage } from "@/components/real-estate/favorites-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "My Favorites - EstatePro",
  description:
    "View and manage your saved favorite properties. Keep track of the homes you love and compare them side by side.",
};

export default function FavoritesRoute() {
  return (
    <PageShell>
      <FavoritesPage />
    </PageShell>
  );
}
