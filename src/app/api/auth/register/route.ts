import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "register", {
    limit: 5,
    windowMs: 30 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      }
    );
  }

  try {
    const parsed = registrationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Enter a valid name, email, and password of at least 8 characters.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 12),
        role: "user",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
