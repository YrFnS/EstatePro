import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/settings/[key] - Get single setting by key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const { db } = await import("@/lib/db");

    const setting = await db.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Setting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch setting" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/[key] - Update single setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const { valueEn, valueAr } = body;

    if (valueEn === undefined) {
      return NextResponse.json(
        { error: "valueEn is required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    const setting = await db.siteSetting.upsert({
      where: { key },
      update: {
        valueEn,
        ...(valueAr !== undefined ? { valueAr } : {}),
      },
      create: {
        key,
        valueEn,
        valueAr: valueAr || "",
        category: key.split(".")[0] || "general",
        type: "text",
      },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
