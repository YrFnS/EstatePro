import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-auth";
import {
  canAdminTransition,
  normalizeListingStatus,
  scheduledPublicationStatus,
  validateListingForSubmission,
  type ListingStatus,
} from "@/lib/listing-lifecycle";

const moderationSchema = z.object({
  action: z.enum([
    "approve",
    "request_changes",
    "reject",
    "schedule",
    "archive",
    "reopen",
  ]),
  reviewNotes: z.string().trim().max(5_000).optional().default(""),
  publishAt: z.coerce.date().optional(),
});

function adminSession(request: NextRequest) {
  return verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    request.cookies.get(ADMIN_NONCE_COOKIE)?.value
  );
}

function targetStatus(input: z.infer<typeof moderationSchema>): ListingStatus {
  switch (input.action) {
    case "approve":
      return "published";
    case "request_changes":
      return "changes_requested";
    case "reject":
      return "rejected";
    case "schedule":
      return scheduledPublicationStatus(input.publishAt);
    case "archive":
      return "archived";
    case "reopen":
      return "pending_review";
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = adminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const parsed = moderationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid moderation request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (
      ["request_changes", "reject"].includes(parsed.data.action) &&
      parsed.data.reviewNotes.length < 3
    ) {
      return NextResponse.json(
        { error: "Review notes are required for this action." },
        { status: 400 }
      );
    }

    if (parsed.data.action === "schedule") {
      if (!parsed.data.publishAt) {
        return NextResponse.json(
          { error: "Choose a publication date and time." },
          { status: 400 }
        );
      }
      if (parsed.data.publishAt.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "The scheduled publication time must be in the future." },
          { status: 400 }
        );
      }
      if (
        parsed.data.publishAt.getTime() >
        Date.now() + 365 * 24 * 60 * 60 * 1_000
      ) {
        return NextResponse.json(
          { error: "Listings can be scheduled up to one year ahead." },
          { status: 400 }
        );
      }
    }

    const listing = await db.property.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: "asc" } },
        owner: { select: { id: true, name: true } },
      },
    });
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const previousStatus = normalizeListingStatus(
      listing.listingStatus
    );
    const nextStatus = targetStatus(parsed.data);
    if (!canAdminTransition(previousStatus, nextStatus)) {
      return NextResponse.json(
        {
          error: `A listing cannot move from ${previousStatus} to ${nextStatus}.`,
        },
        { status: 409 }
      );
    }

    if (nextStatus === "published" || nextStatus === "scheduled") {
      const issues = validateListingForSubmission({
        ...listing,
        imageCount: listing.media.filter(
          (item) => item.type === "image"
        ).length,
      });
      if (issues.length) {
        return NextResponse.json(
          { error: "The listing is incomplete", issues },
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

    const now = new Date();
    const scheduledAt =
      nextStatus === "scheduled" ? parsed.data.publishAt! : null;
    const publishedAt = nextStatus === "published" ? now : null;
    const rejectedAt = nextStatus === "rejected" ? now : null;
    const archivedAt = nextStatus === "archived" ? now : null;

    const updated = await db.$transaction(async (transaction) => {
      const result = await transaction.property.update({
        where: { id },
        data: {
          listingStatus: nextStatus,
          reviewedByUserId: administrator.id,
          reviewedAt: now,
          reviewNotes: parsed.data.reviewNotes || null,
          scheduledPublishAt: scheduledAt,
          publishedAt:
            nextStatus === "published"
              ? publishedAt
              : listing.publishedAt,
          rejectedAt,
          archivedAt,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          agent: true,
          media: { orderBy: { sortOrder: "asc" } },
        },
      });

      await transaction.propertyAuditLog.create({
        data: {
          propertyId: id,
          actorUserId: administrator.id,
          actorName: administrator.name,
          action: `listing_${parsed.data.action}`,
          previousStatus,
          newStatus: nextStatus,
          metadata: {
            reviewNotes: parsed.data.reviewNotes || null,
            publishAt: scheduledAt?.toISOString() || null,
          },
        },
      });

      if (listing.ownerUserId) {
        const title = listing.titleEn || listing.titleAr || "Your listing";
        const messages: Record<ListingStatus, string> = {
          draft: `${title} is now a draft.`,
          pending_review: `${title} is back in the review queue.`,
          changes_requested: `Changes were requested for ${title}.`,
          scheduled: `${title} is approved and scheduled for publication.`,
          published: `${title} has been published.`,
          rejected: `${title} was not approved.`,
          archived: `${title} has been archived.`,
        };
        await transaction.userNotification.create({
          data: {
            userId: listing.ownerUserId,
            sourceId: `listing-review:${id}:${now.getTime()}`,
            type: "property",
            title: "Listing review update",
            message: messages[nextStatus],
            actionUrl: `/my-listings?listing=${encodeURIComponent(id)}`,
          },
        });
      }

      return result;
    });

    return NextResponse.json({ listing: updated });
  } catch (error) {
    console.error("Failed to moderate listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing review" },
      { status: 500 }
    );
  }
}
