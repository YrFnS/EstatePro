import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/testimonials - List all testimonials
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const testimonials = await db.testimonial.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

// POST /api/admin/testimonials - Create new testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const requiredFields = ["authorEn", "roleEn", "contentEn"];
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

    const testimonial = await db.testimonial.create({
      data: {
        authorEn: body.authorEn,
        authorAr: body.authorAr || "",
        roleEn: body.roleEn,
        roleAr: body.roleAr || "",
        contentEn: body.contentEn,
        contentAr: body.contentAr || "",
        avatar: body.avatar || "",
        rating: body.rating ?? 5,
        featured: body.featured ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
