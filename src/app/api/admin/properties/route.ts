import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  getPropertyPagination,
} from "@/lib/property-filters";
import {
  inferExternalMediaType,
  normalizeExternalMediaUrl,
  propertyMediaSelect,
} from "@/lib/property-media";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";

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

function adminSession(request: NextRequest) {
  return verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    request.cookies.get(ADMIN_NONCE_COOKIE)?.value
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildPropertyWhere(searchParams, {
      includeUnpublished: true,
    });
    const orderBy = buildPropertyOrderBy(searchParams.get("sort"));
    const { page, limit, skip } = getPropertyPagination(searchParams);

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          agent: { select: agentSelect },
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          media: {
            orderBy: { sortOrder: "asc" },
            select: propertyMediaSelect,
          },
        },
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
  const session = adminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    let ownerUserId: string | null = null;
    if (input.agentId) {
      const agent = await db.agent.findUnique({
        where: { id: input.agentId },
        select: { id: true, email: true },
      });
      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 400 }
        );
      }
      ownerUserId =
        (
          await db.user.findUnique({
            where: { email: agent.email.toLowerCase() },
            select: { id: true },
          })
        )?.id || null;
    }

    const administrator = await db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true },
    });
    if (!administrator) {
      return NextResponse.json(
        { error: "Administrator account not found" },
        { status: 401 }
      );
    }

    const mediaUrls = Array.from(
      new Set(
        input.images
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map(normalizeExternalMediaUrl)
      )
    );
    const now = new Date();
    const property = await db.property.create({
      data: {
        ...input,
        images: mediaUrls
          .filter((url) => inferExternalMediaType(url) === "image")
          .join(","),
        yearBuilt: input.yearBuilt ?? null,
        badge: input.badge || null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        virtualTourUrl: input.virtualTourUrl || null,
        virtualTourImages: input.virtualTourImages || null,
        agentId: input.agentId || null,
        ownerUserId,
        createdByUserId: administrator.id,
        reviewedByUserId: administrator.id,
        listingStatus: "published",
        submittedAt: now,
        reviewedAt: now,
        publishedAt: now,
        media: {
          create: mediaUrls.map((url, index) => ({
            url,
            source: "external",
            type: inferExternalMediaType(url),
            sortOrder: index,
            isCover:
              index === 0 && inferExternalMediaType(url) === "image",
          })),
        },
        auditLogs: {
          create: {
            actorUserId: administrator.id,
            actorName: administrator.name,
            action: "listing_created_and_published",
            previousStatus: null,
            newStatus: "published",
            metadata: { source: "admin_property_manager" },
          },
        },
      },
      include: {
        agent: { select: agentSelect },
        owner: { select: { id: true, name: true, email: true } },
        media: {
          orderBy: { sortOrder: "asc" },
          select: propertyMediaSelect,
        },
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("Admin property creation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create property",
      },
      { status: 500 }
    );
  }
}
