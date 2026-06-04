"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/real-estate/types/animations";
import type { Activity } from "./dashboard-types";
import { getActivityIcon, getActivityColor, formatTimeAgo } from "./dashboard-types";

interface RecentActivityTimelineProps {
  activities: Activity[];
  onClear: () => void;
}

export function RecentActivityTimeline({ activities, onClear }: RecentActivityTimelineProps) {
  const { t } = useI18n();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              {t("dashboard.recentActivity")}
            </CardTitle>
            {activities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("notifications.clearAll")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
              {activities.map((activity, idx) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                const typeLabel = t(`dashboard.${activity.type === "favorite" ? "favorited" : activity.type === "compare" ? "compared" : activity.type === "search" ? "searched" : activity.type === "view" ? "viewed" : "inquired"}`);

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {idx < activities.length - 1 && (
                        <div className="w-px h-6 bg-border" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {typeLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp, t)}
                        </span>
                      </div>
                      <p className="text-sm truncate">{activity.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("dashboard.noActivity")}</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t("dashboard.noActivityDesc")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
