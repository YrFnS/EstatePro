"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fadeUp } from "@/components/real-estate/types/animations";
import { CHART_COLORS } from "./compare-types";
import type { Property } from "@/components/real-estate/types/property";
import { getPropertyTitle } from "@/components/real-estate/types/property";

interface RadarChartSectionProps {
  properties: Property[];
  radarData: Record<string, string | number>[];
  locale: string;
  isDark: boolean;
  t: (key: string) => string;
}

export function RadarChartSection({ properties, radarData, locale, isDark, t }: RadarChartSectionProps) {
  const chartTextColor = isDark ? "#9ca3af" : "#6b7280";
  const chartGridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            {t("compare.radarChart")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke={chartGridColor} />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: chartTextColor, fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: chartTextColor, fontSize: 10 }}
                axisLine={false}
              />
              {properties.map((p, idx) => (
                <Radar
                  key={p.id}
                  name={getPropertyTitle(p, locale)}
                  dataKey={`prop${idx}`}
                  stroke={CHART_COLORS[idx]}
                  fill={CHART_COLORS[idx]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: 12, color: chartTextColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#fff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
