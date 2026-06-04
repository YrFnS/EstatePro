import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const north = searchParams.get("north");
    const south = searchParams.get("south");
    const east = searchParams.get("east");
    const west = searchParams.get("west");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");

    const where: any = {};

    // Geographic bounds filter
    if (north && south && east && west) {
      where.lat = { gte: parseFloat(south), lte: parseFloat(north) };
      where.lng = { gte: parseFloat(west), lte: parseFloat(east) };
    } else {
      // Only return properties that have coordinates
      where.lat = { not: null };
      where.lng = { not: null };
    }

    // Additional filters
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseInt(bathrooms) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const { db } = await import("@/lib/db");

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
    });

    return NextResponse.json({ properties, total: properties.length });
  } catch (error) {
    console.error("Error fetching map properties:", error);
    return NextResponse.json({ properties: [], total: 0, fallback: true });
  }
}
