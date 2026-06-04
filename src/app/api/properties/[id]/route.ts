import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            titleEn: true,
            titleAr: true,
            email: true,
            phone: true,
            image: true,
            rating: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json({ property: null, fallback: true });
  }
}
