import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { adminListingInputSchema, propertyDraftData } from "@/lib/property-input";
import {
  ensurePropertyCover,
  inferExternalMediaType,
  normalizeExternalMediaUrl,
  propertyMediaSelect,
  syncPropertyMediaSnapshot,
} from "@/lib/property-media";
import { deleteStoredObject } from "@/lib/object-storage";

const updatePropertySchema = adminListingInputSchema.omit({
  ownerUserId: true,
  listingStatus: true,
  reviewNotes: true,
  scheduledPublishAt: true,
});

function adminSession(request: NextRequest) {
  return verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    request.cookies.get(ADMIN_NONCE_COOKIE)?.value
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      include: {
        agent: true,
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          select: propertyMediaSelect,
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
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
  const session = adminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const existing = await db.property.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            url: true,
            source: true,
            type: true,
            isCover: true,
            sortOrder: true,
          },
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const input = parsed.data;
    if (input.agentId) {
      const agentExists = await db.agent.count({
        where: { id: input.agentId },
      });
      if (!agentExists) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 400 }
        );
      }
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

    const requestedUrls = Array.from(
      new Set(
        (input as typeof input & { images?: string }).images
          ?.split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map(normalizeExternalMediaUrl) || []
      )
    );
    const uploadedUrls = new Set(
      existing.media
        .filter((item) => item.source === "upload")
        .map((item) => item.url)
    );
    const externalUrls = requestedUrls.filter(
      (url) => !uploadedUrls.has(url)
    );

    await db.$transaction(async (transaction) => {
      await transaction.property.update({
        where: { id },
        data: {
          ...propertyDraftData(input),
          featured: input.featured,
          badge: input.badge || null,
          agentId: input.agentId || null,
        },
      });

      await transaction.propertyMedia.deleteMany({
        where: { propertyId: id, source: "external" },
      });
      const uploads = await transaction.propertyMedia.findMany({
        where: { propertyId: id, source: "upload" },
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true, isCover: true },
      });
      const hasUploadCover = uploads.some(
        (item) => item.type === "image" && item.isCover
      );
      if (externalUrls.length) {
        await transaction.propertyMedia.createMany({
          data: externalUrls.map((url, index) => ({
            propertyId: id,
            url,
            source: "external",
            type: inferExternalMediaType(url),
            sortOrder: uploads.length + index,
            isCover:
              !hasUploadCover &&
              index === 0 &&
              inferExternalMediaType(url) === "image",
          })),
        });
      }
      await ensurePropertyCover(transaction, id);
      await syncPropertyMediaSnapshot(transaction, id);
      await transaction.propertyAuditLog.create({
        data: {
          propertyId: id,
          actorUserId: administrator.id,
          actorName: administrator.name,
          action: "listing_updated_by_admin",
          previousStatus: existing.listingStatus,
          newStatus: existing.listingStatus,
          metadata: { source: "admin_property_manager" },
        },
      });
    });

    const property = await db.property.findUnique({
      where: { id },
      include: {
        agent: true,
        owner: { select: { id: true, name: true, email: true } },
        media: {
          orderBy: { sortOrder: "asc" },
          select: propertyMediaSelect,
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Admin property update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update property",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = adminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const storedMedia = await db.propertyMedia.findMany({
      where: { propertyId: id, storageKey: { not: null } },
      select: { storageKey: true },
    });

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

    Promise.allSettled(
      storedMedia
        .map((item) => item.storageKey)
        .filter((key): key is string => Boolean(key))
        .map(deleteStoredObject)
    ).catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin property deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
