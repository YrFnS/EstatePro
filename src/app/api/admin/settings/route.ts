import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/settings - Get all settings, optionally filtered by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const { db } = await import("@/lib/db");

    const where = category ? { category } : {};

    const settings = await db.siteSetting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update multiple settings at once
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as {
      settings: Array<{ key: string; valueEn: string; valueAr?: string }>;
    };

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json(
        { error: "settings must be a non-empty array of {key, valueEn, valueAr?}" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    const results = await Promise.all(
      settings.map((setting) =>
        db.siteSetting.upsert({
          where: { key: setting.key },
          update: {
            valueEn: setting.valueEn,
            ...(setting.valueAr !== undefined ? { valueAr: setting.valueAr } : {}),
          },
          create: {
            key: setting.key,
            valueEn: setting.valueEn,
            valueAr: setting.valueAr || "",
            category: setting.key.split(".")[0] || "general",
            type: "text",
          },
        })
      )
    );

    return NextResponse.json({
      message: "Settings updated successfully",
      updated: results.length,
      settings: results,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
