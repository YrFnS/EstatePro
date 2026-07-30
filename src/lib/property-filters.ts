import type { Prisma } from "@prisma/client";

function finiteNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nonNegativeInteger(value: string | null): number | undefined {
  const parsed = finiteNumber(value);
  if (parsed === undefined || parsed < 0) return undefined;
  return Math.floor(parsed);
}

export function buildPropertyWhere(
  searchParams: URLSearchParams,
  options: {
    requireCoordinates?: boolean;
    includeUnpublished?: boolean;
  } = {}
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (!options.includeUnpublished) {
    where.listingStatus = "published";
  }

  const requestedListingStatus = searchParams.get("listingStatus");
  if (options.includeUnpublished && requestedListingStatus) {
    where.listingStatus = requestedListingStatus;
  }

  const featured = searchParams.get("featured");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.trim();
  const bedrooms = nonNegativeInteger(searchParams.get("bedrooms"));
  const bathrooms = nonNegativeInteger(searchParams.get("bathrooms"));
  const minPrice = finiteNumber(searchParams.get("minPrice"));
  const maxPrice = finiteNumber(searchParams.get("maxPrice"));
  const minArea = finiteNumber(searchParams.get("minArea"));
  const maxArea = finiteNumber(searchParams.get("maxArea"));
  const agentId = searchParams.get("agentId")?.trim();
  const ownerUserId = searchParams.get("ownerUserId")?.trim();

  if (featured === "true") where.featured = true;
  if (status === "sale" || status === "rent") where.status = status;
  if (type && type !== "all") where.type = type;
  if (agentId) where.agentId = agentId;
  if (options.includeUnpublished && ownerUserId) {
    where.ownerUserId = ownerUserId;
  }
  if (bedrooms !== undefined) where.bedrooms = { gte: bedrooms };
  if (bathrooms !== undefined) where.bathrooms = { gte: bathrooms };

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  if (minArea !== undefined || maxArea !== undefined) {
    where.area = {
      ...(minArea !== undefined ? { gte: minArea } : {}),
      ...(maxArea !== undefined ? { lte: maxArea } : {}),
    };
  }

  if (search) {
    const contains = { contains: search, mode: "insensitive" as const };
    where.OR = [
      { titleEn: contains },
      { titleAr: contains },
      { locationEn: contains },
      { locationAr: contains },
      { cityEn: contains },
      { cityAr: contains },
      { addressEn: contains },
      { addressAr: contains },
    ];
  }

  const north = finiteNumber(searchParams.get("north"));
  const south = finiteNumber(searchParams.get("south"));
  const east = finiteNumber(searchParams.get("east"));
  const west = finiteNumber(searchParams.get("west"));

  if (
    north !== undefined &&
    south !== undefined &&
    east !== undefined &&
    west !== undefined
  ) {
    where.lat = {
      gte: Math.min(south, north),
      lte: Math.max(south, north),
    };
    where.lng = {
      gte: Math.min(west, east),
      lte: Math.max(west, east),
    };
  } else if (options.requireCoordinates) {
    where.lat = { not: null };
    where.lng = { not: null };
  }

  return where;
}

export function buildPropertyOrderBy(
  sort: string | null
): Prisma.PropertyOrderByWithRelationInput {
  switch (sort) {
    case "priceLow":
      return { price: "asc" };
    case "priceHigh":
      return { price: "desc" };
    case "largest":
      return { area: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export function getPropertyPagination(searchParams: URLSearchParams) {
  const requestedPage =
    nonNegativeInteger(searchParams.get("page")) || 1;
  const requestedLimit =
    nonNegativeInteger(searchParams.get("limit")) || 9;
  const page = Math.max(1, requestedPage);
  const limit = Math.min(48, Math.max(1, requestedLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
