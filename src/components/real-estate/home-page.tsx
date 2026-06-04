"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { motion } from "framer-motion";
import {
  Search, Home, Key, Users, ArrowRight,
  Building2, Shield, Store, Warehouse,
  Castle, Crown, Building, ArrowUpRight, ArrowDownRight,
  MapPin, Star, CheckCircle, Compass, Handshake, PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyCard } from "@/components/real-estate/property-card";
import { TestimonialCarousel } from "@/components/real-estate/testimonial-carousel";
import { RecentlyViewedSection } from "@/components/real-estate/recently-viewed-section";
import { SmartSearchBar } from "@/components/real-estate/smart-search-bar";
import { useEffect, useState, useMemo } from "react";

// Icon mapping for property type configs from DB
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Castle,
  Home,
  Building,
  Warehouse,
  Crown,
  Shield,
};

import { Property } from "@/components/real-estate/types/property";

interface PropertyTypeConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  type: string;
  icon: string;
  listingCount: number;
  featured: boolean;
  sortOrder: number;
}

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
  featured: boolean;
  sortOrder: number;
}

interface MarketDataPoint {
  id: string;
  label: string;
  value: number;
  period: string;
}

interface MarketStatData {
  id: string;
  labelEn: string;
  labelAr: string;
  value: string;
  change: string;
  changeType: string;
  sortOrder: number;
}

/* SVG Line Chart for Market Trends — clean, minimal */
function PriceChart({ dataPoints }: { dataPoints: { label: string; value: number }[] }) {
  const values = dataPoints.map((d) => d.value);
  const labels = dataPoints.map((d) => d.label);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 700;
  const height = 250;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const minVal = Math.min(...values) - 10;
  const maxVal = Math.max(...values) + 10;

  const getX = (i: number) => paddingX + (i / (values.length - 1)) * chartWidth;
  const getY = (val: number) => paddingY + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;

  const linePoints = values.map((val, i) => `${getX(i)},${getY(val)}`).join(" ");
  const areaPoints = `${getX(0)},${getY(minVal)} ${linePoints} ${getX(values.length - 1)},${getY(minVal)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet"
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <defs>
        <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(38, 90%, 55%)" stopOpacity="0.18" />
          <stop offset="50%" stopColor="hsl(38, 90%, 55%)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(38, 90%, 55%)" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingY + ratio * chartHeight;
        return (
          <line
            key={ratio}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        );
      })}

      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingY + ratio * chartHeight;
        const val = Math.round(maxVal - ratio * (maxVal - minVal));
        return (
          <text
            key={ratio}
            x={paddingX - 8}
            y={y + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            ${val}K
          </text>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        if (i % 2 === 0 || i === labels.length - 1) {
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 5}
              textAnchor="middle"
              className={`text-[10px] transition-all duration-200 ${hoveredIdx === i ? "fill-foreground font-bold" : "fill-muted-foreground"}`}
            >
              {label}
            </text>
          );
        }
        return null;
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#areaFill)" />

      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="hsl(38, 90%, 55%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hover interaction areas + data points */}
      {values.map((val, i) => (
        <g key={i}>
          {/* Invisible hover area */}
          <circle
            cx={getX(i)}
            cy={getY(val)}
            r="20"
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
            className="cursor-pointer"
          />
          {/* Visible data point */}
          <circle
            cx={getX(i)}
            cy={getY(val)}
            r={hoveredIdx === i ? 5 : 3}
            fill={hoveredIdx === i ? "hsl(38, 90%, 55%)" : "transparent"}
            stroke={hoveredIdx === i ? "hsl(38, 90%, 55%)" : "transparent"}
            strokeWidth="2"
            className="transition-all duration-200"
          />
          {/* Tooltip on hover */}
          {hoveredIdx === i && (
            <g>
              <rect
                x={getX(i) - 35}
                y={getY(val) - 32}
                width="70"
                height="22"
                rx="6"
                fill="var(--charcoal)"
                opacity="0.9"
              />
              <text
                x={getX(i)}
                y={getY(val) - 18}
                textAnchor="middle"
                className="fill-white text-[10px] font-semibold"
              >
                ${val}K
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Last point highlighted */}
      <circle
        cx={getX(values.length - 1)}
        cy={getY(values[values.length - 1])}
        r="4"
        fill="hsl(38, 90%, 55%)"
        stroke="var(--background)"
        strokeWidth="2"
      />
    </svg>
  );
}

// PLACEHOLDER fallback chart data — only used when /api/market-data fails
const fallbackChartData = [
  { label: "Jan", value: 420 },
  { label: "Feb", value: 435 },
  { label: "Mar", value: 450 },
  { label: "Apr", value: 445 },
  { label: "May", value: 460 },
  { label: "Jun", value: 475 },
  { label: "Jul", value: 490 },
  { label: "Aug", value: 510 },
  { label: "Sep", value: 525 },
  { label: "Oct", value: 540 },
  { label: "Nov", value: 560 },
  { label: "Dec", value: 580 },
];

export function HomePage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { getSetting, loading: settingsLoading } = useSiteSettings();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Dynamic data from APIs
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeConfig[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodData[]>([]);
  const [marketDataPoints, setMarketDataPoints] = useState<MarketDataPoint[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStatData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/properties?featured=true");
        const data = await res.json();
        setFeaturedProperties(data.properties || []);
      } catch {
        setFeaturedProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch dynamic content from APIs
  useEffect(() => {
    const fetchDynamicData = async () => {
      setDataLoading(true);
      try {
        const [ptRes, nbRes, mdRes] = await Promise.all([
          fetch("/api/property-types").catch(() => null),
          fetch("/api/neighborhoods").catch(() => null),
          fetch(`/api/market-data?period=${trendPeriod}`).catch(() => null),
        ]);

        if (ptRes?.ok) {
          const ptData = await ptRes.json();
          setPropertyTypes(ptData.propertyTypes || []);
        }

        if (nbRes?.ok) {
          const nbData = await nbRes.json();
          setNeighborhoods(nbData.neighborhoods || []);
        }

        if (mdRes?.ok) {
          const mdData = await mdRes.json();
          setMarketDataPoints(mdData.dataPoints || []);
          setMarketStats(mdData.stats || []);
        }
      } catch {
        // Silently fail - fallbacks will be used
      } finally {
        setDataLoading(false);
      }
    };
    fetchDynamicData();
  }, [trendPeriod]);

  // Hero text from settings with fallbacks
  const heroEyebrow = getSetting("hero.eyebrow", locale) || "EstatePro";
  const heroTitle = getSetting("hero.title", locale) || t("hero.title");
  const heroSubtitle = getSetting("hero.subtitle", locale) || t("hero.subtitle");

  // Stats from settings — empty string when not configured
  const statsData = useMemo(() => [
    {
      label: t("stats.propertiesSold"),
      value: getSetting("stats.propertiesSold", locale) || "",
    },
    {
      label: t("stats.happyClients"),
      value: getSetting("stats.happyClients", locale) || "",
    },
    {
      label: t("stats.expertAgents"),
      value: getSetting("stats.expertAgents", locale) || "",
    },
  ], [locale, getSetting, t]);

  // Property types: use API data, fall back to hardcoded
  const displayPropertyTypes = useMemo(() => {
    if (propertyTypes.length > 0) {
      return propertyTypes.map((pt) => ({
        icon: iconMap[pt.icon] || Building2,
        name: locale === "ar" ? pt.nameAr : pt.nameEn,
        listings: pt.listingCount,
        type: pt.type,
      }));
    }
    // ESTIMATE fallback — listing counts are approximations
    return [
      { icon: Building2, name: t("propertyTypes.apartments"), listings: 45, type: "apartment" },
      { icon: Castle, name: t("propertyTypes.villas"), listings: 23, type: "villa" },
      { icon: Home, name: t("propertyTypes.houses"), listings: 31, type: "house" },
      { icon: Building, name: t("propertyTypes.condos"), listings: 18, type: "condo" },
      { icon: Building2, name: t("propertyTypes.townhouses"), listings: 12, type: "townhouse" },
      { icon: Crown, name: t("propertyTypes.penthouses"), listings: 8, type: "penthouse" },
    ];
  }, [propertyTypes, locale, t]);

  // Neighborhoods: use API data, fall back to hardcoded
  const displayNeighborhoods = useMemo(() => {
    if (neighborhoods.length > 0) {
      return neighborhoods.map((nb) => ({
        name: locale === "ar" ? nb.nameAr : nb.nameEn,
        desc: locale === "ar" ? nb.descAr : nb.descEn,
        avgPrice: nb.avgPrice,
        properties: nb.propertyCount,
        searchQuery: nb.searchQuery,
        image: nb.image,
      }));
    }
    // Fallback
    return [
      {
        name: t("neighborhoods.downtown"),
        desc: t("neighborhoods.downtownDesc"),
        avgPrice: "$850K",
        properties: 124,
        searchQuery: "Downtown",
        image: "",
      },
      {
        name: t("neighborhoods.waterfront"),
        desc: t("neighborhoods.waterfrontDesc"),
        avgPrice: "$1.2M",
        properties: 89,
        searchQuery: "Waterfront",
        image: "",
      },
    ];
  }, [neighborhoods, locale, t]);

  // Market stats: use API data, fall back to hardcoded
  const displayMarketStats = useMemo(() => {
    if (marketStats.length > 0) {
      return marketStats.map((ms) => ({
        label: locale === "ar" ? ms.labelAr : ms.labelEn,
        value: ms.value,
        change: ms.change,
        changeType: ms.changeType as "up" | "down",
      }));
    }
    // Fallback
    return [
      {
        label: t("marketTrends.avgHomePrice"),
        value: "$685,000",
        change: "+5.2%",
        changeType: "up" as const,
      },
      {
        label: t("marketTrends.inventory"),
        value: "2,450",
        change: "-12%",
        changeType: "down" as const,
      },
      {
        label: t("marketTrends.daysOnMarket"),
        value: "34",
        change: "-8%",
        changeType: "down" as const,
      },
    ];
  }, [marketStats, locale, t]);

  // Chart data: use API data, fall back to hardcoded
  const chartData = useMemo(() => {
    if (marketDataPoints.length > 0) {
      return marketDataPoints.map((dp) => ({ label: dp.label, value: dp.value }));
    }
    return fallbackChartData;
  }, [marketDataPoints]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.search = searchQuery;
    if (propertyType && propertyType !== "any") params.type = propertyType;
    if (status && status !== "any") params.status = status;
    if (priceRange && priceRange !== "any") {
      if (priceRange.includes("-")) {
        const [min, max] = priceRange.split("-");
        params.minPrice = min;
        params.maxPrice = max;
      } else if (priceRange === "1000000+") {
        params.minPrice = "1000000";
      }
    }
    if (bedrooms && bedrooms !== "any") params.bedrooms = bedrooms;
    navigate("properties", params);
  };

  const categories = [
    {
      icon: Home,
      title: t("categories.buyHome"),
      desc: t("categories.buyHomeDesc"),
      view: "properties" as const,
      params: { status: "sale" },
    },
    {
      icon: Key,
      title: t("categories.rentHome"),
      desc: t("categories.rentHomeDesc"),
      view: "properties" as const,
      params: { status: "rent" },
    },
    {
      icon: Users,
      title: t("categories.findAgent"),
      desc: t("categories.findAgentDesc"),
      view: "agents" as const,
      params: {},
    },
    {
      icon: Store,
      title: t("categories.sellHome"),
      desc: t("categories.sellHomeDesc"),
      view: "list-property" as const,
      params: {},
    },
  ];

  return (
    <div>
      {/* ====== 1. Hero Section — Atmospheric Photography + Bold Typography ====== */}
      <section className="relative overflow-hidden min-h-[85dvh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 bg-[url('/hero-image.png')] bg-cover bg-center" />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/70 to-foreground/60 animate-hero-gradient" />

        <div className="relative container mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="text-xs tracking-[0.2em] uppercase text-white/50 mb-6"
            >
              {settingsLoading ? (
                <Skeleton className="h-4 w-32 mx-auto bg-white/20" />
              ) : (
                <span>{heroEyebrow}</span>
              )}
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
              style={{ letterSpacing: "-0.04em" }}
            >
              {settingsLoading ? (
                <Skeleton className="h-16 w-96 mx-auto bg-white/20" />
              ) : (
                <h1>{heroTitle}</h1>
              )}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="text-lg text-white/70 max-w-2xl mx-auto mb-10"
            >
              {settingsLoading ? (
                <Skeleton className="h-6 w-[500px] mx-auto bg-white/20" />
              ) : (
                <p>{heroSubtitle}</p>
              )}
            </motion.div>

            {/* AI-Powered Smart Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <SmartSearchBar
                darkBackground
                placeholder={t("search.smartSearchHint")}
              />
            </motion.div>

            {/* Advanced Filters — traditional dropdowns below smart search */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="mt-4"
            >
              <form onSubmit={handleSearch}>
                <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-white/10 border-white/15 text-white/70">
                        <SelectValue placeholder={t("hero.anyType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("hero.anyType")}</SelectItem>
                        <SelectItem value="apartment">{t("properties.apartment")}</SelectItem>
                        <SelectItem value="villa">{t("properties.villa")}</SelectItem>
                        <SelectItem value="house">{t("properties.house")}</SelectItem>
                        <SelectItem value="condo">{t("properties.condo")}</SelectItem>
                        <SelectItem value="townhouse">{t("properties.townhouse")}</SelectItem>
                        <SelectItem value="penthouse">{t("properties.penthouse")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-[110px] h-8 text-xs bg-white/10 border-white/15 text-white/70">
                        <SelectValue placeholder={t("common.all")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("common.all")}</SelectItem>
                        <SelectItem value="sale">{t("common.sale")}</SelectItem>
                        <SelectItem value="rent">{t("common.rent")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="w-[130px] h-8 text-xs bg-white/10 border-white/15 text-white/70">
                        <SelectValue placeholder={t("hero.priceRange")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("hero.noMin")}</SelectItem>
                        <SelectItem value="0-200000">$0 – $200K</SelectItem>
                        <SelectItem value="200000-500000">$200K – $500K</SelectItem>
                        <SelectItem value="500000-1000000">$500K – $1M</SelectItem>
                        <SelectItem value="1000000+">$1M+</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger className="w-[90px] h-8 text-xs bg-white/10 border-white/15 text-white/70">
                        <SelectValue placeholder={t("hero.anyBeds")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("hero.anyBeds")}</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      size="sm"
                      className="btn-gold rounded-full px-4 h-8 text-xs shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 me-1.5" />
                      {t("hero.searchNow")}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====== Trust Bar — Social Proof ====== */}
      <section className="bg-[var(--charcoal)] text-[hsl(38,30%,90%)]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 py-8"
          >
            {[
              {
                value: getSetting("stats.propertiesSold", locale) || "",
                label: t("stats.propertiesSold"),
                icon: Building2,
              },
              {
                value: getSetting("stats.happyClients", locale) || "",
                label: t("stats.happyClients"),
                icon: Users,
              },
              {
                value: getSetting("stats.expertAgents", locale) || "",
                label: t("stats.expertAgents"),
                icon: Shield,
              },
              {
                value: getSetting("stats.clientRating", locale) || "",
                label: t("stats.customerRating"),
                icon: Star,
              },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3 sm:gap-4">
                {idx > 0 && (
                  <div className="hidden sm:block w-px h-10 bg-[hsl(38,15%,35%)] mx-4" />
                )}
                <stat.icon className="w-5 h-5 text-[var(--gold)] shrink-0" />
                <div>
                  <div className="text-xl font-bold animate-shimmer" style={{ letterSpacing: "-0.02em" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-[hsl(38,20%,60%)]">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== 2. Browse by Category — Clean Icon Grid (NOT cards) ====== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-2">{t("categories.title")}</h2>
            <p className="text-muted-foreground">{t("featured.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((cat, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => navigate(cat.view, cat.params)}
                className="group bg-muted/50 rounded-2xl p-6 text-center hover:bg-muted hover:shadow-md transition-all duration-300"
              >
                <cat.icon className="w-6 h-6 text-[var(--gold)] mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-sm font-semibold mb-1">{cat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== How It Works — 3-Step Process ====== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-2">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("howItWorks.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Search,
                title: t("howItWorks.step1Title"),
                desc: t("howItWorks.step1Desc"),
              },
              {
                step: "02",
                icon: Handshake,
                title: t("howItWorks.step2Title"),
                desc: t("howItWorks.step2Desc"),
              },
              {
                step: "03",
                icon: PartyPopper,
                title: t("howItWorks.step3Title"),
                desc: t("howItWorks.step3Desc"),
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.32, 0.72, 0, 1] }}
                className="relative text-center"
              >
                {/* Connector line between steps — hidden on mobile, dashed with animated fill */}
                {idx < 2 && (
                  <svg className="hidden md:block absolute top-10 start-[calc(50%+40px)] end-0 h-px w-[calc(100%-80px)]" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--gold)" strokeWidth="1" opacity="0.3" />
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--gold)" strokeWidth="1.5" className="animate-dash-fill" />
                  </svg>
                )}
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border mb-6 relative shadow-sm hover:shadow-md transition-shadow duration-300">
                  <item.icon className="w-8 h-8 text-[var(--gold)]" />
                  <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-[var(--charcoal)] text-white text-xs font-bold flex items-center justify-center ring-2 ring-background">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 3. Featured Properties — Asymmetric Layout ====== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <h2 className="text-3xl font-bold section-heading">{t("featured.title")}</h2>
              <p className="text-muted-foreground mt-4">{t("featured.subtitle")}</p>
            </div>
            <button
              onClick={() => navigate("properties")}
              className="text-sm font-medium text-[var(--gold)] inline-flex items-center gap-1.5 group"
            >
              {t("featured.seeAll")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-52 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* First property — large, spans 2 rows on desktop */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="lg:row-span-2"
              >
                <PropertyCard property={featuredProperties[0]} />
              </motion.div>
              {/* Rest of properties in a stack */}
              {featuredProperties.slice(1, 5).map((property, idx) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (idx + 1) * 0.08, ease: [0.32, 0.72, 0, 1] }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
        </div>
      </section>

      {/* ====== 4. Why EstatePro — Stats Row (NOT cards with icons) ====== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-3xl mx-auto"
          >
            {settingsLoading ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-10 w-24 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16">
                {statsData.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-8 sm:gap-12 md:gap-16">
                    {idx > 0 && (
                      <div className="hidden sm:block warm-divider w-12" />
                    )}
                    <div className="text-center">
                      <div className="stat-number text-foreground">{stat.value}</div>
                      <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ====== 5. Property Types — Horizontal Scroll (NOT grid) ====== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold section-heading">{t("propertyTypes.title")}</h2>
            <p className="text-muted-foreground mt-4">{t("propertyTypes.subtitle")}</p>
          </motion.div>

          {dataLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0">
                  <Skeleton className="h-16 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scroll-x-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayPropertyTypes.map((pt, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate("properties", { type: pt.type })}
                  className="group flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 shrink-0 hover:border-[var(--gold)]/30 transition-colors duration-300"
                >
                  <pt.icon className="w-5 h-5 text-[var(--gold)] shrink-0" />
                  <div className="text-start">
                    <div className="text-sm font-semibold">{pt.name}</div>
                    <div className="text-xs text-muted-foreground">{pt.listings} {t("propertyTypes.listings")}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[var(--gold)] transition-colors shrink-0 ms-2" />
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== 6. Popular Neighborhoods — Image + Text Overlap ====== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold">{t("neighborhoods.title")}</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t("neighborhoods.subtitle")}</p>
          </motion.div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {displayNeighborhoods.map((nb, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.32, 0.72, 0, 1] }}
                >
                  <button
                    onClick={() => navigate("properties", { search: nb.searchQuery })}
                    className="group relative w-full rounded-2xl overflow-hidden aspect-[4/3] block"
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: nb.image
                          ? `url('${nb.image}')`
                          : "url('/hero-image.png')",
                      }}
                    />
                    {/* Subtle dark gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
                    {/* Content overlaid at bottom */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{nb.name}</h3>
                          <p className="text-sm text-white/70 leading-relaxed">{nb.desc}</p>
                        </div>
                        <div className="shrink-0 ms-4">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/25 hover:bg-white/30">
                            <MapPin className="w-3 h-3 me-1" />
                            {nb.properties} {t("neighborhoods.properties")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/15">
                        <div>
                          <span className="text-white/50 text-xs block">{t("neighborhoods.avgPrice")}</span>
                          <span className="text-white font-bold">{nb.avgPrice}</span>
                        </div>
                        <span className="text-sm text-white/70 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                          {t("neighborhoods.explore")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====== 7. Market Trends — Clean Data (NOT stat cards + chart) ====== */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-bold section-heading">{t("marketTrends.title")}</h2>
                <p className="text-muted-foreground mt-4">{t("marketTrends.subtitle")}</p>
              </div>
              {/* Time period toggle — simple tabs */}
              <div className="flex items-center border border-border rounded-lg p-0.5">
                {(["monthly", "quarterly", "yearly"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTrendPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      trendPeriod === period
                        ? "bg-[var(--charcoal)] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`marketTrends.${period}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Key metrics — 3 stats in a row, no cards */}
            {dataLoading ? (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-10">
                {displayMarketStats.map((ms, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div>
                      <div className="text-2xl font-bold tracking-tight">{ms.value}</div>
                      <div className="text-xs text-muted-foreground">{ms.label}</div>
                    </div>
                    {ms.change && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          ms.changeType === "up"
                            ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ms.changeType === "up" ? (
                          <ArrowUpRight className="w-3 h-3 me-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 me-0.5" />
                        )}
                        {ms.change}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Chart */}
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-sm font-semibold mb-4">{t("marketTrends.priceTrend")}</h3>
              {dataLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <PriceChart dataPoints={chartData} />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== 8. Testimonials ====== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold">{t("testimonials.title")}</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">{t("testimonials.subtitle")}</p>
          </motion.div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ====== 9. Recently Viewed ====== */}
      <RecentlyViewedSection />

      {/* ====== 10. CTA Section — Full-width dark section ====== */}
      <section className="bg-[var(--charcoal)] text-[hsl(38,30%,90%)]">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
              {t("cta.title")}
            </h2>
            <p className="text-[hsl(38,20%,65%)] text-lg mb-10 leading-relaxed">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("properties")}
                className="btn-gold rounded-xl px-8 h-12 text-base"
              >
                {t("cta.startSearch")}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("agents")}
                className="border-[hsl(38,20%,50%)] text-[hsl(38,30%,90%)] hover:bg-[hsl(38,10%,25%)] rounded-xl px-8 h-12 text-base"
              >
                {t("cta.contactAgent")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
