import { NextRequest, NextResponse } from "next/server";

// PUT /api/admin/testimonials/[id] - Update a testimonial
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { db } = await import("@/lib/db");

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const testimonial = await db.testimonial.update({
      where: { id },
      data: {
        authorEn: body.authorEn ?? existing.authorEn,
        authorAr: body.authorAr ?? existing.authorAr,
        roleEn: body.roleEn ?? existing.roleEn,
        roleAr: body.roleAr ?? existing.roleAr,
        contentEn: body.contentEn ?? existing.contentEn,
        contentAr: body.contentAr ?? existing.contentAr,
        avatar: body.avatar ?? existing.avatar,
        rating: body.rating ?? existing.rating,
        featured: body.featured ?? existing.featured,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    });

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

// DELETE /api/admin/testimonials/[id] - Delete a testimonial
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await import("@/lib/db");

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await db.testimonial.delete({ where: { id } });
    return NextResponse.json({ message: "Testimonial deleted" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
