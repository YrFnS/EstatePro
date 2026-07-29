import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const nonce = request.cookies.get(ADMIN_NONCE_COOKIE)?.value;
  const session = verifyAdminSession(token, nonce);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (
      !user ||
      user.role !== "admin" ||
      user.email.toLowerCase() !== session.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin session lookup failed:", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
