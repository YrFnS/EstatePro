"use client";

import { motion } from "framer-motion";
import { Tag, Maximize } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fadeUp } from "@/components/real-estate/types/animations";
import { CHART_COLORS } from "./compare-types";

// ---------------------------------------------------------------------------
// Tooltip components (small & stateless — live alongside the only consumer)
// ---------------------------------------------------------------------------

function PriceTooltip({ active, payload, currency }: { active?: boolean; payload?: Array<{ value: number }>; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-semibold text-popover-foreground">
          {currency}{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
}

function AreaTooltip({ active, payload, sqftLabel }: { active?: boolean; payload?: Array<{ value: number }>; sqftLabel: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-semibold text-popover-foreground">
          {payload[0].value.toLocaleString()} {sqftLabel}
        </p>
      </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// BarChartsSection
// ---------------------------------------------------------------------------

interface BarChartsSectionProps {
  priceBarData: { name: string; price: number; color: string }[];
  areaBarData: { name: string; area: number; color: string }[];
  isDark: boolean;
  t: (key: string) => string;
}

export function BarChartsSection({ priceBarData, areaBarData, isDark, t }: BarChartsSectionProps) {
  const chartTextColor = isDark ? "#9ca3af" : "#6b7280";
  const chartGridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const currency = t("common.currency");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Price Comparison Bar Chart with Gradient */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="overflow-hidden h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              {t("compare.barChart")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceBarData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="priceGrad0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="priceGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="priceGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTextColor, fontSize: 11 }}
                  axisLine={{ stroke: chartGridColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTextColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<PriceTooltip currency={currency} />} />
                <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {priceBarData.map((_, index) => (
                    <Cell key={`price-${index}`} fill={`url(#priceGrad${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Area Comparison Bar Chart with Gradient */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="overflow-hidden h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Maximize className="w-4 h-4 text-primary" />
              </div>
              {t("compare.areaComparison")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaBarData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="areaGrad0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTextColor, fontSize: 11 }}
                  axisLine={{ stroke: chartGridColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTextColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v.toLocaleString()}`}
                />
                <Tooltip content={<AreaTooltip sqftLabel={t("common.sqft")} />} />
                <Bar dataKey="area" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {areaBarData.map((_, index) => (
                    <Cell key={`area-${index}`} fill={`url(#areaGrad${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
