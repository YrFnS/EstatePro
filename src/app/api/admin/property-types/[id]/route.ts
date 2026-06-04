import { NextRequest, NextResponse } from "next/server";

// PUT /api/admin/property-types/[id] - Update a property type config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { db } = await import("@/lib/db");

    const existing = await db.propertyTypeConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Property type not found" }, { status: 404 });
    }

    const propertyType = await db.propertyTypeConfig.update({
      where: { id },
      data: {
        nameEn: body.nameEn ?? existing.nameEn,
        nameAr: body.nameAr ?? existing.nameAr,
        icon: body.icon ?? existing.icon,
        listingCount: body.listingCount ?? existing.listingCount,
        featured: body.featured ?? existing.featured,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    });

    return NextResponse.json({ propertyType });
  } catch (error) {
    console.error("Error updating property type:", error);
    return NextResponse.json({ error: "Failed to update property type" }, { status: 500 });
  }
}

// DELETE /api/admin/property-types/[id] - Delete a property type config
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await import("@/lib/db");

    const existing = await db.propertyTypeConfig.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Property type not found" }, { status: 404 });
    }

    await db.propertyTypeConfig.delete({ where: { id } });
    return NextResponse.json({ message: "Property type deleted" });
  } catch (error) {
    console.error("Error deleting property type:", error);
    return NextResponse.json({ error: "Failed to delete property type" }, { status: 500 });
  }
}
