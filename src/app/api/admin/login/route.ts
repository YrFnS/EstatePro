import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  createAdminSession,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

function legacyHash(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "admin-login", {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      }
    );
  }

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password || email.length > 320 || password.length > 256) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let passwordMatches = false;
    let usedLegacyHash = false;

    try {
      passwordMatches = await bcrypt.compare(password, user.password);
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches && legacyHash(password) === user.password) {
      passwordMatches = true;
      usedLegacyHash = true;
    }

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (usedLegacyHash) {
      await db.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(password, 12) },
      });
    }

    const session = createAdminSession({ userId: user.id, email: user.email });
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      session.token,
      adminCookieOptions(true)
    );
    response.cookies.set(
      ADMIN_NONCE_COOKIE,
      session.nonce,
      adminCookieOptions(false)
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
