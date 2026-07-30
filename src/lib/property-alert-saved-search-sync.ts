import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizePropertyAlertFilters } from "@/lib/property-alerts";

interface SyncSavedSearchAlertsOptions {
  userId?: string;
  now?: Date;
  limit?: number;
}

export async function synchronizeSavedSearchPropertyAlerts(
  options: SyncSavedSearchAlertsOptions = {}
): Promise<{ created: number; updated: number }> {
  const now = options.now || new Date();
  const limit = Math.min(500, Math.max(1, options.limit || 250));

  const [missing, linked] = await Promise.all([
    db.savedSearch.findMany({
      where: {
        ...(options.userId ? { userId: options.userId } : {}),
        notificationsEnabled: true,
        propertyAlert: { is: null },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        name: true,
        filters: true,
      },
    }),
    db.savedSearch.findMany({
      where: {
        ...(options.userId ? { userId: options.userId } : {}),
        propertyAlert: { isNot: null },
      },
      take: limit,
      select: {
        notificationsEnabled: true,
        propertyAlert: {
          select: { id: true, enabled: true },
        },
      },
    }),
  ]);

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const search of missing) {
    const filters = normalizePropertyAlertFilters(search.filters);
    if (!Object.keys(filters).length) continue;

    operations.push(
      db.propertyAlert.create({
        data: {
          userId: search.userId,
          savedSearchId: search.id,
          name: search.name,
          filters,
          signature: `saved-search:${search.id}`,
          frequency: "daily",
          enabled: true,
          nextRunAt: now,
        },
      })
    );
  }

  let updated = 0;
  for (const search of linked) {
    const alert = search.propertyAlert;
    if (!alert || alert.enabled === search.notificationsEnabled) {
      continue;
    }

    updated += 1;
    operations.push(
      db.propertyAlert.update({
        where: { id: alert.id },
        data: {
          enabled: search.notificationsEnabled,
          nextRunAt: search.notificationsEnabled ? now : null,
          lastError: null,
        },
      })
    );
  }

  if (operations.length) {
    await db.$transaction(operations);
  }

  return {
    created: missing.length,
    updated,
  };
}
