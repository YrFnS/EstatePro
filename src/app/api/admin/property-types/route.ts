import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/property-types - List all property type configs
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const propertyTypes = await db.propertyTypeConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ propertyTypes });
  } catch (error) {
    console.error("Error fetching property types:", error);
    return NextResponse.json(
      { error: "Failed to fetch property types" },
      { status: 500 }
    );
  }
}

// POST /api/admin/property-types - Create new property type config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ["nameEn", "type"];
    const missingFields = requiredFields.filter(
      (field) => !body[field] || body[field].trim() === ""
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    // Check if type already exists (unique constraint)
    const existing = await db.propertyTypeConfig.findUnique({
      where: { type: body.type },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Property type "${body.type}" already exists` },
        { status: 409 }
      );
    }

    const propertyType = await db.propertyTypeConfig.create({
      data: {
        nameEn: body.nameEn,
        nameAr: body.nameAr || "",
        type: body.type,
        icon: body.icon || "Building2",
        listingCount: body.listingCount ?? 0,
        featured: body.featured ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ propertyType }, { status: 201 });
  } catch (error) {
    console.error("Error creating property type:", error);
    return NextResponse.json(
      { error: "Failed to create property type" },
      { status: 500 }
    );
  }
}
