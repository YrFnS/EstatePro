"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/components/real-estate/types/animations";
import { neighborhoods, type NeighborhoodData } from "./neighborhood-data";

interface NeighborhoodComparisonTableProps {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  t: (key: string) => string;
}

export function NeighborhoodComparisonTable({ compareIds, toggleCompare, t }: NeighborhoodComparisonTableProps) {
  const comparedNeighborhoods = neighborhoods.filter((nb) => compareIds.includes(nb.id));

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.compareTitle")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.compareSubtitle")}</p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
        </motion.div>

        {/* Selection area */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-3">{t("neighborhoodGuide.selectToCompare")} ({compareIds.length}/3)</p>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.map((nb) => {
                  const isSelected = compareIds.includes(nb.id);
                  return (
                    <button
                      key={nb.id}
                      onClick={() => toggleCompare(nb.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {t(nb.nameKey)}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparison table */}
        <AnimatePresence mode="wait">
          {comparedNeighborhoods.length > 0 ? (
            <motion.div
              key={compareIds.join(",")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-4 text-start text-sm font-medium text-muted-foreground min-w-[140px]">
                            {t("neighborhoodGuide.metric")}
                          </th>
                          {comparedNeighborhoods.map((nb) => (
                            <th key={nb.id} className="p-4 text-center min-w-[160px]">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold text-primary-foreground bg-primary`}>
                                {t(nb.nameKey)}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: t("neighborhoodGuide.avgPrice"), getValue: (nb: NeighborhoodData) => nb.avgPrice },
                          { label: t("neighborhoodGuide.walkScore"), getValue: (nb: NeighborhoodData) => nb.walkScore, bar: true, barColor: "bg-primary" },
                          { label: t("neighborhoodGuide.transitScore"), getValue: (nb: NeighborhoodData) => nb.transitScore, bar: true, barColor: "bg-primary" },
                          { label: t("neighborhoodGuide.safetyRating"), getValue: (nb: NeighborhoodData) => nb.safetyRating, bar: true, barColor: "bg-amber-500" },
                          { label: t("neighborhoodGuide.restaurantCount"), getValue: (nb: NeighborhoodData) => `${nb.restaurants}+` },
                          { label: t("neighborhoodGuide.schoolCount"), getValue: (nb: NeighborhoodData) => nb.schools.toString() },
                          { label: t("neighborhoodGuide.parkCount"), getValue: (nb: NeighborhoodData) => nb.parks.toString() },
                          { label: t("neighborhoodGuide.propertyCount"), getValue: (nb: NeighborhoodData) => nb.propertyCount.toString() },
                        ].map((row, rowIdx) => {
                          const maxVal = row.bar
                            ? Math.max(...comparedNeighborhoods.map((nb) => row.getValue(nb) as number))
                            : 0;
                          return (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "" : "bg-muted/30"}>
                              <td className="p-4 text-sm font-medium">{row.label}</td>
                              {comparedNeighborhoods.map((nb) => {
                                const val = row.getValue(nb);
                                const isBest = row.bar && val === maxVal && maxVal > 0;
                                return (
                                  <td key={nb.id} className="p-4 text-center">
                                    {row.bar ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-sm font-semibold ${isBest ? "text-primary" : ""}`}>
                                          {val as number}
                                        </span>
                                        <div className="w-full max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                                          <motion.div
                                            className={`h-full rounded-full ${row.barColor} ${isBest ? "opacity-100" : "opacity-60"}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((val as number) / 100) * 100}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium">{val as string}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                        {/* Best For row */}
                        <tr className="bg-muted/30">
                          <td className="p-4 text-sm font-medium">{t("neighborhoodGuide.bestFor")}</td>
                          {comparedNeighborhoods.map((nb) => (
                            <td key={nb.id} className="p-4 text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {nb.bestForKeys.map((key) => (
                                  <Badge key={key} variant="secondary" className="text-[10px]">
                                    {t(key)}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("neighborhoodGuide.selectTwoOrMore")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
