import type { Metadata } from "next";
import { AgentDetailPage } from "@/components/real-estate/agent-detail-page";
import { PageShell } from "@/components/page-shell";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const agent = await db.agent.findUnique({
      where: { id },
      select: { nameEn: true, titleEn: true, bioEn: true, image: true, specialization: true },
    });
    if (!agent) {
      return {
        title: "Agent Not Found - EstatePro",
        description: "The agent you are looking for could not be found.",
      };
    }
    return {
      title: `${agent.nameEn} - EstatePro`,
      description:
        agent.bioEn ||
        `${agent.nameEn} is a ${agent.specialization} real estate agent at EstatePro. ${agent.titleEn}`,
      openGraph: {
        title: `${agent.nameEn} - EstatePro`,
        description:
          agent.bioEn ||
          `${agent.nameEn} — ${agent.titleEn}. ${agent.specialization} specialist at EstatePro.`,
        images: agent.image ? [agent.image] : undefined,
      },
    };
  } catch {
    return {
      title: "Agent - EstatePro",
      description: "View agent profile on EstatePro.",
    };
  }
}

export default function AgentDetailRoute() {
  return (
    <PageShell>
      <AgentDetailPage />
    </PageShell>
  );
}
