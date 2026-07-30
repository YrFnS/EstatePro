import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  getPropertyPagination,
} from "@/lib/property-filters";
import {
  listingCompletionPercentage,
  normalizeListingStatus,
} from "@/lib/listing-lifecycle";
import {
  listingAgentSelect,
  listingOwnerSelect,
} from "@/lib/listing-access";
import { propertyMediaSelect } from "@/lib/property-media";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const where = buildPropertyWhere(searchParams, {
      includeUnpublished: true,
    });
    const { page, limit, skip } = getPropertyPagination(searchParams);
    const requestedStatus = searchParams.get("listingStatus");
    const orderBy = requestedStatus === "pending_review"
      ? { submittedAt: "asc" as const }
      : buildPropertyOrderBy(searchParams.get("sort"));

    const [listings, total, groupedStatuses] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: { select: listingOwnerSelect },
          agent: { select: listingAgentSelect },
          media: {
            orderBy: { sortOrder: "asc" },
            select: propertyMediaSelect,
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
          _count: {
            select: {
              inquiries: true,
              reviews: true,
              favoritedBy: true,
            },
          },
        },
      }),
      db.property.count({ where }),
      db.property.groupBy({
        by: ["listingStatus"],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      listings: listings.map((listing) => ({
        ...listing,
        listingStatus: normalizeListingStatus(listing.listingStatus),
        completion: listingCompletionPercentage({
          ...listing,
          imageCount: listing.media.filter(
            (item) => item.type === "image"
          ).length,
        }),
      })),
      counts: Object.fromEntries(
        groupedStatuses.map((row) => [
          row.listingStatus,
          row._count._all,
        ])
      ),
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to load moderation queue:", error);
    return NextResponse.json(
      { error: "Failed to load listing moderation queue" },
      { status: 500 }
    );
  }
}
