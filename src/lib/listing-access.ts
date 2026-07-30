import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/api-auth";

export const listingOwnerSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} as const;

export const listingAgentSelect = {
  id: true,
  nameEn: true,
  nameAr: true,
  email: true,
  phone: true,
  image: true,
} as const;

export async function findManagedListing(
  id: string,
  user: CurrentUser
) {
  const listing = await db.property.findUnique({
    where: { id },
    include: {
      owner: { select: listingOwnerSelect },
      agent: { select: listingAgentSelect },
      media: { orderBy: { sortOrder: "asc" } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      _count: {
        select: {
          inquiries: true,
          reviews: true,
          favoritedBy: true,
        },
      },
    },
  });

  if (!listing) return null;
  const isAdmin = user.role === "admin";
  const isOwner = listing.ownerUserId === user.id;
  const isAssignedAgent =
    user.role === "agent" &&
    listing.agent?.email.toLowerCase() === user.email.toLowerCase();

  return isAdmin || isOwner || isAssignedAgent ? listing : null;
}

export async function resolveAgentForUser(user: CurrentUser) {
  if (user.role !== "agent") return null;
  return db.agent.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { id: true },
  });
}

export async function auditListing(input: {
  propertyId: string;
  user: CurrentUser;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return db.propertyAuditLog.create({
    data: {
      propertyId: input.propertyId,
      actorUserId: input.user.id,
      actorName: input.user.name,
      action: input.action,
      previousStatus: input.previousStatus || null,
      newStatus: input.newStatus || null,
      metadata: input.metadata || undefined,
    },
  });
}
