"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/components/real-estate/types/animations";
import { CircularProgress } from "./compare-types";
import type { PropertyScore } from "./compare-utils";
import type { Property } from "@/components/real-estate/types/property";
import { getPropertyTitle, getPropertyImages } from "@/components/real-estate/types/property";

interface ScoreCardsSectionProps {
  propertyScores: PropertyScore[];
  locale: string;
  t: (key: string) => string;
  formatPrice: (price: number) => string;
}

export function ScoreCardsSection({ propertyScores, locale, t, formatPrice }: ScoreCardsSectionProps) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            {t("compare.scoreCard")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyScores.map((score, idx) => (
              <motion.div
                key={score.property.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="relative rounded-xl border bg-card p-5"
              >
                {/* Property name & image */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={getPropertyImages(score.property)[0] || ""}
                      alt={getPropertyTitle(score.property, locale)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{getPropertyTitle(score.property, locale)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(score.property.price)}</p>
                  </div>
                </div>
                {/* Circular progress + overall score */}
                <div className="flex items-center gap-5">
                  <CircularProgress
                    value={score.overall}
                    size={90}
                    strokeWidth={7}
                    color={score.overall >= 75 ? "#10b981" : score.overall >= 50 ? "#14b8a6" : "#f59e0b"}
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("compare.overallScore")}</p>
                      <Badge className={`${score.overall >= 75 ? "bg-primary/10 text-primary" : score.overall >= 50 ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"} border-0`}>
                        {score.overall >= 75 ? t("compare.excellent") : score.overall >= 50 ? t("compare.good") : t("compare.fair")}
                      </Badge>
                    </div>
                    {score.breakdown.map((b) => (
                      <div key={b.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16 truncate">{b.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${b.value}%` }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: b.color }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground w-7 text-end">{b.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
