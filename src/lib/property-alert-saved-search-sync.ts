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
): Promise<{ created: number; removed: number }> {
  const now = options.now || new Date();
  const limit = Math.min(500, Math.max(1, options.limit || 250));

  const [missing, disabled] = await Promise.all([
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
        notificationsEnabled: false,
        propertyAlert: { isNot: null },
      },
      take: limit,
      select: {
        propertyAlert: {
          select: { id: true },
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

  const disabledAlertIds = disabled.flatMap((search) =>
    search.propertyAlert ? [search.propertyAlert.id] : []
  );
  if (disabledAlertIds.length) {
    operations.push(
      db.propertyAlert.deleteMany({
        where: { id: { in: disabledAlertIds } },
      })
    );
  }

  if (operations.length) {
    await db.$transaction(operations);
  }

  return {
    created: missing.length,
    removed: disabledAlertIds.length,
  };
}
