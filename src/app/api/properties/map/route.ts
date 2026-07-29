import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildPropertyWhere } from "@/lib/property-filters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildPropertyWhere(searchParams, { requireCoordinates: true });

    const properties = await db.property.findMany({
      where,
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        price: true,
        type: true,
        status: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        locationEn: true,
        locationAr: true,
        images: true,
        lat: true,
        lng: true,
        badge: true,
        featured: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ properties, total: properties.length });
  } catch (error) {
    console.error("Error fetching map properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch map properties" },
      { status: 500 }
    );
  }
}
