import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { propertyMediaSelect } from "@/lib/property-media";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            titleEn: true,
            titleAr: true,
            email: true,
            phone: true,
            image: true,
            rating: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          select: propertyMediaSelect,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    if (property.listingStatus !== "published") {
      const user = await getCurrentUser();
      const canPreview =
        Boolean(user) &&
        (user?.role === "admin" ||
          property.ownerUserId === user?.id ||
          (user?.role === "agent" &&
            property.agent?.email.toLowerCase() ===
              user.email.toLowerCase()));

      if (!canPreview) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}
