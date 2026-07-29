export const MAX_FAVORITES = 100;
export const MAX_COMPARISON_ITEMS = 3;
export const MAX_SAVED_SEARCHES = 50;
export const MAX_NOTIFICATIONS = 100;

export type SavedSearchFilters = Record<string, string>;

export interface AccountSavedSearch {
  id: string;
  name: string;
  filters: SavedSearchFilters;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountNotificationType =
  | "property"
  | "price"
  | "search"
  | "system"
  | "inquiry";

export interface AccountNotification {
  id: string;
  type: AccountNotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  sourceId?: string;
}

const ALLOWED_FILTER_KEYS = new Set([
  "search",
  "status",
  "type",
  "bedrooms",
  "bathrooms",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "featured",
  "sort",
  "view",
]);

export function uniqueIds(values: unknown, limit = Number.POSITIVE_INFINITY): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

export function mergeUniqueIds(
  primary: readonly string[],
  secondary: readonly string[],
  limit = Number.POSITIVE_INFINITY
): string[] {
  return uniqueIds([...primary, ...secondary], limit);
}

export function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function normalizeSavedSearchFilters(input: unknown): SavedSearchFilters {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const result: SavedSearchFilters = {};

  for (const [key, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_FILTER_KEYS.has(key)) continue;

    let value = "";
    if (typeof rawValue === "string") value = rawValue.trim();
    else if (typeof rawValue === "number" || typeof rawValue === "boolean") {
      value = String(rawValue);
    }

    if (!value) continue;
    result[key] = value.slice(0, 500);
  }

  return result;
}

export function savedSearchSignature(
  name: string,
  filters: SavedSearchFilters
): string {
  const normalizedName = name.trim().toLocaleLowerCase();
  const orderedFilters = Object.fromEntries(
    Object.entries(filters).sort(([left], [right]) => left.localeCompare(right))
  );

  return JSON.stringify([normalizedName, orderedFilters]);
}

export function mergeSavedSearches(
  primary: readonly AccountSavedSearch[],
  secondary: readonly AccountSavedSearch[],
  limit = MAX_SAVED_SEARCHES
): AccountSavedSearch[] {
  const seen = new Set<string>();
  const merged: AccountSavedSearch[] = [];

  for (const item of [...primary, ...secondary]) {
    const signature = savedSearchSignature(item.name, item.filters);
    if (seen.has(signature)) continue;
    seen.add(signature);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function notificationTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return Date.now();
}
