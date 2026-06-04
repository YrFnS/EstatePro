"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Home,
  Clock,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ---- API Types ----
interface MarketDataPoint {
  id: string;
  label: string;
  value: number;
  period: string;
  createdAt: string;
}

interface MarketStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: string;
  change: string;
  changeType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MarketDataResponse {
  dataPoints: MarketDataPoint[];
  stats: MarketStat[];
  fallback?: boolean;
}

// ---- Month Names ----
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---- Helpers ----
function getStatIcon(labelEn: string) {
  const lower = labelEn.toLowerCase();
  if (lower.includes("price") || lower.includes("avg")) return DollarSign;
  if (lower.includes("inventory") || lower.includes("active")) return BarChart3;
  if (lower.includes("days") || lower.includes("market")) return Clock;
  if (lower.includes("score") || lower.includes("activity")) return Activity;
  if (lower.includes("sqft")) return Layers;
  return Home;
}

function parseValueToNumber(valueStr: string): number {
  const cleaned = valueStr.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function getPrefixFromValue(valueStr: string): string {
  return valueStr.startsWith("$") ? "$" : "";
}

// ---- Animated Counter ----
function AnimatedCounter({ target, prefix = "", suffix = "", duration = 2000 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ---- Coming Soon Placeholder ----
function ComingSoonPlaceholder({ title, description, comingSoonLabel }: { title: string; description: string; comingSoonLabel: string }) {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          {title}
        </CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px]">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-primary/60" />
        </div>
        <Badge variant="secondary" className="mb-2">{comingSoonLabel}</Badge>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </CardContent>
    </Card>
  );
}

export function MarketInsightsPage() {
  const { t, locale } = useI18n();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartTextColor = isDark ? "#9ca3af" : "#6b7280";
  const chartGridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const [activeType, setActiveType] = useState<string>("all");
  const [dataPoints, setDataPoints] = useState<MarketDataPoint[]>([]);
  const [stats, setStats] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch market data from API
  useEffect(() => {
    async function fetchMarketData() {
      try {
        setLoading(true);
        const res = await fetch("/api/market-data?period=monthly");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: MarketDataResponse = await res.json();
        setDataPoints(data.dataPoints || []);
        setStats(data.stats || []);
      } catch {
        setDataPoints([]);
        setStats([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketData();
  }, []);

  const months = locale === "ar" ? MONTHS_AR : MONTHS_EN;

  // Sort dataPoints by calendar month order
  const sortedDataPoints = useMemo(() => {
    return [...dataPoints].sort(
      (a, b) => MONTH_ORDER.indexOf(a.label) - MONTH_ORDER.indexOf(b.label)
    );
  }, [dataPoints]);

  // Localized price trends from API data
  const localizedPriceTrends = useMemo(() => {
    return sortedDataPoints.map((dp) => {
      const monthIdx = MONTH_ORDER.indexOf(dp.label);
      return {
        month: monthIdx >= 0 ? months[monthIdx] : dp.label,
        value: dp.value * 1000, // API stores in thousands
      };
    });
  }, [sortedDataPoints, months]);

  // Map API stats to metric card shape
  const metricCards = useMemo(() => {
    return stats.map((stat) => {
      const Icon = getStatIcon(stat.labelEn);
      const numericValue = parseValueToNumber(stat.value);
      const prefix = getPrefixFromValue(stat.value);
      const isUp = stat.changeType === "up";
      return {
        id: stat.id,
        label: locale === "ar" ? stat.labelAr : stat.labelEn,
        value: numericValue,
        prefix,
        icon: Icon,
        up: isUp,
        changeDisplay: stat.change,
      };
    });
  }, [stats, locale]);

  const typeFilters = [
    { key: "all", label: t("marketInsights.allTypes") },
    { key: "apartment", label: t("marketInsights.apartment") },
    { key: "villa", label: t("marketInsights.villa") },
    { key: "house", label: t("marketInsights.house") },
    { key: "condo", label: t("marketInsights.condo") },
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Compute YTD change from data points for hero indicator
  const ytdChange = useMemo(() => {
    if (sortedDataPoints.length < 2) return null;
    const first = sortedDataPoints[0]?.value ?? 0;
    const last = sortedDataPoints[sortedDataPoints.length - 1]?.value ?? 0;
    if (first === 0) return null;
    return ((last - first) / first * 100).toFixed(1);
  }, [sortedDataPoints]);

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/100/20 border-primary/20">
            <Zap className="w-3 h-3 me-1.5" />
            {t("marketInsights.heroBadge")}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("marketInsights.title")}</h1>
          <p className="text-muted-foreground max-w-2xl mb-6">{t("marketInsights.subtitle")}</p>
          {/* Animated market trend indicator */}
          {loading ? (
            <Skeleton className="h-10 w-48 rounded-full" />
          ) : ytdChange !== null ? (
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {parseFloat(ytdChange) >= 0 ? "+" : ""}{ytdChange}% YTD
                </span>
              </motion.div>
              <span className="text-sm text-muted-foreground">
                {t("marketInsights.activeMarket")}
              </span>
            </div>
          ) : null}
        </motion.div>

        {/* Key Market Metrics */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
        >
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <motion.div key={`skeleton-metric-${i}`} variants={staggerItem}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-12 h-4" />
                    </div>
                    <Skeleton className="h-7 w-24 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : metricCards.length > 0 ? (
            metricCards.map((metric) => (
              <motion.div key={metric.id} variants={staggerItem}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <metric.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs font-medium ${metric.up ? "text-primary" : "text-red-500"}`}>
                        {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {metric.changeDisplay}
                      </div>
                    </div>
                    <p className="text-xl md:text-2xl font-bold">
                      <AnimatedCounter target={metric.value} prefix={metric.prefix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div variants={staggerItem} className="col-span-full">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>{t("common.noResults")}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Price Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    {t("marketInsights.priceTrends")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t("marketInsights.priceTrendsDesc")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((f) => (
                    <Button
                      key={f.key}
                      variant={activeType === f.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveType(f.key)}
                      className="text-xs h-8"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="w-full h-[350px]" />
              ) : localizedPriceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={localizedPriceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, t("marketInsights.avgPrice")]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: chartTextColor }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={t("marketInsights.avgPrice")}
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
                  <p>{t("common.noResults")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Market Distribution + Neighborhood Prices — Coming Soon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ComingSoonPlaceholder
              title={t("marketInsights.marketDistribution")}
              description={t("marketInsights.marketDistributionDesc")}
              comingSoonLabel={t("dashboard.comingSoon")}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <ComingSoonPlaceholder
              title={t("marketInsights.neighborhoodPrices")}
              description={t("marketInsights.neighborhoodPricesDesc")}
              comingSoonLabel={t("dashboard.comingSoon")}
            />
          </motion.div>
        </div>

        {/* Market Heat Map — Coming Soon */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-10">
          <ComingSoonPlaceholder
            title={t("marketInsights.marketHeatMap")}
            description={t("marketInsights.marketHeatMapDesc")}
            comingSoonLabel={t("dashboard.comingSoon")}
          />
        </motion.div>

        {/* Top Performing Areas + Market Forecast — Coming Soon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <ComingSoonPlaceholder
              title={t("marketInsights.topAreas")}
              description={t("marketInsights.topAreasDesc")}
              comingSoonLabel={t("dashboard.comingSoon")}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <ComingSoonPlaceholder
              title={t("marketInsights.marketForecast")}
              description={t("marketInsights.marketForecastDesc")}
              comingSoonLabel={t("dashboard.comingSoon")}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
