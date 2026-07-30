import type { Prisma } from "@prisma/client";
import {
  mediaImageSnapshot,
  normalizeMediaType,
  type PropertyMediaType,
} from "@/lib/listing-lifecycle";

export const MAX_PROPERTY_MEDIA = 40;

export const propertyMediaSelect = {
  id: true,
  propertyId: true,
  url: true,
  storageKey: true,
  source: true,
  type: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  sortOrder: true,
  isCover: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function normalizeExternalMediaUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Media URLs must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Media URLs cannot contain credentials.");
  }
  return url.toString().slice(0, 2_000);
}

export function inferExternalMediaType(
  urlValue: string,
  requestedType?: string
): PropertyMediaType {
  if (requestedType) return normalizeMediaType(requestedType);
  const pathname = new URL(urlValue).pathname.toLowerCase();
  if (pathname.endsWith(".mp4")) return "video";
  if (pathname.endsWith(".pdf")) return "floorplan";
  return "image";
}

export async function nextMediaSortOrder(
  transaction: Prisma.TransactionClient,
  propertyId: string
): Promise<number> {
  const last = await transaction.propertyMedia.findFirst({
    where: { propertyId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function syncPropertyMediaSnapshot(
  transaction: Prisma.TransactionClient,
  propertyId: string
) {
  const media = await transaction.propertyMedia.findMany({
    where: { propertyId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    select: {
      url: true,
      type: true,
      sortOrder: true,
      isCover: true,
    },
  });

  const images = mediaImageSnapshot(media);
  await transaction.property.update({
    where: { id: propertyId },
    data: { images },
  });
  return images;
}

export async function ensurePropertyCover(
  transaction: Prisma.TransactionClient,
  propertyId: string
): Promise<void> {
  const media = await transaction.propertyMedia.findMany({
    where: { propertyId, type: "image" },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    select: { id: true, isCover: true },
  });
  if (!media.length || media.some((item) => item.isCover)) return;
  await transaction.propertyMedia.update({
    where: { id: media[0].id },
    data: { isCover: true },
  });
}

export async function reorderPropertyMedia(
  transaction: Prisma.TransactionClient,
  propertyId: string,
  orderedIds: readonly string[],
  coverId?: string | null
) {
  const existing = await transaction.propertyMedia.findMany({
    where: { propertyId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, type: true },
  });
  const existingIds = new Set(existing.map((item) => item.id));
  const unique = Array.from(new Set(orderedIds)).filter((id) =>
    existingIds.has(id)
  );
  existing.forEach((item) => {
    if (!unique.includes(item.id)) unique.push(item.id);
  });

  const selectedCover =
    coverId &&
    existing.some(
      (item) => item.id === coverId && item.type === "image"
    )
      ? coverId
      : existing.find((item) => item.type === "image")?.id || null;

  await Promise.all(
    unique.map((id, index) =>
      transaction.propertyMedia.update({
        where: { id },
        data: {
          sortOrder: index,
          isCover: selectedCover === id,
        },
      })
    )
  );
  await ensurePropertyCover(transaction, propertyId);
  await syncPropertyMediaSnapshot(transaction, propertyId);

  return transaction.propertyMedia.findMany({
    where: { propertyId },
    orderBy: { sortOrder: "asc" },
    select: propertyMediaSelect,
  });
}
