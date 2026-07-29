import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const createTourSchema = z.object({
  propertyId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().default(""),
  date: z.string().trim().min(4).max(40),
  time: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(2_000).optional().default(""),
  tourType: z.enum(["in-person", "virtual", "video-call"]).optional().default("in-person"),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "tour", {
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many tour requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      }
    );
  }

  try {
    const parsed = createTourSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tour request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const propertyExists = await db.property.count({ where: { id: input.propertyId } });
    if (!propertyExists) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const tour = await db.tour.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        date: input.date,
        time: input.time,
        notes: input.notes,
        tourType: input.tourType,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, tour }, { status: 201 });
  } catch (error) {
    console.error("Tour creation error:", error);
    return NextResponse.json({ error: "Failed to schedule tour" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const propertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
    const where: Prisma.TourWhereInput = propertyId ? { propertyId } : {};

    if (user.role === "agent") {
      const agent = await db.agent.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { id: true },
      });
      if (!agent) return NextResponse.json({ tours: [] });

      const assignedProperties = await db.property.findMany({
        where: { agentId: agent.id },
        select: { id: true },
      });
      const propertyIds = assignedProperties.map((property) => property.id);
      if (!propertyIds.length) return NextResponse.json({ tours: [] });
      if (propertyId && !propertyIds.includes(propertyId)) {
        return NextResponse.json({ tours: [] });
      }
      where.propertyId = propertyId || { in: propertyIds };
    } else if (user.role !== "admin") {
      where.email = user.email.toLowerCase();
    }

    const tours = await db.tour.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Tours fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}
