import { NextRequest, NextResponse } from "next/server";

// PUT /api/admin/market-data/[id] - Update a market data point or stat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { db } = await import("@/lib/db");

    // Try to find as a MarketDataPoint first
    const dataPoint = await db.marketDataPoint.findUnique({ where: { id } });
    if (dataPoint) {
      const updated = await db.marketDataPoint.update({
        where: { id },
        data: {
          label: body.label ?? dataPoint.label,
          value: body.value !== undefined ? Number(body.value) : dataPoint.value,
          period: body.period ?? dataPoint.period,
        },
      });
      return NextResponse.json({ dataPoint: updated });
    }

    // Try as a MarketStat
    const stat = await db.marketStat.findUnique({ where: { id } });
    if (stat) {
      const updated = await db.marketStat.update({
        where: { id },
        data: {
          labelEn: body.labelEn ?? stat.labelEn,
          labelAr: body.labelAr ?? stat.labelAr,
          value: body.value ?? stat.value,
          change: body.change ?? stat.change,
          changeType: body.changeType ?? stat.changeType,
          sortOrder: body.sortOrder ?? stat.sortOrder,
        },
      });
      return NextResponse.json({ stat: updated });
    }

    return NextResponse.json({ error: "Market data not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating market data:", error);
    return NextResponse.json({ error: "Failed to update market data" }, { status: 500 });
  }
}

// DELETE /api/admin/market-data/[id] - Delete a market data point or stat
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await import("@/lib/db");

    // Try to find as a MarketDataPoint first
    const dataPoint = await db.marketDataPoint.findUnique({ where: { id } });
    if (dataPoint) {
      await db.marketDataPoint.delete({ where: { id } });
      return NextResponse.json({ message: "Data point deleted" });
    }

    // Try as a MarketStat
    const stat = await db.marketStat.findUnique({ where: { id } });
    if (stat) {
      await db.marketStat.delete({ where: { id } });
      return NextResponse.json({ message: "Stat deleted" });
    }

    return NextResponse.json({ error: "Market data not found" }, { status: 404 });
  } catch (error) {
    console.error("Error deleting market data:", error);
    return NextResponse.json({ error: "Failed to delete market data" }, { status: 500 });
  }
}
