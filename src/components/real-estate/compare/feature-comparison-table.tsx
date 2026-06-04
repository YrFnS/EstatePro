"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp } from "@/components/real-estate/types/animations";
import { CHART_COLORS } from "./compare-types";
import type { Property } from "@/components/real-estate/types/property";
import { getPropertyTitle } from "@/components/real-estate/types/property";

interface FeatureMatrix {
  allFeatures: string[];
  matrix: { feature: string; hasIt: boolean[] }[];
}

interface FeatureComparisonTableProps {
  properties: Property[];
  featureMatrix: FeatureMatrix;
  locale: string;
  t: (key: string) => string;
}

export function FeatureComparisonTable({ properties, featureMatrix, locale, t }: FeatureComparisonTableProps) {
  if (featureMatrix.allFeatures.length === 0) return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-amber-500" />
            </div>
            {t("compare.featureTable")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]">
              <thead>
                <tr>
                  <th className="p-3 text-start text-sm font-medium text-muted-foreground bg-muted/50 rounded-s-lg">
                    {t("compare.features")}
                  </th>
                  {properties.map((p, idx) => (
                    <th key={p.id} className="p-3 text-center text-sm font-medium bg-muted/50" style={{ color: CHART_COLORS[idx] }}>
                      <span className="line-clamp-1">{getPropertyTitle(p, locale)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureMatrix.matrix.map((row, rowIdx) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIdx * 0.03 }}
                    className={rowIdx % 2 === 0 ? "bg-muted/20" : ""}
                  >
                    <td className="p-3 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    {row.hasIt.map((has, pIdx) => (
                      <td key={pIdx} className="p-3 text-center">
                        {has ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">
                            {t("compare.has")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm">
                            {t("compare.doesNotHave")}
                          </span>
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
