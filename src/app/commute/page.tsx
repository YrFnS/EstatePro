import { ClientHydrationBoundary } from "@/components/client-hydration-boundary";
import { CommutePage } from "@/components/real-estate/commute-page";

export default function Commute() {
  return (
    <ClientHydrationBoundary label="Loading commute planner">
      <CommutePage />
    </ClientHydrationBoundary>
  );
}