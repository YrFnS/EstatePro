"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  MapPin, Star, Bus, Shield, UtensilsCrossed, GraduationCap,
  TreePine, ShoppingBag, ArrowRight, Users, Briefcase, Heart,
  ChevronDown, Sparkles, TrendingUp, Home, Zap, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* API response shape */
interface ApiNeighborhood {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  avgPrice: string;
  propertyCount: number;
  searchQuery: string;
  image: string;
  featured: boolean;
  sortOrder: number;
}

/* Component data shape - API fields + computed UI defaults */
interface NeighborhoodData {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  avgPrice: string;
  propertyCount: number;
  searchQuery: string;
  image: string;
  // Computed UI defaults (not from API)
  walkScore: number;
  transitScore: number;
  safetyRating: number;
  restaurants: number;
  schools: number;
  parks: number;
  shopping: number;
  bestForKeys: string[];
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
}

/* Predefined map positions for up to 8 neighborhoods */
const mapPositions = [
  { x: 35, y: 40, w: 18, h: 14 },
  { x: 58, y: 55, w: 20, h: 16 },
  { x: 15, y: 65, w: 22, h: 18 },
  { x: 42, y: 30, w: 16, h: 12 },
  { x: 72, y: 35, w: 18, h: 15 },
  { x: 12, y: 30, w: 17, h: 13 },
  { x: 38, y: 12, w: 20, h: 14 },
  { x: 55, y: 75, w: 19, h: 14 },
];

/* Simple deterministic hash for consistent scores per neighborhood */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/* Parse avgPrice string to a numeric value for heuristics */
function parseAvgPrice(priceStr: string): number {
  const cleaned = priceStr.toLowerCase().replace(/[^0-9.km]/g, "");
  if (cleaned.includes("m")) {
    return parseFloat(cleaned) * 1000000;
  } else if (cleaned.includes("k")) {
    return parseFloat(cleaned) * 1000;
  }
  return parseFloat(cleaned) || 0;
}

/* Derive "best for" tags based on price and property count */
function deriveBestForKeys(nb: { avgPrice: string; propertyCount: number }): string[] {
  const keys: string[] = [];
  const priceNum = parseAvgPrice(nb.avgPrice);

  if (priceNum > 800000) keys.push("neighborhoodGuide.luxurySeekers");
  if (priceNum < 500000) keys.push("neighborhoodGuide.firstTimeBuyers");
  if (nb.propertyCount > 200) keys.push("neighborhoodGuide.investors");
  if (nb.propertyCount >= 100 && nb.propertyCount <= 200) keys.push("neighborhoodGuide.families");
  if (priceNum >= 500000 && priceNum <= 800000 && nb.propertyCount < 150) keys.push("neighborhoodGuide.retirees");

  if (keys.length === 0) {
    keys.push("neighborhoodGuide.youngProfessionals");
  }
  if (keys.length === 1) {
    keys.push("neighborhoodGuide.families");
  }
  return keys.slice(0, 2);
}

/* Map API neighborhoods to component data with computed UI defaults */
function mapApiToNeighborhoodData(apiNbs: ApiNeighborhood[]): NeighborhoodData[] {
  return apiNbs.map((nb, idx) => {
    const h = simpleHash(nb.id);
    const pos =
      idx < mapPositions.length
        ? mapPositions[idx]
        : { x: 10 + (idx % 4) * 22, y: 20 + Math.floor(idx / 4) * 30, w: 18, h: 14 };

    return {
      id: nb.id,
      nameEn: nb.nameEn,
      nameAr: nb.nameAr,
      descEn: nb.descEn,
      descAr: nb.descAr,
      avgPrice: nb.avgPrice,
      propertyCount: nb.propertyCount,
      searchQuery: nb.searchQuery,
      image: nb.image,
      walkScore: 62 + (h % 31),
      transitScore: 55 + ((h >> 4) % 34),
      safetyRating: 78 + ((h >> 8) % 15),
      restaurants: 15 + ((h >> 12) % 31),
      schools: 6 + ((h >> 16) % 13),
      parks: 5 + ((h >> 20) % 8),
      shopping: 10 + ((h >> 24) % 23),
      bestForKeys: deriveBestForKeys(nb),
      mapX: pos.x,
      mapY: pos.y,
      mapWidth: pos.w,
      mapHeight: pos.h,
    };
  });
}

/* SVG-based Interactive Map */
function InteractiveMap({
  neighborhoods,
  hoveredId,
  onHover,
  t,
  getLocalName,
}: {
  neighborhoods: NeighborhoodData[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  t: (key: string) => string;
  getLocalName: (nb: NeighborhoodData) => string;
}) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto max-h-[400px]" preserveAspectRatio="xMidYMid meet">
      {/* Background */}
      <rect x="0" y="0" width="100" height="100" fill="currentColor" className="text-muted/20" rx="4" />

      {/* Grid lines */}
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={v} y1="5" x2={v} y2="95" stroke="currentColor" className="text-border" strokeWidth="0.15" strokeDasharray="1 1" />
          <line x1="5" y1={v} x2="95" y2={v} stroke="currentColor" className="text-border" strokeWidth="0.15" strokeDasharray="1 1" />
        </g>
      ))}

      {/* Main roads */}
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" className="text-border" strokeWidth="0.5" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" className="text-border" strokeWidth="0.5" />
      <line x1="25" y1="5" x2="75" y2="95" stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="2 1" />

      {/* River/water */}
      <path
        d="M 75 5 Q 70 25 78 45 Q 85 65 72 95"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Neighborhood zones */}
      {neighborhoods.map((nb) => {
        const isHovered = hoveredId === nb.id;
        return (
          <g
            key={nb.id}
            onMouseEnter={() => onHover(nb.id)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer transition-all duration-300"
          >
            <rect
              x={nb.mapX}
              y={nb.mapY}
              width={nb.mapWidth}
              height={nb.mapHeight}
              rx="2"
              fill={isHovered ? "#059669" : "#10b981"}
              fillOpacity={isHovered ? 0.45 : 0.2}
              stroke={isHovered ? "#059669" : "#14b8a6"}
              strokeWidth={isHovered ? 0.6 : 0.3}
              className="transition-all duration-300"
            />
            <text
              x={nb.mapX + nb.mapWidth / 2}
              y={nb.mapY + nb.mapHeight / 2 + 1}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={isHovered ? "2.2" : "1.8"}
              fontWeight={isHovered ? "bold" : "normal"}
            >
              {getLocalName(nb)}
            </text>
            {isHovered && (
              <text
                x={nb.mapX + nb.mapWidth / 2}
                y={nb.mapY + nb.mapHeight / 2 + 4}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="1.3"
              >
                {nb.avgPrice}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <text x="5" y="98" className="fill-muted-foreground" fontSize="1.5">
        {t("neighborhoodGuide.hoverToExplore")}
      </text>
    </svg>
  );
}

/* Score bar component */
function ScoreBar({ value, maxVal = 100, color = "bg-primary", label, icon: Icon }: { value: number; maxVal?: number; color?: string; label: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold">{value}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${(value / maxVal) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* Loading skeleton card */
function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="bg-muted h-24 animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
      </CardContent>
    </Card>
  );
}

export function NeighborhoodGuidePage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [hoveredMapId, setHoveredMapId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Fetch neighborhoods from API */
  useEffect(() => {
    let cancelled = false;

    async function fetchNeighborhoods() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/neighborhoods");
        if (!res.ok) throw new Error("Failed to fetch neighborhoods");
        const data = await res.json();
        if (!cancelled) {
          const mapped = mapApiToNeighborhoodData(data.neighborhoods || []);
          setNeighborhoods(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setNeighborhoods([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNeighborhoods();
    return () => { cancelled = true; };
  }, []);

  /* Helper to get locale-appropriate name */
  const getLocalName = (nb: NeighborhoodData) =>
    locale === "ar" ? nb.nameAr || nb.nameEn : nb.nameEn;

  /* Helper to get locale-appropriate description */
  const getLocalDesc = (nb: NeighborhoodData) =>
    locale === "ar" ? nb.descAr || nb.descEn : nb.descEn;

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedNeighborhoods = useMemo(
    () => neighborhoods.filter((nb) => compareIds.includes(nb.id)),
    [compareIds, neighborhoods]
  );

  const bestForIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    "neighborhoodGuide.families": Users,
    "neighborhoodGuide.youngProfessionals": Briefcase,
    "neighborhoodGuide.retirees": Heart,
    "neighborhoodGuide.investors": TrendingUp,
    "neighborhoodGuide.luxurySeekers": Star,
    "neighborhoodGuide.firstTimeBuyers": Home,
    "neighborhoodGuide.petLovers": TreePine,
  };

  return (
    <div>
      {/* ====== Hero Section ====== */}
      <section className="relative overflow-hidden bg-foreground text-background py-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-primary/20 text-primary-foreground/80 border-primary/30 px-4 py-1.5 text-sm">
              <MapPin className="w-3.5 h-3.5 me-1.5" />
              {t("neighborhoodGuide.heroBadge")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
              {t("neighborhoodGuide.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80/90 max-w-2xl mx-auto leading-relaxed">
              {t("neighborhoodGuide.heroSubtitle")}
            </p>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80L1440 80L1440 30C1200 55 960 10 720 30C480 50 240 10 0 30L0 80Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ====== Interactive Map Section ====== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.mapTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.mapSubtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 md:p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : neighborhoods.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <MapPin className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">{t("neighborhoodGuide.noData") || "No neighborhood data available"}</p>
                  </div>
                ) : (
                  <InteractiveMap
                    neighborhoods={neighborhoods}
                    hoveredId={hoveredMapId}
                    onHover={setHoveredMapId}
                    t={t}
                    getLocalName={getLocalName}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ====== Neighborhood Cards ====== */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.cardsTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.cardsSubtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : neighborhoods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("neighborhoodGuide.noData") || "No neighborhoods found"}</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {neighborhoods.map((nb) => (
                <motion.div key={nb.id} variants={staggerItem}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group cursor-pointer">
                    {/* Gradient Header */}
                    <div className={`bg-primary p-5 relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                      <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-white/10" />
                      <h3 className="text-lg font-bold text-primary-foreground relative z-10">{getLocalName(nb)}</h3>
                      <span className="text-white/80 text-sm relative z-10">{nb.avgPrice}</span>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Scores */}
                      <div className="space-y-2">
                        <ScoreBar value={nb.walkScore} label={t("neighborhoodGuide.walkScore")} icon={MapPin} color="bg-primary" />
                        <ScoreBar value={nb.transitScore} label={t("neighborhoodGuide.transitScore")} icon={Bus} color="bg-primary" />
                        <ScoreBar value={nb.safetyRating} label={t("neighborhoodGuide.safetyRating")} icon={Shield} color="bg-amber-500" />
                      </div>

                      {/* Top amenities */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                          <span>{nb.restaurants}+</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          <span>{nb.schools}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TreePine className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{nb.parks}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                          <span>{nb.shopping}</span>
                        </div>
                      </div>

                      {/* Property count & browse button */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {nb.propertyCount} {t("neighborhoodGuide.properties")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-primary hover:text-primary"
                          onClick={() => navigate("properties", { search: nb.searchQuery || getLocalName(nb) })}
                        >
                          {t("neighborhoodGuide.browse")}
                          <ArrowRight className="w-3 h-3 ms-1" />
                        </Button>
                      </div>

                      {/* Best for tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {nb.bestForKeys.map((key) => {
                          const Icon = bestForIcons[key] || Star;
                          return (
                            <Badge key={key} variant="secondary" className="text-[10px] px-2 py-0.5">
                              <Icon className="w-2.5 h-2.5 me-1" />
                              {t(key)}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== Neighborhood Comparison Tool ====== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.compareTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.compareSubtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : neighborhoods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("neighborhoodGuide.noData") || "No neighborhoods to compare"}</p>
            </div>
          ) : (
            <>
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
                            {getLocalName(nb)}
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
                                      {getLocalName(nb)}
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
            </>
          )}
        </div>
      </section>

      {/* ====== Neighborhood Insights ====== */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.insightsTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.insightsSubtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-muted rounded animate-pulse w-full" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : neighborhoods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("neighborhoodGuide.noData") || "No insights available"}</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto"
            >
              {neighborhoods.map((nb) => (
                <motion.div key={nb.id} variants={staggerItem}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0`}>
                          <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{getLocalName(nb)}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{getLocalDesc(nb)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== Popular Areas Grid (Masonry-style) ====== */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.popularTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.popularSubtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          {loading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-md break-inside-avoid">
                  <div className="bg-muted animate-pulse h-48" />
                </Card>
              ))}
            </div>
          ) : neighborhoods.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("neighborhoodGuide.noData") || "No popular areas available"}</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
            >
              {neighborhoods.map((nb, idx) => (
                <motion.div key={nb.id} variants={staggerItem}>
                  <Card
                    className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 break-inside-avoid group cursor-pointer"
                    onClick={() => navigate("properties", { search: nb.searchQuery || getLocalName(nb) })}
                  >
                    <div className={`bg-primary relative overflow-hidden ${
                      idx % 3 === 0 ? "h-48" : idx % 3 === 1 ? "h-64" : "h-56"
                    }`}>
                      {/* Decorative elements */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                      <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -start-4 w-20 h-20 rounded-full bg-white/5" />

                      {/* Content overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-5">
                        <h3 className="text-xl font-bold text-primary-foreground mb-1">{getLocalName(nb)}</h3>
                        <p className="text-white/80 text-sm mb-2">{nb.avgPrice}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-white/20 text-primary-foreground border-white/30 text-xs">
                            <MapPin className="w-3 h-3 me-1" />
                            {nb.propertyCount} {t("neighborhoodGuide.properties")}
                          </Badge>
                          <Badge className="bg-white/20 text-primary-foreground border-white/30 text-xs">
                            <Zap className="w-3 h-3 me-1" />
                            {nb.walkScore} {t("neighborhoodGuide.walkScore")}
                          </Badge>
                        </div>
                      </div>

                      {/* Hover arrow */}
                      <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <ArrowRight className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
