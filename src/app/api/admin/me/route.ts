import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode the simple token: base64(userId:email:role)
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, email, role] = decoded.split(":");

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { db } = await import("@/lib/db");

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user || user.email !== email || user.role !== role) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
}
