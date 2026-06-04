import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, name, email, phone, date, time, notes, tourType } = body;

    if (!propertyId || !name || !email || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tour = await db.tour.create({
      data: {
        propertyId,
        name,
        email,
        phone: phone || "",
        date,
        time,
        notes: notes || "",
        tourType: tourType || "in-person",
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, tour });
  } catch (error) {
    console.error("Tour creation error:", error);
    return NextResponse.json({ error: "Failed to schedule tour" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");

    const where = propertyId ? { propertyId } : {};
    const tours = await db.tour.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Tours fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}
