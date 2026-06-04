import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function estimateCommuteTime(distanceKm: number, mode: string): number {
  switch (mode) {
    case "driving":
      return (distanceKm / 40) * 1.3 * 60; // 40 km/h avg city speed, 1.3 road factor → minutes
    case "transit":
      return (distanceKm / 25) * 1.5 * 60; // 25 km/h, 1.5 stops/stations factor
    case "cycling":
      return (distanceKm / 15) * 60; // 15 km/h
    case "walking":
      return (distanceKm / 5) * 60; // 5 km/h
    default:
      return (distanceKm / 40) * 1.3 * 60;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originLat, originLng, destinationLat, destinationLng, transportMode } = body;

    if (
      typeof originLat !== "number" ||
      typeof originLng !== "number" ||
      typeof destinationLat !== "number" ||
      typeof destinationLng !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid coordinates" },
        { status: 400 }
      );
    }

    const mode = transportMode || "driving";
    const distance = haversineDistance(originLat, originLng, destinationLat, destinationLng);
    const distanceMiles = distance * 0.621371;
    const estimatedTime = estimateCommuteTime(distance, mode);

    return NextResponse.json({
      distance: Math.round(distance * 10) / 10,
      distanceUnit: "km",
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      estimatedTime: Math.round(estimatedTime),
      timeUnit: "min",
      transportMode: mode,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate commute" },
      { status: 500 }
    );
  }
}

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
