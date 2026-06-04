import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.commuteProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete commute profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { destinationName, destinationLat, destinationLng, transportMode } = body;

    const profile = await db.commuteProfile.update({
      where: { id },
      data: {
        ...(destinationName && { destinationName }),
        ...(typeof destinationLat === "number" && { destinationLat }),
        ...(typeof destinationLng === "number" && { destinationLng }),
        ...(transportMode && { transportMode }),
      },
    });

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: "Failed to update commute profile" },
      { status: 500 }
    );
  }
}
