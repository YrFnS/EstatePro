import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  listingCompletionPercentage,
  normalizeListingStatus,
  validateListingForSubmission,
} from "@/lib/listing-lifecycle";
import {
  accountListingCreateSchema,
  propertyDraftData,
} from "@/lib/property-input";
import {
  listingAgentSelect,
  listingOwnerSelect,
  resolveAgentForUser,
} from "@/lib/listing-access";
import {
  inferExternalMediaType,
  normalizeExternalMediaUrl,
  propertyMediaSelect,
} from "@/lib/property-media";

const MAX_OWNED_LISTINGS = 200;

const listingInclude = {
  owner: { select: listingOwnerSelect },
  agent: { select: listingAgentSelect },
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: propertyMediaSelect,
  },
  _count: {
    select: {
      inquiries: true,
      reviews: true,
      favoritedBy: true,
    },
  },
} as const;

function listingResponse<T extends {
  listingStatus: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  media: Array<{ type: string }>;
}>(listing: T) {
  return {
    ...listing,
    listingStatus: normalizeListingStatus(listing.listingStatus),
    completion: listingCompletionPercentage({
      ...listing,
      imageCount: listing.media.filter((item) => item.type === "image")
        .length,
    }),
  };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const requestedStatus = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      48,
      Math.max(1, Number(searchParams.get("limit") || "12") || 12)
    );

    const where = {
      ownerUserId: user.id,
      ...(requestedStatus && requestedStatus !== "all"
        ? { listingStatus: normalizeListingStatus(requestedStatus) }
        : {}),
      ...(search
        ? {
            OR: [
              { titleEn: { contains: search, mode: "insensitive" as const } },
              { titleAr: { contains: search, mode: "insensitive" as const } },
              { cityEn: { contains: search, mode: "insensitive" as const } },
              { cityAr: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [listings, total, groupedStatuses] = await Promise.all([
      db.property.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: listingInclude,
      }),
      db.property.count({ where }),
      db.property.groupBy({
        by: ["listingStatus"],
        where: { ownerUserId: user.id },
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(
      groupedStatuses.map((row) => [row.listingStatus, row._count._all])
    );

    return NextResponse.json({
      listings: listings.map(listingResponse),
      total,
      counts,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to load account listings:", error);
    return NextResponse.json(
      { error: "Failed to load your listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const limit = checkRateLimit(request, "account-listing-create", {
    limit: 30,
    windowMs: 60 * 60 * 1_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many listing requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const parsed = accountListingCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid listing data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const ownedCount = await db.property.count({
      where: { ownerUserId: user.id, listingStatus: { not: "archived" } },
    });
    if (ownedCount >= MAX_OWNED_LISTINGS) {
      return NextResponse.json(
        { error: `You can manage up to ${MAX_OWNED_LISTINGS} active listings.` },
        { status: 409 }
      );
    }

    const externalUrls = Array.from(
      new Set(
        parsed.data.externalMediaUrls.map((value) =>
          normalizeExternalMediaUrl(value)
        )
      )
    );
    const submitting = parsed.data.action === "submit";
    const issues = submitting
      ? validateListingForSubmission({
          ...parsed.data.listing,
          imageCount: externalUrls.filter(
            (url) => inferExternalMediaType(url) === "image"
          ).length,
        })
      : [];

    if (issues.length) {
      return NextResponse.json(
        { error: "The listing is not ready for review", issues },
        { status: 400 }
      );
    }

    const agent = await resolveAgentForUser(user);
    const listingStatus = submitting ? "pending_review" : "draft";
    const images = externalUrls
      .filter((url) => inferExternalMediaType(url) === "image")
      .join(",");

    const listing = await db.$transaction(async (transaction) => {
      const created = await transaction.property.create({
        data: {
          ...propertyDraftData(parsed.data.listing),
          images,
          featured: false,
          badge: null,
          agentId: agent?.id || null,
          ownerUserId: user.id,
          createdByUserId: user.id,
          listingStatus,
          submittedAt: submitting ? new Date() : null,
          media: {
            create: externalUrls.map((url, index) => ({
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
              action: submitting ? "listing_created_and_submitted" : "listing_created",
              previousStatus: null,
              newStatus: listingStatus,
              metadata: {
                mediaCount: externalUrls.length,
                source: "account",
              },
            },
          },
        },
        include: listingInclude,
      });
      return created;
    });

    return NextResponse.json(
      { listing: listingResponse(listing) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create account listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
