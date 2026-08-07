import {
  normalizeSavedSearchFilters,
  type SavedSearchFilters,
} from "@/lib/account-state";

export const MAX_PROPERTY_ALERTS = 30;
export const MAX_ALERT_MATCHES_PER_RUN = 250;
export const MAX_ALERT_MATCH_HISTORY = 500;
export const MAX_ALERT_NOTIFICATIONS_PER_RUN = 20;

export type PropertyAlertFrequency = "instant" | "daily" | "weekly";
export type PropertyAlertFilters = SavedSearchFilters;

export interface PropertyAlertPropertySummary {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  status: string;
  type: string;
  locationEn: string;
  locationAr: string;
  images: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPropertyAlertMatch {
  id: string;
  matchedAt: string;
  property: PropertyAlertPropertySummary;
}

export interface AccountPropertyAlert {
  id: string;
  savedSearchId: string | null;
  name: string;
  filters: PropertyAlertFilters;
  frequency: PropertyAlertFrequency;
  enabled: boolean;
  currentMatchCount: number;
  lastRunAt: string | null;
  lastMatchedAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  recentMatches: AccountPropertyAlertMatch[];
}

const NUMERIC_FILTERS = new Set([
  "bedrooms",
  "bathrooms",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
]);

export function normalizePropertyAlertFrequency(
  value: unknown
): PropertyAlertFrequency {
  if (value === "instant" || value === "weekly") return value;
  return "daily";
}

export function normalizePropertyAlertFilters(
  input: unknown
): PropertyAlertFilters {
  const normalized = normalizeSavedSearchFilters(input);

  delete normalized.sort;
  delete normalized.view;

  if (normalized.status === "for-sale") normalized.status = "sale";
  if (normalized.status === "for-rent") normalized.status = "rent";
  if (
    normalized.status &&
    normalized.status !== "sale" &&
    normalized.status !== "rent"
  ) {
    delete normalized.status;
  }

  if (normalized.type === "any" || normalized.type === "all") {
    delete normalized.type;
  }

  if (normalized.featured && normalized.featured !== "true") {
    delete normalized.featured;
  }

  for (const key of NUMERIC_FILTERS) {
    const value = normalized[key];
    if (!value) continue;
    const numeric = Number(value.replace(/\+$/, ""));
    if (!Number.isFinite(numeric) || numeric < 0) {
      delete normalized[key];
      continue;
    }
    normalized[key] = String(numeric);
  }

  return normalized;
}

export function hasInvalidPropertyAlertRange(
  filters: PropertyAlertFilters
): boolean {
  return ([
    ["minPrice", "maxPrice"],
    ["minArea", "maxArea"],
  ] as const).some(
    ([minimum, maximum]) =>
      filters[minimum] !== undefined &&
      filters[maximum] !== undefined &&
      Number(filters[minimum]) > Number(filters[maximum])
  );
}

export function propertyAlertSignature(
  name: string,
  filters: PropertyAlertFilters,
  frequency: PropertyAlertFrequency
): string {
  const orderedFilters = Object.fromEntries(
    Object.entries(filters).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  );

  return JSON.stringify([
    name.trim().toLocaleLowerCase(),
    orderedFilters,
    frequency,
  ]);
}

export function propertyAlertIntervalMs(
  frequency: PropertyAlertFrequency
): number {
  switch (frequency) {
    case "instant":
      return 15 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function nextPropertyAlertRun(
  frequency: PropertyAlertFrequency,
  from: Date = new Date()
): Date {
  return new Date(from.getTime() + propertyAlertIntervalMs(frequency));
}

export function propertyAlertSearchParams(
  filters: PropertyAlertFilters
): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export function propertyAlertResultsUrl(
  filters: PropertyAlertFilters
): string {
  const query = propertyAlertSearchParams(filters).toString();
  return query ? `/properties?${query}` : "/properties";
}

export function normalizeLegacyPropertyAlert(
  input: unknown
): {
  name: string;
  filters: PropertyAlertFilters;
  frequency: PropertyAlertFrequency;
  enabled: boolean;
} | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const name =
    typeof record.name === "string" ? record.name.trim().slice(0, 120) : "";
  if (!name) return null;

  const filters = normalizePropertyAlertFilters({
    type: record.propertyType,
    status: record.status,
    minPrice: record.minPrice,
    maxPrice: record.maxPrice,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    minArea: record.minArea,
    maxArea: record.maxArea,
    search: record.location,
  });

  if (!Object.keys(filters).length) return null;

  return {
    name,
    filters,
    frequency: normalizePropertyAlertFrequency(record.frequency),
    enabled: record.enabled !== false,
  };
}
