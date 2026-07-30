import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isStaffRole } from "@/lib/api-auth";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  getPropertyPagination,
} from "@/lib/property-filters";
import {
  inferExternalMediaType,
  normalizeExternalMediaUrl,
} from "@/lib/property-media";
import { validateListingForSubmission } from "@/lib/listing-lifecycle";
import { resolveAgentForUser } from "@/lib/listing-access";

const propertyInputSchema = z.object({
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
  titleEn: true,
  titleAr: true,
  email: true,
  phone: true,
  image: true,
  rating: true,
  specialization: true,
  experience: true,
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
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  if (!isStaffRole(user.role)) {
    return NextResponse.json(
      { error: "Use the listing workspace to submit a property." },
      { status: 403 }
    );
  }

  try {
    const parsed = propertyInputSchema.safeParse(await request.json());
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
    const mediaUrls = Array.from(
      new Set(
        input.images
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map(normalizeExternalMediaUrl)
      )
    );
    const issues = validateListingForSubmission({
      ...input,
      imageCount: mediaUrls.filter(
        (url) => inferExternalMediaType(url) === "image"
      ).length,
    });
    if (issues.length) {
      return NextResponse.json(
        { error: "The property is not ready to submit", issues },
        { status: 400 }
      );
    }

    let agentId = input.agentId || null;
    if (user.role !== "admin") {
      agentId = (await resolveAgentForUser(user))?.id || null;
    } else if (agentId) {
      const agentExists = await db.agent.count({
        where: { id: agentId },
      });
      if (!agentExists) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 400 }
        );
      }
    }

    const listingStatus =
      user.role === "admin" ? "published" : "pending_review";
    const now = new Date();
    const property = await db.property.create({
      data: {
        titleEn: input.titleEn,
        titleAr: input.titleAr,
        descriptionEn: input.descriptionEn,
        descriptionAr: input.descriptionAr,
        price: input.price,
        type: input.type,
        status: input.status,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        area: input.area,
        locationEn: input.locationEn,
        locationAr: input.locationAr,
        addressEn: input.addressEn,
        addressAr: input.addressAr,
        cityEn: input.cityEn,
        cityAr: input.cityAr,
        images: mediaUrls
          .filter((url) => inferExternalMediaType(url) === "image")
          .join(","),
        features: input.features,
        yearBuilt: input.yearBuilt ?? null,
        parking: input.parking,
        featured: user.role === "admin" ? input.featured : false,
        badge: user.role === "admin" ? input.badge ?? null : null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        virtualTourUrl: input.virtualTourUrl || null,
        virtualTourImages: input.virtualTourImages || null,
        agentId,
        ownerUserId: user.id,
        createdByUserId: user.id,
        reviewedByUserId: user.role === "admin" ? user.id : null,
        listingStatus,
        submittedAt: now,
        reviewedAt: user.role === "admin" ? now : null,
        publishedAt: user.role === "admin" ? now : null,
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
            actorUserId: user.id,
            actorName: user.name,
            action:
              user.role === "admin"
                ? "listing_created_and_published"
                : "listing_created_and_submitted",
            previousStatus: null,
            newStatus: listingStatus,
          },
        },
      },
      include: {
        agent: { select: agentSelect },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
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
