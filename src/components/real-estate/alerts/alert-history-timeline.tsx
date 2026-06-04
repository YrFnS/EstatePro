"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion } from "framer-motion";
import { BellRing, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "./alerts-types";
import type { AlertHistoryItem } from "./alerts-types";

export interface AlertHistoryTimelineProps {
  history: AlertHistoryItem[];
}

export function AlertHistoryTimeline({ history }: AlertHistoryTimelineProps) {
  const { t } = useI18n();
  const { navigate } = useRouter();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="w-5 h-5 text-sky-600" />
            {t("alerts.alertHistory") || "Alert History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-3">
                <AlertCircle className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("alerts.noHistory") || "No alert matches yet. Create an alert to start receiving notifications."}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {history.slice(0, 15).map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.03 }}
                    className="relative ps-10"
                  >
                    {/* Timeline dot */}
                    <div className="absolute start-3.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">{t("alerts.matchedProperty") || "Matched property"}:</span>{" "}
                          <button
                            onClick={() => navigate("property-detail", { id: item.propertyId })}
                            className="text-primary hover:underline font-medium"
                          >
                            {item.propertyName}
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <BellRing className="w-3 h-3" />
                          {item.alertName}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(item.matchedAt, t)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
