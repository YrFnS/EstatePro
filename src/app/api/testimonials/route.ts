import { NextResponse } from "next/server";

// GET /api/testimonials - Returns featured testimonials
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const testimonials = await db.testimonial.findMany({
      where: { featured: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ testimonials: [], fallback: true });
  }
}
