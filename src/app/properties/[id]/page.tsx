import type { Metadata } from "next";
import { PropertyDetailPage } from "@/components/real-estate/property-detail-page";
import { PageShell } from "@/components/page-shell";
import { db } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const property = await db.property.findUnique({
      where: { id },
      select: { titleEn: true, descriptionEn: true, locationEn: true, images: true },
    });
    if (!property) {
      return {
        title: "Property Not Found - EstatePro",
        description: "The property you are looking for could not be found.",
      };
    }
    const imageList = property.images ? property.images.split(",") : [];
    return {
      title: `${property.titleEn} - EstatePro`,
      description:
        property.descriptionEn ||
        `${property.titleEn} located in ${property.locationEn}. View details, photos, and more on EstatePro.`,
      openGraph: {
        title: `${property.titleEn} - EstatePro`,
        description:
          property.descriptionEn ||
          `${property.titleEn} located in ${property.locationEn}.`,
        images: imageList.length > 0 ? [imageList[0]] : undefined,
      },
    };
  } catch {
    return {
      title: "Property - EstatePro",
      description: "View property details on EstatePro.",
    };
  }
}

export default function PropertyDetailRoute() {
  return (
    <PageShell>
      <PropertyDetailPage />
    </PageShell>
  );
}
