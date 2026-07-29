import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(5).max(4_000),
  propertyId: z.string().trim().min(1).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "inquiry", {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many inquiries. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      }
    );
  }

  try {
    const parsed = inquirySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid inquiry", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (input.propertyId) {
      const propertyExists = await db.property.count({ where: { id: input.propertyId } });
      if (!propertyExists) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
    }

    const inquiry = await db.inquiry.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        message: input.message,
        propertyId: input.propertyId || null,
      },
    });

    return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
  } catch (error) {
    console.error("Error saving inquiry:", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
