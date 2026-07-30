import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { synchronizeSavedSearchPropertyAlerts } from "@/lib/property-alert-saved-search-sync";
import {
  type AccountPropertyAlert,
  normalizePropertyAlertFilters,
  normalizePropertyAlertFrequency,
} from "@/lib/property-alerts";

export const propertyAlertInclude = {
  matches: {
    orderBy: { matchedAt: "desc" },
    take: 8,
    include: {
      property: {
        select: {
          id: true,
          titleEn: true,
          titleAr: true,
          price: true,
          status: true,
          type: true,
          locationEn: true,
          locationAr: true,
          images: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.PropertyAlertInclude;

export type PropertyAlertRecord = Prisma.PropertyAlertGetPayload<{
  include: typeof propertyAlertInclude;
}>;

export function serializePropertyAlert(
  alert: PropertyAlertRecord
): AccountPropertyAlert {
  return {
    id: alert.id,
    savedSearchId: alert.savedSearchId,
    name: alert.name,
    filters: normalizePropertyAlertFilters(alert.filters),
    frequency: normalizePropertyAlertFrequency(alert.frequency),
    enabled: alert.enabled,
    currentMatchCount: alert.currentMatchCount,
    lastRunAt: alert.lastRunAt?.toISOString() || null,
    lastMatchedAt: alert.lastMatchedAt?.toISOString() || null,
    nextRunAt: alert.nextRunAt?.toISOString() || null,
    lastError: alert.lastError,
    createdAt: alert.createdAt.toISOString(),
    updatedAt: alert.updatedAt.toISOString(),
    recentMatches: alert.matches.map((match) => ({
      id: match.id,
      matchedAt: match.matchedAt.toISOString(),
      property: {
        ...match.property,
        createdAt: match.property.createdAt.toISOString(),
        updatedAt: match.property.updatedAt.toISOString(),
      },
    })),
  };
}

export async function listPropertyAlerts(
  userId: string
): Promise<AccountPropertyAlert[]> {
  await synchronizeSavedSearchPropertyAlerts({ userId });

  const alerts = await db.propertyAlert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: propertyAlertInclude,
  });

  return alerts.map(serializePropertyAlert);
}
