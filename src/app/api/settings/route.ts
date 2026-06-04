import { NextResponse } from "next/server";

// GET /api/settings - Returns all public site settings (non-sensitive)
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const settings = await db.siteSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Return as a key-value map for easy frontend consumption
    const settingsMap: Record<string, { valueEn: string; valueAr: string; category: string; type: string }> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = {
        valueEn: setting.valueEn,
        valueAr: setting.valueAr,
        category: setting.category,
        type: setting.type,
      };
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json({ settings: {}, fallback: true });
  }
}
