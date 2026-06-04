"use client";

import { motion } from "framer-motion";

interface ScoreBarProps {
  value: number;
  maxVal?: number;
  color?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ScoreBar({ value, maxVal = 100, color = "bg-primary", label, icon: Icon }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold">{value}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${(value / maxVal) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
