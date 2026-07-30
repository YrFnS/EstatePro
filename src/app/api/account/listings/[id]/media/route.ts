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
  canOwnerEdit,
  MEDIA_TYPES,
  normalizeListingStatus,
} from "@/lib/listing-lifecycle";
import {
  MAX_PROPERTY_MEDIA,
  ensurePropertyCover,
  inferExternalMediaType,
  nextMediaSortOrder,
  normalizeExternalMediaUrl,
  propertyMediaSelect,
  reorderPropertyMedia,
  syncPropertyMediaSnapshot,
} from "@/lib/property-media";
import {
  createUploadTarget,
  deleteStoredObject,
  isObjectStorageConfigured,
  ownsStorageKey,
  publicUrlForStorageKey,
  validateUpload,
} from "@/lib/object-storage";

const dimensionsSchema = {
  width: z.number().int().positive().max(100_000).nullable().optional(),
  height: z.number().int().positive().max(100_000).nullable().optional(),
};

const mediaActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add_url"),
    url: z.string().trim().url().max(2_000),
    type: z.enum(MEDIA_TYPES).optional(),
    mimeType: z.string().trim().max(200).nullable().optional(),
    ...dimensionsSchema,
  }),
  z.object({
    action: z.literal("presign"),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(200),
    sizeBytes: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("confirm_upload"),
    url: z.string().trim().url().max(2_000),
    storageKey: z.string().trim().min(1).max(1_000),
    mimeType: z.string().trim().min(1).max(200),
    sizeBytes: z.number().int().positive(),
    type: z.enum(MEDIA_TYPES),
    ...dimensionsSchema,
  }),
  z.object({
    action: z.literal("reorder"),
    orderedIds: z.array(z.string().trim().min(1)).max(MAX_PROPERTY_MEDIA),
    coverId: z.string().trim().min(1).nullable().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    mediaId: z.string().trim().min(1),
  }),
]);

function mediaResponse(propertyId: string) {
  return db.propertyMedia.findMany({
    where: { propertyId },
    orderBy: { sortOrder: "asc" },
    select: propertyMediaSelect,
  });
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
    return NextResponse.json({
      media: await mediaResponse(id),
      storageConfigured: isObjectStorageConfigured(),
      maxItems: MAX_PROPERTY_MEDIA,
    });
  } catch (error) {
    console.error("Failed to load listing media:", error);
    return NextResponse.json(
      { error: "Failed to load listing media" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
    if (user.role !== "admin" && !canOwnerEdit(status)) {
      return forbidden(
        "Media cannot be changed while this listing is under review, scheduled, or published."
      );
    }

    const parsed = mediaActionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid media request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (input.action === "presign") {
      if (listing.media.length >= MAX_PROPERTY_MEDIA) {
        return NextResponse.json(
          { error: `A listing can contain up to ${MAX_PROPERTY_MEDIA} media items.` },
          { status: 409 }
        );
      }
      const target = createUploadTarget({
        propertyId: id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
      return NextResponse.json({ target });
    }

    if (input.action === "add_url") {
      if (listing.media.length >= MAX_PROPERTY_MEDIA) {
        return NextResponse.json(
          { error: `A listing can contain up to ${MAX_PROPERTY_MEDIA} media items.` },
          { status: 409 }
        );
      }
      const url = normalizeExternalMediaUrl(input.url);
      const type = inferExternalMediaType(url, input.type);

      const media = await db.$transaction(async (transaction) => {
        const sortOrder = await nextMediaSortOrder(transaction, id);
        const imageCoverExists = listing.media.some(
          (item) => item.type === "image" && item.isCover
        );
        const created = await transaction.propertyMedia.create({
          data: {
            propertyId: id,
            url,
            source: "external",
            type,
            mimeType: input.mimeType || null,
            width: input.width ?? null,
            height: input.height ?? null,
            sortOrder,
            isCover: type === "image" && !imageCoverExists,
          },
          select: propertyMediaSelect,
        });
        await syncPropertyMediaSnapshot(transaction, id);
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "media_added",
            previousStatus: status,
            newStatus: status,
            metadata: { mediaId: created.id, source: "external", type },
          },
        });
        return created;
      });

      return NextResponse.json(
        { media, items: await mediaResponse(id) },
        { status: 201 }
      );
    }

    if (input.action === "confirm_upload") {
      if (listing.media.length >= MAX_PROPERTY_MEDIA) {
        return NextResponse.json(
          { error: `A listing can contain up to ${MAX_PROPERTY_MEDIA} media items.` },
          { status: 409 }
        );
      }
      if (!ownsStorageKey(id, input.storageKey)) {
        return NextResponse.json(
          { error: "The uploaded object does not belong to this listing." },
          { status: 400 }
        );
      }
      const uploadRule = validateUpload(input.mimeType, input.sizeBytes);
      if (
        input.type !== uploadRule.type &&
        !(input.type === "document" && uploadRule.type === "floorplan")
      ) {
        return NextResponse.json(
          { error: "The selected media type does not match the uploaded file." },
          { status: 400 }
        );
      }
      const url = normalizeExternalMediaUrl(input.url);
      const expectedUrl = normalizeExternalMediaUrl(
        publicUrlForStorageKey(input.storageKey)
      );
      if (url !== expectedUrl) {
        return NextResponse.json(
          { error: "The uploaded media URL does not match its signed storage key." },
          { status: 400 }
        );
      }

      const media = await db.$transaction(async (transaction) => {
        const sortOrder = await nextMediaSortOrder(transaction, id);
        const imageCoverExists = listing.media.some(
          (item) => item.type === "image" && item.isCover
        );
        const created = await transaction.propertyMedia.create({
          data: {
            propertyId: id,
            url,
            storageKey: input.storageKey,
            source: "upload",
            type: input.type,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            width: input.width ?? null,
            height: input.height ?? null,
            sortOrder,
            isCover: input.type === "image" && !imageCoverExists,
          },
          select: propertyMediaSelect,
        });
        await syncPropertyMediaSnapshot(transaction, id);
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "media_uploaded",
            previousStatus: status,
            newStatus: status,
            metadata: {
              mediaId: created.id,
              storageKey: input.storageKey,
              mimeType: input.mimeType,
              sizeBytes: input.sizeBytes,
            },
          },
        });
        return created;
      });

      return NextResponse.json(
        { media, items: await mediaResponse(id) },
        { status: 201 }
      );
    }

    if (input.action === "reorder") {
      const items = await db.$transaction(async (transaction) => {
        const reordered = await reorderPropertyMedia(
          transaction,
          id,
          input.orderedIds,
          input.coverId
        );
        await transaction.propertyAuditLog.create({
          data: {
            propertyId: id,
            actorUserId: user.id,
            actorName: user.name,
            action: "media_reordered",
            previousStatus: status,
            newStatus: status,
            metadata: {
              orderedIds: input.orderedIds,
              coverId: input.coverId || null,
            },
          },
        });
        return reordered;
      });
      return NextResponse.json({ items });
    }

    const media = await db.propertyMedia.findFirst({
      where: { id: input.mediaId, propertyId: id },
      select: { id: true, storageKey: true },
    });
    if (!media) {
      return NextResponse.json(
        { error: "Media item not found" },
        { status: 404 }
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.propertyMedia.delete({ where: { id: media.id } });
      await ensurePropertyCover(transaction, id);
      await syncPropertyMediaSnapshot(transaction, id);
      await transaction.propertyAuditLog.create({
        data: {
          propertyId: id,
          actorUserId: user.id,
          actorName: user.name,
          action: "media_deleted",
          previousStatus: status,
          newStatus: status,
          metadata: { mediaId: media.id },
        },
      });
    });

    if (media.storageKey) {
      deleteStoredObject(media.storageKey).catch((error) =>
        console.error("Failed to delete stored media:", error)
      );
    }

    return NextResponse.json({
      success: true,
      items: await mediaResponse(id),
    });
  } catch (error) {
    console.error("Failed to update listing media:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update listing media",
      },
      { status: 500 }
    );
  }
}
