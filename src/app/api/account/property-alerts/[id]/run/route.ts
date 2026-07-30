import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { processPropertyAlerts } from "@/lib/property-alert-matcher";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const limit = checkRateLimit(
    request,
    `property-alert-run:${user.id}`,
    {
      limit: 10,
      windowMs: 5 * 60 * 1000,
    }
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many alert refresh requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfter),
        },
      }
    );
  }

  const { id } = await params;
  const alert = await db.propertyAlert.findUnique({
    where: { id },
    select: { id: true, userId: true, enabled: true },
  });

  if (!alert) {
    return NextResponse.json(
      { error: "Property alert not found" },
      { status: 404 }
    );
  }
  if (alert.userId !== user.id) return forbidden();
  if (!alert.enabled) {
    return NextResponse.json(
      { error: "Enable this alert before refreshing it" },
      { status: 409 }
    );
  }

  const result = await processPropertyAlerts({
    alertIds: [alert.id],
    userId: user.id,
    force: true,
    limit: 1,
  });

  if (result.failed) {
    return NextResponse.json(
      {
        error:
          result.results[0]?.error ||
          "Failed to process property alert",
        result,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ result });
}
