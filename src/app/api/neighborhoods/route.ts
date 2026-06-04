import { NextResponse } from "next/server";

// GET /api/neighborhoods - Returns featured neighborhoods
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const neighborhoods = await db.neighborhood.findMany({
      where: { featured: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return NextResponse.json({ neighborhoods: [], fallback: true });
  }
}
