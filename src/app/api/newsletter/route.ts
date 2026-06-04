import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Dynamically import db to avoid stale Prisma client issues
    let subscribed = false;
    try {
      const { db } = await import("@/lib/db");
      const existing = await db.newsletterSubscriber.findUnique({
        where: { email },
      });
      if (existing) {
        return NextResponse.json({ success: true, message: "Already subscribed" });
      }
      await db.newsletterSubscriber.create({
        data: { email },
      });
      subscribed = true;
    } catch {
      // If DB fails, just log and still return success
      console.log(`Newsletter subscription: ${email}`);
    }

    return NextResponse.json({ success: true, persisted: subscribed });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const count = await db.newsletterSubscriber.count();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
