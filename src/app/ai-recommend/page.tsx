import type { Metadata } from "next";
import { AIRecommendPage } from "@/components/real-estate/ai-recommend-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "AI Property Match - EstatePro",
  description:
    "Let our AI find your perfect property match. Answer a few questions and get personalized property recommendations tailored to your preferences.",
};

export default function AIRecommendRoute() {
  return (
    <PageShell>
      <AIRecommendPage />
    </PageShell>
  );
}
