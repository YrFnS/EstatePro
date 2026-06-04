/**
 * Shared types, constants, and small utility components for the Compare page modules.
 */

"use client";

import { motion } from "framer-motion";
import type { Property } from "@/components/real-estate/types/property";

// Re-export Property so sibling modules can import from one place
export type { Property } from "@/components/real-estate/types/property";

export const CHART_COLORS = ["#10b981", "#14b8a6", "#f59e0b"] as const;

/** Circular progress indicator used in score cards */
export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = "#10b981",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}
