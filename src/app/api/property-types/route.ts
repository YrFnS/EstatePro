import { NextResponse } from "next/server";

// GET /api/property-types - Returns property type configs
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const propertyTypes = await db.propertyTypeConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ propertyTypes });
  } catch (error) {
    console.error("Error fetching property types:", error);
    return NextResponse.json({ propertyTypes: [], fallback: true });
  }
}
