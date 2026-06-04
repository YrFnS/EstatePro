"use client";

export type ActivityType = "favorite" | "compare" | "search" | "view" | "inquiry";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
}

const STORAGE_KEY = "estatepro-activity-log";
const MAX_ACTIVITIES = 50;

export function logActivity(type: ActivityType, description: string): void {
  try {
    const existing: Activity[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      description,
      timestamp: Date.now(),
    };
    existing.unshift(newActivity);
    if (existing.length > MAX_ACTIVITIES) existing.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Silently fail
  }
}

export function getActivities(limit = 10): Activity[] {
  try {
    const all: Activity[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return all.slice(0, limit);
  } catch {
    return [];
  }
}

export function clearActivities(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function getSavedSearchesCount(): number {
  try {
    const saved = localStorage.getItem("estatepro-saved-searches");
    if (saved) {
      return JSON.parse(saved).length;
    }
    return 0;
  } catch {
    return 0;
  }
}
