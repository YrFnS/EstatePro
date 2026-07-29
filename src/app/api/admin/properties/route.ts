import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  getPropertyPagination,
} from "@/lib/property-filters";

export const adminPropertySchema = z.object({
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

const agentSelect = {
  id: true,
  nameEn: true,
  nameAr: true,
  email: true,
  phone: true,
  image: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildPropertyWhere(searchParams);
    const orderBy = buildPropertyOrderBy(searchParams.get("sort"));
    const { page, limit, skip } = getPropertyPagination(searchParams);

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { agent: { select: agentSelect } },
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Admin properties list error:", error);
    return NextResponse.json(
      { error: "Failed to load properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = adminPropertySchema.safeParse(await request.json());
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

    const property = await db.property.create({
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
      include: { agent: { select: agentSelect } },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("Admin property creation error:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
