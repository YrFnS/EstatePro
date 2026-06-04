import type { ActivityType } from "@/lib/activity-log";
import type { LucideIcon } from "lucide-react";
import {
  Heart,
  Scale,
  Search,
  Eye,
  Mail,
  Clock,
} from "lucide-react";

/**
 * Activity entry used throughout the dashboard.
 */
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
}

/**
 * Stat card data used in the activity overview grid.
 */
export interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  bgLight: string;
  textColor: string;
}

/**
 * Quick-search shortcut definition.
 */
export interface QuickSearchItem {
  key: string;
  icon: LucideIcon;
  filters: Record<string, string>;
  color: string;
}

/**
 * Returns the matching Lucide icon for an activity type.
 */
export function getActivityIcon(type: ActivityType): LucideIcon {
  switch (type) {
    case "favorite":
      return Heart;
    case "compare":
      return Scale;
    case "search":
      return Search;
    case "view":
      return Eye;
    case "inquiry":
      return Mail;
    default:
      return Clock;
  }
}

/**
 * Returns the Tailwind colour classes for an activity type.
 */
export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case "favorite":
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    case "compare":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "search":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    case "view":
      return "bg-primary/10 text-primary";
    case "inquiry":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

/**
 * Formats a timestamp as a human-readable relative time string.
 */
export function formatTimeAgo(
  timestamp: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
  if (hours < 24) return t("notifications.hoursAgo", { count: hours });
  return t("notifications.daysAgo", { count: days });
}
