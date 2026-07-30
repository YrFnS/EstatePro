import type { Prisma, PropertyAlert } from "@prisma/client";
import { db } from "@/lib/db";
import { MAX_NOTIFICATIONS } from "@/lib/account-state";
import { buildPropertyWhere } from "@/lib/property-filters";
import { synchronizeSavedSearchPropertyAlerts } from "@/lib/property-alert-saved-search-sync";
import {
  MAX_ALERT_MATCHES_PER_RUN,
  MAX_ALERT_MATCH_HISTORY,
  MAX_ALERT_NOTIFICATIONS_PER_RUN,
  nextPropertyAlertRun,
  normalizePropertyAlertFilters,
  normalizePropertyAlertFrequency,
  propertyAlertResultsUrl,
  propertyAlertSearchParams,
} from "@/lib/property-alerts";

export interface PropertyAlertRunResult {
  alertId: string;
  alertName: string;
  userId: string;
  firstRun: boolean;
  currentMatchCount: number;
  newMatchCount: number;
  notificationsCreated: number;
  truncated: boolean;
  error?: string;
}

export interface ProcessPropertyAlertsResult {
  processed: number;
  succeeded: number;
  failed: number;
  newMatches: number;
  notificationsCreated: number;
  results: PropertyAlertRunResult[];
}

interface ProcessPropertyAlertsOptions {
  now?: Date;
  limit?: number;
  alertIds?: string[];
  userId?: string;
  force?: boolean;
}

const candidateSelect = {
  id: true,
  titleEn: true,
  price: true,
  status: true,
  locationEn: true,
  updatedAt: true,
} as const;

function notificationDataForProperty(
  alert: PropertyAlert,
  property: {
    id: string;
    titleEn: string;
    price: number;
    status: string;
    locationEn: string;
  }
) {
  const price = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(property.price);
  const suffix = property.status === "rent" ? "/month" : "";

  return {
    userId: alert.userId,
    sourceId: `property-alert:${alert.id}:${property.id}`,
    type: "search",
    title: `New match: ${property.titleEn}`,
    message: `${alert.name} matched a property in ${property.locationEn} for $${price}${suffix}.`,
    actionUrl: `/properties/${property.id}`,
    read: false,
  };
}

async function trimNotificationHistory(userId: string): Promise<void> {
  const stale = await db.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: MAX_NOTIFICATIONS,
    select: { id: true },
  });

  if (stale.length) {
    await db.userNotification.deleteMany({
      where: {
        userId,
        id: { in: stale.map((item) => item.id) },
      },
    });
  }
}

async function trimMatchHistory(alertId: string): Promise<void> {
  const stale = await db.propertyAlertMatch.findMany({
    where: { alertId },
    orderBy: { matchedAt: "desc" },
    skip: MAX_ALERT_MATCH_HISTORY,
    select: { id: true },
  });

  if (stale.length) {
    await db.propertyAlertMatch.deleteMany({
      where: {
        alertId,
        id: { in: stale.map((item) => item.id) },
      },
    });
  }
}

async function processOneAlert(
  alert: PropertyAlert,
  now: Date
): Promise<PropertyAlertRunResult> {
  const firstRun = alert.lastRunAt === null;
  const frequency = normalizePropertyAlertFrequency(alert.frequency);
  const filters = normalizePropertyAlertFilters(alert.filters);
  const baseWhere = buildPropertyWhere(propertyAlertSearchParams(filters));

  try {
    const currentMatchCount = await db.property.count({
      where: baseWhere,
    });

    const candidateWhere: Prisma.PropertyWhereInput = firstRun
      ? baseWhere
      : {
          AND: [
            baseWhere,
            {
              updatedAt: {
                gt: alert.lastRunAt || alert.createdAt,
              },
            },
          ],
        };

    const candidates = await db.property.findMany({
      where: candidateWhere,
      orderBy: firstRun
        ? { createdAt: "desc" }
        : [{ updatedAt: "asc" }, { id: "asc" }],
      take: MAX_ALERT_MATCHES_PER_RUN,
      select: candidateSelect,
    });

    const existing =
      candidates.length === 0
        ? []
        : await db.propertyAlertMatch.findMany({
            where: {
              alertId: alert.id,
              propertyId: {
                in: candidates.map((property) => property.id),
              },
            },
            select: { propertyId: true },
          });

    const existingIds = new Set(
      existing.map((match) => match.propertyId)
    );
    const newCandidates = candidates.filter(
      (property) => !existingIds.has(property.id)
    );

    const notifications: Prisma.UserNotificationCreateManyInput[] = [];

    if (firstRun) {
      notifications.push({
        userId: alert.userId,
        sourceId: `property-alert:${alert.id}:activated`,
        type: "search",
        title: `Property alert activated: ${alert.name}`,
        message:
          currentMatchCount === 0
            ? "Your alert is active. We will notify you when a matching property is added."
            : `${currentMatchCount} current properties match this alert. We will notify you about new matches.`,
        actionUrl: propertyAlertResultsUrl(filters),
        read: false,
      });
    } else {
      notifications.push(
        ...newCandidates
          .slice(0, MAX_ALERT_NOTIFICATIONS_PER_RUN)
          .map((property) =>
            notificationDataForProperty(alert, property)
          )
      );

      if (
        newCandidates.length > MAX_ALERT_NOTIFICATIONS_PER_RUN
      ) {
        notifications.push({
          userId: alert.userId,
          sourceId: `property-alert:${alert.id}:batch:${now.getTime()}`,
          type: "search",
          title: `${newCandidates.length} new matches: ${alert.name}`,
          message: "More matching properties are available. Open the alert results to review all of them.",
          actionUrl: propertyAlertResultsUrl(filters),
          read: false,
        });
      }
    }

    const truncated =
      candidates.length >= MAX_ALERT_MATCHES_PER_RUN;
    const lastProcessedAt =
      !firstRun && truncated && candidates.length
        ? candidates[candidates.length - 1].updatedAt
        : now;
    const nextRunAt = truncated
      ? new Date(now.getTime() + 60_000)
      : nextPropertyAlertRun(frequency, now);

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (newCandidates.length) {
      operations.push(
        db.propertyAlertMatch.createMany({
          data: newCandidates.map((property) => ({
            alertId: alert.id,
            propertyId: property.id,
            matchedAt: now,
          })),
          skipDuplicates: true,
        })
      );
    }

    if (notifications.length) {
      operations.push(
        db.userNotification.createMany({
          data: notifications,
          skipDuplicates: true,
        })
      );
    }

    operations.push(
      db.propertyAlert.update({
        where: { id: alert.id },
        data: {
          currentMatchCount,
          lastRunAt: lastProcessedAt,
          lastMatchedAt: newCandidates.length
            ? now
            : alert.lastMatchedAt,
          nextRunAt,
          lastError: null,
        },
      })
    );

    await db.$transaction(operations);
    await Promise.all([
      trimMatchHistory(alert.id),
      trimNotificationHistory(alert.userId),
    ]);

    return {
      alertId: alert.id,
      alertName: alert.name,
      userId: alert.userId,
      firstRun,
      currentMatchCount,
      newMatchCount: firstRun ? 0 : newCandidates.length,
      notificationsCreated: notifications.length,
      truncated,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 1_000)
        : "Unknown alert processing error";

    try {
      await db.propertyAlert.update({
        where: { id: alert.id },
        data: {
          lastError: message,
          nextRunAt: new Date(now.getTime() + 15 * 60 * 1000),
        },
      });
    } catch {
      // Preserve the original processing error.
    }

    return {
      alertId: alert.id,
      alertName: alert.name,
      userId: alert.userId,
      firstRun,
      currentMatchCount: alert.currentMatchCount,
      newMatchCount: 0,
      notificationsCreated: 0,
      truncated: false,
      error: message,
    };
  }
}

export async function processPropertyAlerts(
  options: ProcessPropertyAlertsOptions = {}
): Promise<ProcessPropertyAlertsResult> {
  const now = options.now || new Date();
  const limit = Math.min(500, Math.max(1, options.limit || 100));

  await synchronizeSavedSearchPropertyAlerts({
    userId: options.userId,
    now,
    limit,
  });

  const alerts = await db.propertyAlert.findMany({
    where: {
      enabled: true,
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.alertIds?.length
        ? { id: { in: options.alertIds } }
        : {}),
      ...(!options.force
        ? {
            OR: [
              { nextRunAt: null },
              { nextRunAt: { lte: now } },
            ],
          }
        : {}),
    },
    orderBy: [
      { nextRunAt: "asc" },
      { createdAt: "asc" },
    ],
    take: limit,
  });

  const results: PropertyAlertRunResult[] = [];

  for (const alert of alerts) {
    results.push(await processOneAlert(alert, now));
  }

  return {
    processed: results.length,
    succeeded: results.filter((result) => !result.error).length,
    failed: results.filter((result) => Boolean(result.error)).length,
    newMatches: results.reduce(
      (total, result) => total + result.newMatchCount,
      0
    ),
    notificationsCreated: results.reduce(
      (total, result) => total + result.notificationsCreated,
      0
    ),
    results,
  };
}
