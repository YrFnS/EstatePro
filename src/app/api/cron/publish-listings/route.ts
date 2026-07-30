import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publishScheduledListings } from "@/lib/scheduled-listings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!provided) return false;

  const expected = Buffer.from(secret);
  const supplied = Buffer.from(provided);
  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
}

async function run(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedLimit = Number(
    request.nextUrl.searchParams.get("limit") || "100"
  );
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(500, Math.max(1, Math.floor(requestedLimit)))
    : 100;

  try {
    const result = await publishScheduledListings(limit);
    return NextResponse.json({
      success: result.failed === 0,
      processedAt: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Scheduled listing publication failed:", error);
    return NextResponse.json(
      { error: "Scheduled listing publication failed" },
      { status: 500 }
    );
  }
}

export const GET = run;
export const POST = run;
