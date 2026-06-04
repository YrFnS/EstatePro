"use client";

import { motion } from "framer-motion";
import { X, Scale, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fadeUp } from "@/components/real-estate/types/animations";
import type { Property } from "@/components/real-estate/types/property";
import { getPropertyTitle, getPropertyImages, getPropertyFeatures } from "@/components/real-estate/types/property";
import type { ComparisonRow } from "./compare-utils";

interface DetailedComparisonTableProps {
  properties: Property[];
  comparisonRows: ComparisonRow[];
  locale: string;
  onRemoveFromCompare: (id: string) => void;
  onNavigateProperty: (id: string) => void;
  t: (key: string) => string;
}

export function DetailedComparisonTable({
  properties,
  comparisonRows,
  locale,
  onRemoveFromCompare,
  onNavigateProperty,
  t,
}: DetailedComparisonTableProps) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary" />
            </div>
            {t("compare.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              {/* Property headers */}
              <thead>
                <tr>
                  <th className="p-4 text-start w-40" />
                  {properties.map((p, idx) => (
                    <th key={p.id} className="p-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative group"
                      >
                        <div
                          className="relative h-48 rounded-xl overflow-hidden mb-4 cursor-pointer"
                          onClick={() => onNavigateProperty(p.id)}
                        >
                          <img
                            src={getPropertyImages(p)[0] || ""}
                            alt={getPropertyTitle(p, locale)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-3 start-3 end-3">
                            <p className="text-white font-bold text-lg line-clamp-1">{getPropertyTitle(p, locale)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 end-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                            onClick={(e) => { e.stopPropagation(); onRemoveFromCompare(p.id); }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onNavigateProperty(p.id)}
                        >
                          {t("common.viewDetails")}
                        </Button>
                      </motion.div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, rowIdx) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIdx * 0.03 }}
                    className={rowIdx % 2 === 0 ? "bg-muted/30" : ""}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <row.icon className="w-4 h-4 text-primary shrink-0" />
                        {row.label}
                      </div>
                    </td>
                    {properties.map((p, pIdx) => {
                      const isHighlighted = row.highlight(pIdx);
                      return (
                        <td key={p.id} className="p-4 text-center">
                          <span className={`text-sm font-medium ${isHighlighted ? "text-primary font-bold" : ""}`}>
                            {row.getValue(p)}
                          </span>
                          {isHighlighted && (
                            <Badge variant="secondary" className="ms-2 text-xs">
                              {t("compare.bestValue")}
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
                {/* Features row */}
                <tr className="bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {t("compare.features")}
                    </div>
                  </td>
                  {properties.map((p) => {
                    const features = getPropertyFeatures(p);
                    return (
                      <td key={p.id} className="p-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {features.slice(0, 4).map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {f}
                            </Badge>
                          ))}
                          {features.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{features.length - 4}
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
