import { NextResponse } from "next/server";

// GET /api/market-data - Returns market data points and stats
export async function GET(request: Request) {
  try {
    const { db } = await import("@/lib/db");

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";

    const [dataPoints, stats] = await Promise.all([
      db.marketDataPoint.findMany({
        where: { period },
        orderBy: { createdAt: "asc" },
      }),
      db.marketStat.findMany({
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({ dataPoints, stats });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json({ dataPoints: [], stats: [], fallback: true });
  }
}
