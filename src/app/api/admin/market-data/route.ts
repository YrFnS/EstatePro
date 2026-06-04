import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/market-data - List market data points and stats
export async function GET() {
  try {
    const { db } = await import("@/lib/db");

    const [dataPoints, stats] = await Promise.all([
      db.marketDataPoint.findMany({
        orderBy: { createdAt: "asc" },
      }),
      db.marketStat.findMany({
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({ dataPoints, stats });
  } catch (error) {
    console.error("Error fetching market data:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

// POST /api/admin/market-data - Create new data point or stat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { db } = await import("@/lib/db");

    // Determine if it's a data point or a stat based on the payload
    if (body.kind === "stat") {
      // Create a MarketStat
      const requiredFields = ["labelEn", "value"];
      const missingFields = requiredFields.filter(
        (field) => !body[field] || String(body[field]).trim() === ""
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for stat: ${missingFields.join(", ")}` },
          { status: 400 }
        );
      }

      const stat = await db.marketStat.create({
        data: {
          labelEn: body.labelEn,
          labelAr: body.labelAr || "",
          value: body.value,
          change: body.change || "",
          changeType: body.changeType || "up",
          sortOrder: body.sortOrder ?? 0,
        },
      });

      return NextResponse.json({ stat }, { status: 201 });
    } else {
      // Create a MarketDataPoint (default)
      const requiredFields = ["label", "value"];
      const missingFields = requiredFields.filter(
        (field) => body[field] === undefined || body[field] === null
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for data point: ${missingFields.join(", ")}` },
          { status: 400 }
        );
      }

      const dataPoint = await db.marketDataPoint.create({
        data: {
          label: body.label,
          value: Number(body.value),
          period: body.period || "monthly",
        },
      });

      return NextResponse.json({ dataPoint }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating market data:", error);
    return NextResponse.json(
      { error: "Failed to create market data" },
      { status: 500 }
    );
  }
}
