import { db } from "@/lib/db";

export interface ScheduledListingResult {
  scanned: number;
  published: number;
  skipped: number;
  failed: number;
  errors: Array<{ listingId: string; message: string }>;
}

export async function publishScheduledListings(
  limit = 100,
  now = new Date()
): Promise<ScheduledListingResult> {
  const due = await db.property.findMany({
    where: {
      listingStatus: "scheduled",
      scheduledPublishAt: { lte: now },
    },
    orderBy: { scheduledPublishAt: "asc" },
    take: Math.min(500, Math.max(1, limit)),
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      ownerUserId: true,
      scheduledPublishAt: true,
    },
  });

  const result: ScheduledListingResult = {
    scanned: due.length,
    published: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const listing of due) {
    try {
      const published = await db.$transaction(async (transaction) => {
        const claimed = await transaction.property.updateMany({
          where: {
            id: listing.id,
            listingStatus: "scheduled",
            scheduledPublishAt: { lte: now },
          },
          data: {
            listingStatus: "published",
            publishedAt: now,
            scheduledPublishAt: null,
          },
        });
        if (!claimed.count) return false;

        await transaction.propertyAuditLog.create({
          data: {
            propertyId: listing.id,
            actorName: "Listing scheduler",
            action: "listing_published_automatically",
            previousStatus: "scheduled",
            newStatus: "published",
            metadata: {
              scheduledFor:
                listing.scheduledPublishAt?.toISOString() || null,
              publishedAt: now.toISOString(),
            },
          },
        });

        if (listing.ownerUserId) {
          await transaction.userNotification.create({
            data: {
              userId: listing.ownerUserId,
              sourceId: `listing-published:${listing.id}:${now.getTime()}`,
              type: "property",
              title: "Listing published",
              message: `“${
                listing.titleEn || listing.titleAr || "Your listing"
              }” is now live.`,
              actionUrl: `/properties/${encodeURIComponent(listing.id)}`,
            },
          });
        }
        return true;
      });

      if (published) result.published += 1;
      else result.skipped += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        listingId: listing.id,
        message:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
