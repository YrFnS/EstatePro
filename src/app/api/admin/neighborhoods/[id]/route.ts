import { NextRequest, NextResponse } from "next/server";

// PUT /api/admin/neighborhoods/[id] - Update a neighborhood
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { db } = await import("@/lib/db");

    const existing = await db.neighborhood.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Neighborhood not found" }, { status: 404 });
    }

    const neighborhood = await db.neighborhood.update({
      where: { id },
      data: {
        nameEn: body.nameEn ?? existing.nameEn,
        nameAr: body.nameAr ?? existing.nameAr,
        descEn: body.descEn ?? existing.descEn,
        descAr: body.descAr ?? existing.descAr,
        avgPrice: body.avgPrice ?? existing.avgPrice,
        propertyCount: body.propertyCount ?? existing.propertyCount,
        searchQuery: body.searchQuery ?? existing.searchQuery,
        image: body.image ?? existing.image,
        featured: body.featured ?? existing.featured,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    });

    return NextResponse.json({ neighborhood });
  } catch (error) {
    console.error("Error updating neighborhood:", error);
    return NextResponse.json({ error: "Failed to update neighborhood" }, { status: 500 });
  }
}

// DELETE /api/admin/neighborhoods/[id] - Delete a neighborhood
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await import("@/lib/db");

    const existing = await db.neighborhood.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Neighborhood not found" }, { status: 404 });
    }

    await db.neighborhood.delete({ where: { id } });
    return NextResponse.json({ message: "Neighborhood deleted" });
  } catch (error) {
    console.error("Error deleting neighborhood:", error);
    return NextResponse.json({ error: "Failed to delete neighborhood" }, { status: 500 });
  }
}
