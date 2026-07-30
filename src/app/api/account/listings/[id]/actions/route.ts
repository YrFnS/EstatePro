import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/api-auth";
import { findManagedListing } from "@/lib/listing-access";
import {
  canOwnerArchive,
  canOwnerSubmit,
  canOwnerWithdraw,
  normalizeListingStatus,
  validateListingForSubmission,
} from "@/lib/listing-lifecycle";

const actionSchema = z.object({
  action: z.enum([
    "submit",
    "archive",
    "restore",
    "withdraw",
    "duplicate",
  ]),
});

async function notifyAdministrators(input: {
  propertyId: string;
  title: string;
  ownerName: string;
  submittedAt: Date;
}) {
  const administrators = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  if (!administrators.length) return;

  await db.userNotification.createMany({
    data: administrators.map((administrator) => ({
      userId: administrator.id,
      sourceId: `listing-submitted:${input.propertyId}:${input.submittedAt.getTime()}`,
      type: "property",
      title: "Listing awaiting review",
      message: `${input.ownerName} submitted “${input.title}” for moderation.`,
      actionUrl: `/admin?section=moderation&listing=${encodeURIComponent(
        input.propertyId
      )}`,
    })),
    skipDuplicates: true,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid listing action" },
        { status: 400 }
      );
    }

    const listing = await findManagedListing(id, user);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const currentStatus = normalizeListingStatus(
      listing.listingStatus
    );
    const action = parsed.data.action;

    if (action === "submit") {
      if (
        user.role !== "admin" &&
        !canOwnerSubmit(currentStatus)
      ) {
        return forbidden(
          "This listing cannot be submitted in its current state."
        );
      }

      const imageCount = listing.media.filter(
        (item) => item.type === "image"
      ).length;
      const issues = validateListingForSubmission({
        ...listing,
        imageCount,
      });
      if (issues.length) {
        return NextResponse.json(
          { error: "The listing is not ready for review", issues },
          { status: 400 }
        );
      }

      const submittedAt = new Date();
      const updated = await db.$transaction(async (transaction) => {
        const result = await transaction.property.update({
          where: { id },
          data: {
            listingStatus: "pending_review",
            submittedAt,
            reviewedAt: null,
            reviewedByUserId: null,
            rejectedAt: null,
            archivedAt: null,
            scheduledPublishAt: null,
          },
        });
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "listing_submitted",
            previousStatus: currentStatus,
            newStatus: "pending_review",
            metadata: { imageCount },
          },
        });
        return result;
      });

      await notifyAdministrators({
        propertyId: id,
        title: listing.titleEn || listing.titleAr || "Untitled listing",
        ownerName: user.name,
        submittedAt,
      });

      return NextResponse.json({ listing: updated });
    }

    if (action === "archive") {
      if (
        user.role !== "admin" &&
        !canOwnerArchive(currentStatus)
      ) {
        return forbidden(
          "This listing cannot be archived in its current state."
        );
      }
      const archivedAt = new Date();
      const updated = await db.$transaction(async (transaction) => {
        const result = await transaction.property.update({
          where: { id },
          data: {
            listingStatus: "archived",
            archivedAt,
            scheduledPublishAt: null,
          },
        });
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "listing_archived",
            previousStatus: currentStatus,
            newStatus: "archived",
          },
        });
        return result;
      });
      return NextResponse.json({ listing: updated });
    }

    if (action === "restore") {
      if (currentStatus !== "archived") {
        return forbidden("Only archived listings can be restored.");
      }
      const updated = await db.$transaction(async (transaction) => {
        const result = await transaction.property.update({
          where: { id },
          data: {
            listingStatus: "draft",
            archivedAt: null,
            reviewNotes: null,
          },
        });
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "listing_restored",
            previousStatus: "archived",
            newStatus: "draft",
          },
        });
        return result;
      });
      return NextResponse.json({ listing: updated });
    }

    if (action === "withdraw") {
      if (
        user.role !== "admin" &&
        !canOwnerWithdraw(currentStatus)
      ) {
        return forbidden("Only a pending listing can be withdrawn.");
      }
      const updated = await db.$transaction(async (transaction) => {
        const result = await transaction.property.update({
          where: { id },
          data: {
            listingStatus: "draft",
            submittedAt: null,
          },
        });
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "listing_withdrawn",
            previousStatus: currentStatus,
            newStatus: "draft",
          },
        });
        return result;
      });
      return NextResponse.json({ listing: updated });
    }

    const duplicated = await db.$transaction(async (transaction) => {
      const copy = await transaction.property.create({
        data: {
          titleEn: `${listing.titleEn} (Copy)`.slice(0, 160),
          titleAr: `${listing.titleAr} (نسخة)`.slice(0, 160),
          descriptionEn: listing.descriptionEn,
          descriptionAr: listing.descriptionAr,
          price: listing.price,
          type: listing.type,
          status: listing.status,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area: listing.area,
          locationEn: listing.locationEn,
          locationAr: listing.locationAr,
          addressEn: listing.addressEn,
          addressAr: listing.addressAr,
          cityEn: listing.cityEn,
          cityAr: listing.cityAr,
          images: listing.images,
          features: listing.features,
          yearBuilt: listing.yearBuilt,
          parking: listing.parking,
          featured: false,
          badge: null,
          lat: listing.lat,
          lng: listing.lng,
          virtualTourUrl: listing.virtualTourUrl,
          virtualTourImages: listing.virtualTourImages,
          agentId: listing.agentId,
          ownerUserId: user.id,
          createdByUserId: user.id,
          listingStatus: "draft",
          media: {
            create: listing.media.map((item) => ({
              url: item.url,
              storageKey: null,
              source: "external",
              type: item.type,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              width: item.width,
              height: item.height,
              sortOrder: item.sortOrder,
              isCover: item.isCover,
            })),
          },
          auditLogs: {
            create: {
              actorUserId: user.id,
              actorName: user.name,
              action: "listing_duplicated",
              previousStatus: null,
              newStatus: "draft",
              metadata: { sourcePropertyId: listing.id },
            },
          },
        },
        include: {
          media: { orderBy: { sortOrder: "asc" } },
        },
      });
      return copy;
    });

    return NextResponse.json(
      { listing: duplicated },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to apply listing action:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}
