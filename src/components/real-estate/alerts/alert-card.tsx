"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import {
  BellRing,
  Trash2,
  Eye,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FREQUENCY_STYLES, FREQUENCY_ICONS } from "./alerts-types";
import type { PropertyAlert } from "./alerts-types";
import { formatDate, getCriteriaBadges } from "./alerts-types";

export interface AlertCardProps {
  alert: PropertyAlert;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onViewMatches: (alert: PropertyAlert) => void;
}

export function AlertCard({ alert, index, onToggle, onDelete, onViewMatches }: AlertCardProps) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border bg-card p-4 hover:shadow-md transition-all border-s-4 ${
        alert.enabled
          ? "border-s-primary"
          : "border-s-gray-300 dark:border-s-gray-600 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base truncate">{alert.name}</h4>
            <Badge className={FREQUENCY_STYLES[alert.frequency]}>
              {(() => {
                const FIcon = FREQUENCY_ICONS[alert.frequency];
                return <FIcon className="w-3 h-3 me-1" />;
              })()}
              {t(`alerts.${alert.frequency}`) || alert.frequency}
            </Badge>
          </div>

          {/* Criteria Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {getCriteriaBadges(alert, t).map((badge, i) => (
              <Badge key={i} variant="secondary" className={`text-xs ${badge.color}`}>
                {badge.label}
              </Badge>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(alert.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {t("alerts.matchCount") || "Matches"}: {alert.matchCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={alert.enabled}
            onCheckedChange={() => onToggle(alert.id)}
            aria-label={alert.enabled ? t("alerts.enabled") || "Enabled" : t("alerts.disabled") || "Disabled"}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewMatches(alert)}
            title={t("alerts.viewMatches") || "View Matches"}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(alert.id)}
            title={t("alerts.deleteAlert") || "Delete Alert"}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status label */}
      <div className="mt-2">
        <span className={`text-xs font-medium ${alert.enabled ? "text-primary" : "text-muted-foreground"}`}>
          {alert.enabled ? (t("alerts.enabled") || "Enabled") : (t("alerts.disabled") || "Disabled")}
        </span>
      </div>
    </motion.div>
  );
}
