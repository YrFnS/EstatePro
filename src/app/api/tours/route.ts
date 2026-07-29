import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isStaffRole } from "@/lib/api-auth";

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
    const where: { propertyId?: string; email?: string; propertyIdIn?: string[] } = {};

    if (propertyId) where.propertyId = propertyId;

    if (user.role === "admin") {
      // Administrators may review all tour requests.
    } else if (user.role === "agent") {
      const agent = await db.agent.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ tours: [] });
      }

      const properties = await db.property.findMany({
        where: { agentId: agent.id },
        select: { id: true },
      });
      const propertyIds = properties.map((property) => property.id);
      if (!propertyIds.length) return NextResponse.json({ tours: [] });

      const tours = await db.tour.findMany({
        where: {
          propertyId: propertyId
            ? propertyIds.includes(propertyId)
              ? propertyId
              : "__not_authorized__"
            : { in: propertyIds },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ tours });
    } else {
      where.email = user.email.toLowerCase();
    }

    const tours = await db.tour.findMany({
      where: {
        ...(where.propertyId ? { propertyId: where.propertyId } : {}),
        ...(where.email ? { email: where.email } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Tours fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}
