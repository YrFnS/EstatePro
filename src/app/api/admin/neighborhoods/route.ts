import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/neighborhoods - List all neighborhoods
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const neighborhoods = await db.neighborhood.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods" },
      { status: 500 }
    );
  }
}

// POST /api/admin/neighborhoods - Create new neighborhood
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ["nameEn", "descEn"];
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

    const neighborhood = await db.neighborhood.create({
      data: {
        nameEn: body.nameEn,
        nameAr: body.nameAr || "",
        descEn: body.descEn,
        descAr: body.descAr || "",
        avgPrice: body.avgPrice || "",
        propertyCount: body.propertyCount ?? 0,
        searchQuery: body.searchQuery || "",
        image: body.image || "",
        featured: body.featured ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ neighborhood }, { status: 201 });
  } catch (error) {
    console.error("Error creating neighborhood:", error);
    return NextResponse.json(
      { error: "Failed to create neighborhood" },
      { status: 500 }
    );
  }
}
