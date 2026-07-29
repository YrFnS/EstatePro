import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const updatePropertySchema = z.object({
  titleEn: z.string().trim().min(2).max(160),
  titleAr: z.string().trim().min(2).max(160),
  descriptionEn: z.string().trim().min(10).max(10_000),
  descriptionAr: z.string().trim().min(10).max(10_000),
  price: z.number().finite().positive().max(1_000_000_000_000),
  type: z.string().trim().min(2).max(50),
  status: z.enum(["sale", "rent"]),
  bedrooms: z.number().int().min(0).max(100),
  bathrooms: z.number().int().min(0).max(100),
  area: z.number().finite().positive().max(100_000_000),
  locationEn: z.string().trim().min(2).max(300),
  locationAr: z.string().trim().min(2).max(300),
  addressEn: z.string().trim().min(2).max(500),
  addressAr: z.string().trim().min(2).max(500),
  cityEn: z.string().trim().min(2).max(120),
  cityAr: z.string().trim().min(2).max(120),
  images: z.string().max(50_000).optional().default(""),
  features: z.string().max(20_000).optional().default(""),
  yearBuilt: z.number().int().min(1000).max(3000).nullable().optional(),
  parking: z.number().int().min(0).max(100).optional().default(0),
  featured: z.boolean().optional().default(false),
  badge: z.string().trim().max(30).nullable().optional(),
  lat: z.number().finite().min(-90).max(90).nullable().optional(),
  lng: z.number().finite().min(-180).max(180).nullable().optional(),
  virtualTourUrl: z.string().trim().max(2_000).nullable().optional(),
  virtualTourImages: z.string().max(50_000).nullable().optional(),
  agentId: z.string().trim().min(1).nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      include: { agent: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json({ property });
  } catch (error) {
    console.error("Admin property lookup error:", error);
    return NextResponse.json(
      { error: "Failed to load property" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = updatePropertySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid property data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (input.agentId) {
      const agentExists = await db.agent.count({ where: { id: input.agentId } });
      if (!agentExists) {
        return NextResponse.json({ error: "Agent not found" }, { status: 400 });
      }
    }

    const property = await db.property.update({
      where: { id },
      data: {
        ...input,
        yearBuilt: input.yearBuilt ?? null,
        badge: input.badge || null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        virtualTourUrl: input.virtualTourUrl || null,
        virtualTourImages: input.virtualTourImages || null,
        agentId: input.agentId || null,
      },
      include: { agent: true },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Admin property update error:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.$transaction([
      db.review.deleteMany({ where: { propertyId: id } }),
      db.inquiry.updateMany({ where: { propertyId: id }, data: { propertyId: null } }),
      db.conversation.updateMany({ where: { propertyId: id }, data: { propertyId: null } }),
      db.property.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin property deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
