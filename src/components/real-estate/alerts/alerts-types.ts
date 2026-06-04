import {
  Home,
  Building,
  Castle,
  Hotel,
  Landmark,
  Crown,
  Zap,
  Clock,
  CalendarDays,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PropertyAlert {
  id: string;
  name: string;
  propertyType: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  minArea: number;
  maxArea: number;
  location: string;
  frequency: "instant" | "daily" | "weekly";
  enabled: boolean;
  createdAt: string;
  matchCount: number;
}

export interface AlertHistoryItem {
  id: string;
  alertId: string;
  alertName: string;
  propertyName: string;
  propertyId: string;
  matchedAt: string;
}

export interface QuickTemplate {
  name: string;
  propertyType: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  location: string;
  frequency: "instant" | "daily" | "weekly";
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const STORAGE_KEY = "estatepro-property-alerts";
export const HISTORY_KEY = "estatepro-property-alerts-history";

export const PROPERTY_TYPES = [
  { value: "apartment", icon: Building },
  { value: "villa", icon: Castle },
  { value: "house", icon: Home },
  { value: "condo", icon: Hotel },
  { value: "townhouse", icon: Landmark },
  { value: "penthouse", icon: Crown },
];

export const FREQUENCY_STYLES: Record<string, string> = {
  instant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  daily: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  weekly: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

export const FREQUENCY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instant: Zap,
  daily: Clock,
  weekly: CalendarDays,
};

// ── Storage helpers ────────────────────────────────────────────────────────

export function loadAlerts(): PropertyAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: PropertyAlert[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function loadHistory(): AlertHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: AlertHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ── Utility helpers ────────────────────────────────────────────────────────

export function formatRelativeTime(dateStr: string, t: (key: string) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("alerts.justNow") || "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getCriteriaBadges(alert: PropertyAlert, t: (key: string) => string) {
  const badges: { label: string; color: string }[] = [];
  if (alert.propertyType && alert.propertyType !== "any") {
    badges.push({
      label: t(`properties.${alert.propertyType}`) || alert.propertyType,
      color: "bg-primary/10 text-primary",
    });
  }
  if (alert.status) {
    badges.push({
      label: alert.status === "for-sale" ? t("common.forSale") : t("common.forRent"),
      color: "bg-primary/10 text-primary",
    });
  }
  if (alert.minPrice || alert.maxPrice) {
    const min = alert.minPrice ? `$${(alert.minPrice / 1000).toFixed(0)}K` : "";
    const max = alert.maxPrice ? `$${(alert.maxPrice / 1000).toFixed(0)}K` : "";
    badges.push({
      label: `${min}-${max}`,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    });
  }
  if (alert.bedrooms && alert.bedrooms !== "any") {
    badges.push({
      label: `${alert.bedrooms} ${t("properties.bedrooms") || "Beds"}`,
      color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    });
  }
  if (alert.location) {
    badges.push({
      label: alert.location,
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    });
  }
  return badges;
}
