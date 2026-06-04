"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useCompare } from "@/lib/compare";
import { motion } from "framer-motion";
import { ArrowRight, X, Scale, Bed, Bath, Maximize, MapPin, Calendar, Car, Tag, CheckCircle, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Property } from "@/components/real-estate/types/property";

const CHART_COLORS = ["#10b981", "#14b8a6", "#f59e0b"];

// Circular progress component for score cards
function CircularProgress({ value, size = 80, strokeWidth = 6, color = "#10b981" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

export function ComparePage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { compareList, removeFromCompare, clearCompare, compareCount } = useCompare();
  const { resolvedTheme } = useTheme();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = resolvedTheme === "dark";
  const chartTextColor = isDark ? "#9ca3af" : "#6b7280";
  const chartGridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    const fetchProperties = async () => {
      if (compareList.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          compareList.map(async (id) => {
            const res = await fetch(`/api/properties/${id}`);
            if (res.ok) return await res.json();
            return null;
          })
        );
        setProperties(results.filter(Boolean));
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [compareList]);

  const getTitle = (p: Property) => locale === "ar" ? p.titleAr : p.titleEn;
  const getLocation = (p: Property) => locale === "ar" ? p.locationAr : p.locationEn;
  const getImage = (p: Property) => {
    const imgs = p.images ? p.images.split(",") : [];
    return imgs[0] || "";
  };

  const formatPrice = (price: number) => `${t("common.currency")}${price.toLocaleString()}`;
  const pricePerSqft = (p: Property) => p.area > 0 ? Math.round(p.price / p.area) : 0;

  const getLowestPrice = () => {
    if (properties.length < 2) return -1;
    let minIdx = 0;
    for (let i = 1; i < properties.length; i++) {
      if (properties[i].price < properties[minIdx].price) minIdx = i;
    }
    return minIdx;
  };

  const getLargestArea = () => {
    if (properties.length < 2) return -1;
    let maxIdx = 0;
    for (let i = 1; i < properties.length; i++) {
      if (properties[i].area > properties[maxIdx].area) maxIdx = i;
    }
    return maxIdx;
  };

  // ---- Normalized scores for radar chart (0-100) ----
  const radarData = useMemo(() => {
    if (properties.length === 0) return [];

    const maxPrice = Math.max(...properties.map((p) => p.price), 1);
    const maxArea = Math.max(...properties.map((p) => p.area), 1);
    const maxBed = Math.max(...properties.map((p) => p.bedrooms), 1);
    const maxBath = Math.max(...properties.map((p) => p.bathrooms), 1);
    const currentYear = new Date().getFullYear();
    const maxYearBuilt = Math.max(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const minYearBuilt = Math.min(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const yearRange = maxYearBuilt - minYearBuilt || 1;

    // Price score: lower price = higher score (better value)
    const getPriceScore = (p: Property) => {
      return Math.round((1 - p.price / maxPrice) * 60 + 40);
    };

    // Year built score: newer = higher score
    const getYearBuiltScore = (p: Property) => {
      const year = p.yearBuilt || 1990;
      return Math.round(((year - minYearBuilt) / yearRange) * 60 + 40);
    };

    const dimensions = [
      { key: "priceScore", label: t("compare.priceScore") },
      { key: "sizeScore", label: t("compare.sizeScore") },
      { key: "bedroomScore", label: t("compare.bedroomScore") },
      { key: "bathroomScore", label: t("compare.bathroomScore") },
      { key: "yearBuiltScore", label: t("compare.yearBuiltScore") },
    ];

    return dimensions.map((dim) => {
      const entry: Record<string, string | number> = { dimension: dim.label };
      properties.forEach((p, idx) => {
        let score = 0;
        switch (dim.key) {
          case "priceScore":
            score = getPriceScore(p);
            break;
          case "sizeScore":
            score = Math.round((p.area / maxArea) * 100);
            break;
          case "bedroomScore":
            score = Math.round((p.bedrooms / maxBed) * 100);
            break;
          case "bathroomScore":
            score = Math.round((p.bathrooms / maxBath) * 100);
            break;
          case "yearBuiltScore":
            score = getYearBuiltScore(p);
            break;
        }
        entry[`prop${idx}`] = score;
      });
      return entry;
    });
  }, [properties, locale, t]);

  // ---- Price comparison bar chart data ----
  const priceBarData = useMemo(() => {
    return properties.map((p, idx) => ({
      name: getTitle(p).length > 15 ? getTitle(p).slice(0, 15) + "…" : getTitle(p),
      price: p.price,
      color: CHART_COLORS[idx],
    }));
  }, [properties, locale]);

  // ---- Area comparison bar chart data ----
  const areaBarData = useMemo(() => {
    return properties.map((p, idx) => ({
      name: getTitle(p).length > 15 ? getTitle(p).slice(0, 15) + "…" : getTitle(p),
      area: p.area,
      color: CHART_COLORS[idx],
    }));
  }, [properties, locale]);

  // ---- Feature comparison matrix ----
  const featureMatrix = useMemo(() => {
    if (properties.length === 0) return { allFeatures: [], matrix: [] };

    const featureSet = new Set<string>();
    properties.forEach((p) => {
      if (p.features) {
        p.features.split(",").forEach((f) => {
          const trimmed = f.trim();
          if (trimmed) featureSet.add(trimmed);
        });
      }
    });

    const allFeatures = Array.from(featureSet);
    const matrix = allFeatures.map((feature) => ({
      feature,
      hasIt: properties.map((p) => {
        const pFeatures = p.features ? p.features.split(",").map((f) => f.trim().toLowerCase()) : [];
        return pFeatures.includes(feature.toLowerCase());
      }),
    }));

    return { allFeatures, matrix };
  }, [properties]);

  // ---- Overall property scores ----
  const propertyScores = useMemo(() => {
    if (properties.length === 0) return [];
    const maxPrice = Math.max(...properties.map((p) => p.price), 1);
    const maxArea = Math.max(...properties.map((p) => p.area), 1);
    const maxBed = Math.max(...properties.map((p) => p.bedrooms), 1);
    const maxBath = Math.max(...properties.map((p) => p.bathrooms), 1);
    const currentYear = new Date().getFullYear();
    const maxYearBuilt = Math.max(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const minYearBuilt = Math.min(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const yearRange = maxYearBuilt - minYearBuilt || 1;

    return properties.map((p) => {
      const priceVal = Math.round((1 - p.price / maxPrice) * 60 + 40);
      const sizeVal = Math.round((p.area / maxArea) * 100);
      const bedVal = Math.round((p.bedrooms / maxBed) * 100);
      const bathVal = Math.round((p.bathrooms / maxBath) * 100);
      const yearVal = Math.round(((p.yearBuilt || 1990) - minYearBuilt) / yearRange * 60 + 40);
      const featureCount = p.features ? p.features.split(",").filter(Boolean).length : 0;
      const maxFeatureCount = Math.max(...properties.map((pp) => pp.features ? pp.features.split(",").filter(Boolean).length : 0), 1);
      const featureVal = Math.round((featureCount / maxFeatureCount) * 100);

      const overall = Math.round((priceVal * 0.25 + sizeVal * 0.2 + bedVal * 0.1 + bathVal * 0.1 + yearVal * 0.15 + featureVal * 0.2));

      return {
        property: p,
        overall: Math.min(overall, 98),
        breakdown: [
          { label: t("compare.priceValue"), value: priceVal, color: "#10b981" },
          { label: t("compare.sizeValue"), value: sizeVal, color: "#14b8a6" },
          { label: t("compare.amenitiesValue"), value: featureVal, color: "#f59e0b" },
          { label: t("compare.ageValue"), value: yearVal, color: "#06b6d4" },
        ],
      };
    });
  }, [properties, t]);

  // Custom tooltip for bar charts
  const PriceTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-popover-foreground">
            {t("common.currency")}{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const AreaTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-popover-foreground">
            {payload[0].value.toLocaleString()} {t("common.sqft")}
          </p>
        </div>
      );
    }
    return null;
  };

  const comparisonRows = [
    { label: t("compare.price"), icon: Tag, getValue: (p: Property) => formatPrice(p.price), highlight: (i: number) => i === getLowestPrice() },
    { label: t("compare.type"), icon: Scale, getValue: (p: Property) => t(`properties.${p.type}`), highlight: () => false },
    { label: t("compare.status"), icon: Scale, getValue: (p: Property) => p.status === "sale" ? t("common.forSale") : t("common.forRent"), highlight: () => false },
    { label: t("compare.bedrooms"), icon: Bed, getValue: (p: Property) => String(p.bedrooms), highlight: () => false },
    { label: t("compare.bathrooms"), icon: Bath, getValue: (p: Property) => String(p.bathrooms), highlight: () => false },
    { label: t("compare.area"), icon: Maximize, getValue: (p: Property) => `${p.area} ${t("common.sqft")}`, highlight: (i: number) => i === getLargestArea() },
    { label: t("compare.pricePerSqft"), icon: Tag, getValue: (p: Property) => `${t("common.currency")}${pricePerSqft(p)}/sqft`, highlight: (i: number) => i === getLowestPrice() },
    { label: t("compare.yearBuilt"), icon: Calendar, getValue: (p: Property) => p.yearBuilt ? String(p.yearBuilt) : "—", highlight: () => false },
    { label: t("compare.parking"), icon: Car, getValue: (p: Property) => String(p.parking), highlight: () => false },
    { label: t("compare.location"), icon: MapPin, getValue: (p: Property) => getLocation(p), highlight: () => false },
  ];

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("compare.title")}</h1>
              <p className="text-muted-foreground">{t("compare.subtitle")}</p>
            </div>
            {compareCount > 0 && (
              <Button variant="outline" onClick={clearCompare} className="gap-2">
                <X className="w-4 h-4" />
                {t("compare.clearAll")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-8">
            {/* ===== SCORE CARDS ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
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
                            <img src={getImage(score.property)} alt={getTitle(score.property)} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{getTitle(score.property)}</p>
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

            {/* ===== RADAR CHART ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
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
                          name={getTitle(p)}
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

            {/* ===== BAR CHARTS: Price & Area side by side (with gradient) ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Comparison Bar Chart with Gradient */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
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
                        <Tooltip content={<PriceTooltip />} />
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
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
                        <Tooltip content={<AreaTooltip />} />
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

            {/* ===== FEATURE COMPARISON TABLE ===== */}
            {featureMatrix.allFeatures.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
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
                                <span className="line-clamp-1">{getTitle(p)}</span>
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
            )}

            {/* ===== DETAILED TABLE COMPARISON ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
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
                                <div className="relative h-48 rounded-xl overflow-hidden mb-4 cursor-pointer" onClick={() => navigate("property-detail", { id: p.id })}>
                                  <img src={getImage(p)} alt={getTitle(p)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  <div className="absolute bottom-3 start-3 end-3">
                                    <p className="text-white font-bold text-lg line-clamp-1">{getTitle(p)}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 end-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                                    onClick={(e) => { e.stopPropagation(); removeFromCompare(p.id); }}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => navigate("property-detail", { id: p.id })}
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
                            const features = p.features ? p.features.split(",").map((f) => f.trim()) : [];
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
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Scale className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t("compare.emptyTitle")}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("compare.emptyDesc")}</p>
            <Button
              onClick={() => navigate("properties")}
              className="gap-2 rounded-full px-8"
            >
              {t("favorites.browseNow")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
