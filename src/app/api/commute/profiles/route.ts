import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ profiles: [], fallback: true });
    }

    const profiles = await db.commuteProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ profiles: [], fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, destinationName, destinationLat, destinationLng, transportMode } = body;

    if (!userId || !destinationName || typeof destinationLat !== "number" || typeof destinationLng !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const profile = await db.commuteProfile.create({
      data: {
        userId,
        destinationName,
        destinationLat,
        destinationLng,
        transportMode: transportMode || "driving",
      },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Failed to create commute profile" },
      { status: 500 }
    );
  }
}
