import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/api-auth";
import { findManagedListing } from "@/lib/listing-access";
import {
  canOwnerEdit,
  listingCompletionPercentage,
  normalizeListingStatus,
  validateListingForSubmission,
} from "@/lib/listing-lifecycle";
import {
  accountListingUpdateSchema,
  propertyDraftData,
} from "@/lib/property-input";

function enrichListing<T extends {
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
  const imageCount = listing.media.filter(
    (item) => item.type === "image"
  ).length;
  return {
    ...listing,
    listingStatus: normalizeListingStatus(listing.listingStatus),
    completion: listingCompletionPercentage({ ...listing, imageCount }),
    submissionIssues: validateListingForSubmission({
      ...listing,
      imageCount,
    }),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const listing = await findManagedListing(id, user);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ listing: enrichListing(listing) });
  } catch (error) {
    console.error("Failed to load account listing:", error);
    return NextResponse.json(
      { error: "Failed to load listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const existing = await findManagedListing(id, user);
    if (!existing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const currentStatus = normalizeListingStatus(
      existing.listingStatus
    );
    if (user.role !== "admin" && !canOwnerEdit(currentStatus)) {
      return forbidden(
        "This listing cannot be edited in its current state. Withdraw, duplicate, or ask an administrator to return it for changes."
      );
    }

    const parsed = accountListingUpdateSchema.safeParse(
      await request.json()
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid listing data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.property.update({
        where: { id },
        data: propertyDraftData(parsed.data.listing),
      });
      await transaction.propertyAuditLog.create({
        data: {
          propertyId: id,
          actorUserId: user.id,
          actorName: user.name,
          action: "listing_updated",
          previousStatus: currentStatus,
          newStatus: currentStatus,
          metadata: {
            source: user.role === "admin" ? "admin_preview" : "owner",
          },
        },
      });
    });

    const listing = await findManagedListing(id, user);
    return NextResponse.json({
      listing: listing ? enrichListing(listing) : null,
    });
  } catch (error) {
    console.error("Failed to update account listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const listing = await findManagedListing(id, user);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const status = normalizeListingStatus(listing.listingStatus);
    if (
      user.role !== "admin" &&
      !["draft", "changes_requested", "rejected"].includes(status)
    ) {
      return forbidden(
        "Only drafts, rejected listings, and returned listings can be permanently deleted."
      );
    }

    await db.$transaction([
      db.review.deleteMany({ where: { propertyId: id } }),
      db.inquiry.updateMany({
        where: { propertyId: id },
        data: { propertyId: null },
      }),
      db.conversation.updateMany({
        where: { propertyId: id },
        data: { propertyId: null },
      }),
      db.property.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete account listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
