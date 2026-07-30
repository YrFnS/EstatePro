export const LISTING_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "scheduled",
  "published",
  "rejected",
  "archived",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const MEDIA_TYPES = [
  "image",
  "video",
  "floorplan",
  "document",
] as const;

export type PropertyMediaType = (typeof MEDIA_TYPES)[number];

export interface ListingSubmissionInput {
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price?: number | null;
  type?: string | null;
  status?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  locationEn?: string | null;
  locationAr?: string | null;
  addressEn?: string | null;
  addressAr?: string | null;
  cityEn?: string | null;
  cityAr?: string | null;
  imageCount?: number | null;
}

export interface ListingIssue {
  field: string;
  code: string;
  message: string;
}

const OWNER_EDITABLE = new Set<ListingStatus>([
  "draft",
  "changes_requested",
  "rejected",
]);

const OWNER_SUBMITTABLE = new Set<ListingStatus>([
  "draft",
  "changes_requested",
  "rejected",
]);

const OWNER_ARCHIVABLE = new Set<ListingStatus>([
  "draft",
  "changes_requested",
  "rejected",
  "published",
]);

const OWNER_WITHDRAWABLE = new Set<ListingStatus>([
  "pending_review",
]);

const ADMIN_TRANSITIONS: Record<ListingStatus, Set<ListingStatus>> = {
  draft: new Set(["pending_review", "published", "archived"]),
  pending_review: new Set([
    "changes_requested",
    "scheduled",
    "published",
    "rejected",
    "archived",
  ]),
  changes_requested: new Set([
    "pending_review",
    "published",
    "rejected",
    "archived",
  ]),
  scheduled: new Set(["published", "pending_review", "archived"]),
  published: new Set(["pending_review", "archived"]),
  rejected: new Set(["pending_review", "published", "archived"]),
  archived: new Set(["draft", "published"]),
};

export function isListingStatus(value: unknown): value is ListingStatus {
  return (
    typeof value === "string" &&
    (LISTING_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeListingStatus(
  value: unknown,
  fallback: ListingStatus = "draft"
): ListingStatus {
  return isListingStatus(value) ? value : fallback;
}

export function canOwnerEdit(status: ListingStatus): boolean {
  return OWNER_EDITABLE.has(status);
}

export function canOwnerSubmit(status: ListingStatus): boolean {
  return OWNER_SUBMITTABLE.has(status);
}

export function canOwnerArchive(status: ListingStatus): boolean {
  return OWNER_ARCHIVABLE.has(status);
}

export function canOwnerWithdraw(status: ListingStatus): boolean {
  return OWNER_WITHDRAWABLE.has(status);
}

export function canAdminTransition(
  from: ListingStatus,
  to: ListingStatus
): boolean {
  return from === to || ADMIN_TRANSITIONS[from].has(to);
}

function requiredText(
  issues: ListingIssue[],
  field: string,
  value: string | null | undefined,
  minimum: number,
  message: string
) {
  if (!value || value.trim().length < minimum) {
    issues.push({ field, code: "required", message });
  }
}

export function validateListingForSubmission(
  listing: ListingSubmissionInput
): ListingIssue[] {
  const issues: ListingIssue[] = [];

  requiredText(
    issues,
    "titleEn",
    listing.titleEn,
    2,
    "Add an English title."
  );
  requiredText(
    issues,
    "titleAr",
    listing.titleAr,
    2,
    "Add an Arabic title."
  );
  requiredText(
    issues,
    "descriptionEn",
    listing.descriptionEn,
    30,
    "Add an English description of at least 30 characters."
  );
  requiredText(
    issues,
    "descriptionAr",
    listing.descriptionAr,
    30,
    "Add an Arabic description of at least 30 characters."
  );
  requiredText(
    issues,
    "type",
    listing.type,
    2,
    "Choose a property type."
  );
  requiredText(
    issues,
    "locationEn",
    listing.locationEn,
    2,
    "Add an English location."
  );
  requiredText(
    issues,
    "locationAr",
    listing.locationAr,
    2,
    "Add an Arabic location."
  );
  requiredText(
    issues,
    "addressEn",
    listing.addressEn,
    2,
    "Add an English address."
  );
  requiredText(
    issues,
    "addressAr",
    listing.addressAr,
    2,
    "Add an Arabic address."
  );
  requiredText(
    issues,
    "cityEn",
    listing.cityEn,
    2,
    "Add an English city."
  );
  requiredText(
    issues,
    "cityAr",
    listing.cityAr,
    2,
    "Add an Arabic city."
  );

  if (!Number.isFinite(listing.price) || Number(listing.price) <= 0) {
    issues.push({
      field: "price",
      code: "positive_number",
      message: "Add a valid property price.",
    });
  }
  if (!Number.isFinite(listing.area) || Number(listing.area) <= 0) {
    issues.push({
      field: "area",
      code: "positive_number",
      message: "Add a valid property area.",
    });
  }
  if (
    !Number.isInteger(listing.bedrooms) ||
    Number(listing.bedrooms) < 0
  ) {
    issues.push({
      field: "bedrooms",
      code: "non_negative_integer",
      message: "Add a valid bedroom count.",
    });
  }
  if (
    !Number.isInteger(listing.bathrooms) ||
    Number(listing.bathrooms) < 0
  ) {
    issues.push({
      field: "bathrooms",
      code: "non_negative_integer",
      message: "Add a valid bathroom count.",
    });
  }
  if (listing.status !== "sale" && listing.status !== "rent") {
    issues.push({
      field: "status",
      code: "invalid_choice",
      message: "Choose whether the property is for sale or rent.",
    });
  }
  if (!Number.isInteger(listing.imageCount) || Number(listing.imageCount) < 1) {
    issues.push({
      field: "media",
      code: "image_required",
      message: "Add at least one property image before submitting.",
    });
  }

  return issues;
}

export function listingCompletionPercentage(
  listing: ListingSubmissionInput
): number {
  const fields = [
    Boolean(listing.titleEn?.trim()),
    Boolean(listing.titleAr?.trim()),
    Boolean(listing.descriptionEn?.trim()),
    Boolean(listing.descriptionAr?.trim()),
    Number(listing.price) > 0,
    Boolean(listing.type?.trim()),
    listing.status === "sale" || listing.status === "rent",
    Number.isInteger(listing.bedrooms) && Number(listing.bedrooms) >= 0,
    Number.isInteger(listing.bathrooms) && Number(listing.bathrooms) >= 0,
    Number(listing.area) > 0,
    Boolean(listing.locationEn?.trim()),
    Boolean(listing.locationAr?.trim()),
    Boolean(listing.addressEn?.trim()),
    Boolean(listing.addressAr?.trim()),
    Boolean(listing.cityEn?.trim()),
    Boolean(listing.cityAr?.trim()),
    Number(listing.imageCount) > 0,
  ];

  return Math.round(
    (fields.filter(Boolean).length / fields.length) * 100
  );
}

export function listingStatusLabel(status: ListingStatus): string {
  return status.replaceAll("_", " ");
}

export function normalizeMediaType(
  value: unknown,
  fallback: PropertyMediaType = "image"
): PropertyMediaType {
  return typeof value === "string" &&
    (MEDIA_TYPES as readonly string[]).includes(value)
    ? (value as PropertyMediaType)
    : fallback;
}

export function mediaImageSnapshot(
  media: ReadonlyArray<{
    url: string;
    type: string;
    sortOrder: number;
    isCover: boolean;
  }>
): string {
  return media
    .filter((item) => item.type === "image" && item.url.trim())
    .sort((left, right) => {
      if (left.isCover !== right.isCover) return left.isCover ? -1 : 1;
      return left.sortOrder - right.sortOrder;
    })
    .map((item) => item.url.trim())
    .join(",");
}

export function scheduledPublicationStatus(
  publishAt: Date | null | undefined,
  now = new Date()
): "scheduled" | "published" {
  return publishAt && publishAt.getTime() > now.getTime()
    ? "scheduled"
    : "published";
}
