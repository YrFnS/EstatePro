"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Grid3X3, List, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Map, MapPin, Star, Bath, Bed, Maximize, BookmarkPlus, Clock, Home, Pencil, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PropertyCard } from "@/components/real-estate/property-card";
import { PropertyMapWithPanel } from "@/components/real-estate/property-map";
import { InteractivePropertyMap } from "@/components/real-estate/interactive-property-map";
import type { MapProperty } from "@/components/real-estate/interactive-property-map";
import { toast } from "sonner";

import type { Property } from "@/components/real-estate/types/property";

// Default fallback property types (used while API data loads)
const DEFAULT_PROPERTY_TYPES = ["apartment", "villa", "house", "condo", "townhouse", "penthouse"];
const bedroomOptions = [1, 2, 3, 4, 5];
const bathroomOptions = [1, 2, 3, 4];
const areaOptions = [500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000];

// ──────────────────────── localStorage helpers ────────────────────────

const SAVED_SEARCHES_KEY = "estatepro-saved-searches";
const RECENT_SEARCHES_KEY = "estatepro-recent-searches";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SAVED_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSavedSearches(searches: SavedSearch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}

function loadRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveRecentSearches(searches: RecentSearch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 5)));
}

function addRecentSearch(query: string) {
  if (!query.trim()) return;
  const searches = loadRecentSearches().filter(s => s.query !== query.trim());
  searches.unshift({ query: query.trim(), timestamp: Date.now() });
  saveRecentSearches(searches.slice(0, 5));
}

// ──────────────────────── SVG Map Grid Component ────────────────────────

function SVGPropertyMap({
  properties,
  locale,
  t,
  navigate,
}: {
  properties: Property[];
  locale: string;
  t: (key: string) => string;
  navigate: (view: string, params?: Record<string, string>) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gridCols = Math.ceil(Math.sqrt(properties.length));
  const gridRows = Math.ceil(properties.length / gridCols);

  const getCellCenter = (index: number) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
    return { x: col * 100 + 50, y: row * 80 + 40 };
  };

  const selectedProperty = selectedId ? properties.find(p => p.id === selectedId) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
      {/* SVG Map Grid */}
      <div className="flex-1 rounded-xl border bg-muted/10 overflow-hidden relative">
        <svg
          viewBox={`0 0 ${gridCols * 100} ${gridRows * 80 + 20}`}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        >
          {/* Grid lines */}
          {Array.from({ length: gridCols + 1 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1={0} x2={i * 100} y2={gridRows * 80 + 20} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
          ))}
          {Array.from({ length: gridRows + 1 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 80} x2={gridCols * 100} y2={i * 80} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
          ))}

          {/* Street labels */}
          {Array.from({ length: gridCols }).map((_, i) => (
            <text key={`st-${i}`} x={i * 100 + 50} y={12} textAnchor="middle" className="fill-muted-foreground/40 text-[9px]" fontSize="9">
              {["Main St", "Oak Ave", "Park Blvd", "Elm Dr", "Cedar Ln", "Pine Rd", "Maple Way"][i % 7]}
            </text>
          ))}

          {/* Property markers */}
          {properties.map((property, index) => {
            const center = getCellCenter(index);
            const isHovered = hoveredId === property.id;
            const isSelected = selectedId === property.id;
            const title = locale === "ar" ? property.titleAr : property.titleEn;
            const markerSize = isSelected ? 28 : isHovered ? 24 : 20;

            return (
              <g
                key={property.id}
                onMouseEnter={() => setHoveredId(property.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(property.id === selectedId ? null : property.id)}
                className="cursor-pointer"
              >
                {/* Pulse ring for selected */}
                {isSelected && (
                  <circle cx={center.x} cy={center.y} r={markerSize + 8} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary) / 0.3)" strokeWidth={2}>
                    <animate attributeName="r" values={`${markerSize + 8};${markerSize + 14};${markerSize + 8}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Building shape */}
                <rect
                  x={center.x - markerSize / 2}
                  y={center.y - markerSize / 2}
                  width={markerSize}
                  height={markerSize}
                  rx={4}
                  fill={isSelected ? "hsl(var(--primary))" : isHovered ? "hsl(var(--primary) / 0.8)" : "hsl(var(--primary) / 0.6)"}
                  stroke="white"
                  strokeWidth={2}
                />

                {/* Home icon */}
                <text
                  x={center.x}
                  y={center.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={markerSize * 0.5}
                  fill="white"
                >
                  🏠
                </text>

                {/* Price label */}
                <rect
                  x={center.x - 28}
                  y={center.y + markerSize / 2 + 4}
                  width={56}
                  height={16}
                  rx={8}
                  fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.85)"}
                />
                <text
                  x={center.x}
                  y={center.y + markerSize / 2 + 14}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  fontWeight="600"
                >
                  ${property.price >= 1000000 ? `${(property.price / 1000000).toFixed(1)}M` : `${Math.round(property.price / 1000)}K`}
                </text>

                {/* Hover tooltip */}
                {isHovered && !isSelected && (
                  <>
                    <rect x={center.x - 60} y={center.y - markerSize / 2 - 44} width={120} height={38} rx={6} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
                    <text x={center.x} y={center.y - markerSize / 2 - 28} textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--foreground))" className="truncate">
                      {title.length > 18 ? title.slice(0, 18) + "…" : title}
                    </text>
                    <text x={center.x} y={center.y - markerSize / 2 - 14} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
                      {property.bedrooms}B | {property.bathrooms}Ba | {property.area} sqft
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 start-3 flex items-center gap-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary/60" />
            Property
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary ring-2 ring-primary/30" />
            Selected
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>{properties.length} {t("properties.results")}</span>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-72 shrink-0 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {properties.length} {t("properties.results")}
          </h3>
        </div>
        <ScrollArea className="flex-1 max-h-[460px]">
          <div className="p-2 space-y-2">
            {selectedProperty ? (
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
                <div className="flex items-start gap-2">
                  <Home className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {locale === "ar" ? selectedProperty.titleAr : selectedProperty.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {locale === "ar" ? selectedProperty.locationAr : selectedProperty.locationEn}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        {t("common.currency")}{selectedProperty.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{selectedProperty.bedrooms}</span>
                        <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{selectedProperty.bathrooms}</span>
                        <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{selectedProperty.area}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => navigate("property-detail", { id: selectedProperty.id })}
                    >
                      {t("common.viewDetails")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t("mapView.selectProperty") || "Select a property"}
                </p>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground mb-2 px-1">All Properties</p>
              {properties.map((property) => {
                const title = locale === "ar" ? property.titleAr : property.titleEn;
                const isSelected = selectedId === property.id;
                return (
                  <div
                    key={property.id}
                    onClick={() => setSelectedId(property.id === selectedId ? null : property.id)}
                    className={`cursor-pointer rounded-lg border p-2 mb-1.5 transition-all duration-200 ${
                      isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-xs truncate flex-1">{title}</p>
                      <span className="text-xs font-bold text-primary shrink-0 ms-2">
                        {t("common.currency")}{property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ──────────────────────────── Filters Panel ────────────────────────────

function FiltersPanel({
  t,
  locale,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  bedroomsFilter,
  setBedroomsFilter,
  bathroomsFilter,
  setBathroomsFilter,
  priceRange,
  setPriceRange,
  minArea,
  setMinArea,
  maxArea,
  setMaxArea,
  featuredOnly,
  setFeaturedOnly,
  hasActiveFilters,
  clearFilters,
  setPage,
  propertyTypes,
}: {
  t: (key: string) => string;
  locale: string;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  bedroomsFilter: number | null;
  setBedroomsFilter: (v: number | null) => void;
  bathroomsFilter: number | null;
  setBathroomsFilter: (v: number | null) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  minArea: string;
  setMinArea: (v: string) => void;
  maxArea: string;
  setMaxArea: (v: string) => void;
  featuredOnly: boolean;
  setFeaturedOnly: (v: boolean) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  setPage: (v: number) => void;
  propertyTypes: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Featured Only Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="featured-toggle" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
          <Star className="w-4 h-4 text-primary" />
          {t("properties.featuredOnly")}
        </Label>
        <Switch
          id="featured-toggle"
          checked={featuredOnly}
          onCheckedChange={(checked) => {
            setFeaturedOnly(checked);
            setPage(1);
          }}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Status */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("common.sale")}/{t("common.rent")}
        </label>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("properties.any")}</SelectItem>
            <SelectItem value="sale">{t("common.forSale")}</SelectItem>
            <SelectItem value="rent">{t("common.forRent")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("properties.propertyType")}
        </label>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("properties.any")}</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`properties.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("properties.bedrooms")}
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={bedroomsFilter === null ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => { setBedroomsFilter(null); setPage(1); }}
          >
            {t("properties.any")}
          </Button>
          {bedroomOptions.map((n) => (
            <Button
              key={n}
              variant={bedroomsFilter === n ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => { setBedroomsFilter(n); setPage(1); }}
            >
              {n}+
            </Button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("properties.bathrooms")}
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={bathroomsFilter === null ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={() => { setBathroomsFilter(null); setPage(1); }}
          >
            {t("properties.any")}
          </Button>
          {bathroomOptions.map((n) => (
            <Button
              key={n}
              variant={bathroomsFilter === n ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => { setBathroomsFilter(n); setPage(1); }}
            >
              {n}+
            </Button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Price Range */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("properties.priceRange")}
        </label>
        <div className="flex items-center justify-between text-sm font-medium mb-3">
          <span>{t("common.currency")}{priceRange[0].toLocaleString()}</span>
          <span className="text-muted-foreground">—</span>
          <span>{t("common.currency")}{priceRange[1].toLocaleString()}</span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={(v) => { setPriceRange(v as [number, number]); setPage(1); }}
          min={0}
          max={5000000}
          step={50000}
        />
      </div>

      {/* Area Range */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">
          {t("properties.areaRange")} ({t("common.sqft")})
        </label>
        <div className="flex items-center gap-2">
          <Select value={minArea} onValueChange={(v) => { setMinArea(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("properties.minArea")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("properties.any")}</SelectItem>
              {areaOptions.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a.toLocaleString()} {t("common.sqft")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-xs">—</span>
          <Select value={maxArea} onValueChange={(v) => { setMaxArea(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("properties.maxArea")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("properties.any")}</SelectItem>
              {areaOptions.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a.toLocaleString()} {t("common.sqft")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full gap-2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
            {t("properties.clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────── Active Filter Badges ────────────────────────

function ActiveFilterBadges({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  bedroomsFilter,
  setBedroomsFilter,
  bathroomsFilter,
  setBathroomsFilter,
  minArea,
  setMinArea,
  maxArea,
  setMaxArea,
  featuredOnly,
  setFeaturedOnly,
  priceRange,
  t,
  setPage,
}: {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  bedroomsFilter: number | null;
  setBedroomsFilter: (v: number | null) => void;
  bathroomsFilter: number | null;
  setBathroomsFilter: (v: number | null) => void;
  minArea: string;
  setMinArea: (v: string) => void;
  maxArea: string;
  setMaxArea: (v: string) => void;
  featuredOnly: boolean;
  setFeaturedOnly: (v: boolean) => void;
  priceRange: [number, number];
  t: (key: string) => string;
  setPage: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statusFilter !== "all" && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          {statusFilter === "sale" ? t("common.forSale") : t("common.forRent")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setStatusFilter("all"); setPage(1); }}
          />
        </Badge>
      )}
      {typeFilter !== "all" && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          {t(`properties.${typeFilter}`)}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setTypeFilter("all"); setPage(1); }}
          />
        </Badge>
      )}
      {bedroomsFilter && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          {bedroomsFilter}+ {t("properties.bedrooms")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setBedroomsFilter(null); setPage(1); }}
          />
        </Badge>
      )}
      {bathroomsFilter && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          {bathroomsFilter}+ {t("properties.bathrooms")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setBathroomsFilter(null); setPage(1); }}
          />
        </Badge>
      )}
      {(priceRange[0] > 0 || priceRange[1] < 5000000) && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          {t("common.currency")}{priceRange[0].toLocaleString()}–{t("common.currency")}{priceRange[1].toLocaleString()}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setPage(1); }}
          />
        </Badge>
      )}
      {minArea !== "any" && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          ≥{minArea} {t("common.sqft")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setMinArea("any"); setPage(1); }}
          />
        </Badge>
      )}
      {maxArea !== "any" && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          ≤{maxArea} {t("common.sqft")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setMaxArea("any"); setPage(1); }}
          />
        </Badge>
      )}
      {featuredOnly && (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
          <Star className="w-3 h-3" />
          {t("properties.featuredOnly")}
          <X
            className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => { setFeaturedOnly(false); setPage(1); }}
          />
        </Badge>
      )}
    </div>
  );
}

// ──────────────────────────── Loading Skeletons ────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-xl">
          <div className="h-52 bg-muted animate-pulse" />
          <CardContent className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-xl">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-64 h-48 sm:h-auto bg-muted animate-pulse shrink-0" />
            <CardContent className="p-4 flex-1 space-y-3">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
      <div className="flex-1 rounded-xl border bg-muted/30 animate-pulse" />
      <div className="w-full lg:w-80 rounded-xl border bg-muted/30 animate-pulse" />
    </div>
  );
}

// ──────────────────────────── Main Component ────────────────────────────

export function PropertiesPage() {
  const { t, locale } = useI18n();
  const { params, navigate } = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(params.search || "");
  const [statusFilter, setStatusFilter] = useState<string>(params.status || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [bedroomsFilter, setBedroomsFilter] = useState<number | null>(null);
  const [bathroomsFilter, setBathroomsFilter] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [minArea, setMinArea] = useState<string>("any");
  const [maxArea, setMaxArea] = useState<string>("any");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Property types fetched from API
  const [propertyTypes, setPropertyTypes] = useState<string[]>(DEFAULT_PROPERTY_TYPES);

  // Map view state
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [drawnAreaBounds, setDrawnAreaBounds] = useState<{
    north: number; south: number; east: number; west: number;
  } | null>(null);

  // New features state
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load property types from API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const res = await fetch("/api/property-types");
        const data = await res.json();
        if (data.propertyTypes && data.propertyTypes.length > 0) {
          setPropertyTypes(data.propertyTypes.map((pt: { type: string }) => pt.type));
        }
      } catch {
        // Keep default property types on error
      }
    };
    fetchPropertyTypes();
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Fetch all properties for map view (no pagination, includes lat/lng)
  const fetchMapProperties = useCallback(async () => {
    setMapLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") queryParams.set("type", typeFilter);
      if (bedroomsFilter) queryParams.set("bedrooms", String(bedroomsFilter));
      if (bathroomsFilter) queryParams.set("bathrooms", String(bathroomsFilter));
      queryParams.set("minPrice", String(priceRange[0]));
      queryParams.set("maxPrice", String(priceRange[1]));
      if (minArea && minArea !== "any") queryParams.set("minArea", minArea);
      if (maxArea && maxArea !== "any") queryParams.set("maxArea", maxArea);
      if (featuredOnly) queryParams.set("featured", "true");
      if (drawnAreaBounds) {
        queryParams.set("north", String(drawnAreaBounds.north));
        queryParams.set("south", String(drawnAreaBounds.south));
        queryParams.set("east", String(drawnAreaBounds.east));
        queryParams.set("west", String(drawnAreaBounds.west));
      }

      const res = await fetch(`/api/properties/map?${queryParams.toString()}`);
      const data = await res.json();
      setMapProperties(data.properties || []);
    } catch {
      setMapProperties([]);
    } finally {
      setMapLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, bedroomsFilter, bathroomsFilter, priceRange, minArea, maxArea, featuredOnly, drawnAreaBounds]);

  // Fetch map properties when in map view or when drawn area changes
  useEffect(() => {
    if (viewMode === "map") {
      fetchMapProperties();
    }
  }, [viewMode, fetchMapProperties]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") queryParams.set("type", typeFilter);
      if (bedroomsFilter) queryParams.set("bedrooms", String(bedroomsFilter));
      if (bathroomsFilter) queryParams.set("bathrooms", String(bathroomsFilter));
      queryParams.set("minPrice", String(priceRange[0]));
      queryParams.set("maxPrice", String(priceRange[1]));
      if (minArea && minArea !== "any") queryParams.set("minArea", minArea);
      if (maxArea && maxArea !== "any") queryParams.set("maxArea", maxArea);
      if (featuredOnly) queryParams.set("featured", "true");
      queryParams.set("sort", sortBy);
      queryParams.set("page", String(page));
      queryParams.set("limit", "9");

      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      const data = await res.json();
      setProperties(data.properties || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, bedroomsFilter, bathroomsFilter, priceRange, minArea, maxArea, featuredOnly, sortBy, page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setBedroomsFilter(null);
    setBathroomsFilter(null);
    setPriceRange([0, 5000000]);
    setMinArea("any");
    setMaxArea("any");
    setFeaturedOnly(false);
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    bedroomsFilter ||
    bathroomsFilter ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000000 ||
    (minArea && minArea !== "any") ||
    (maxArea && maxArea !== "any") ||
    featuredOnly;

  const activeFilterCount = [
    searchQuery,
    statusFilter !== "all",
    typeFilter !== "all",
    bedroomsFilter,
    bathroomsFilter,
    priceRange[0] > 0 || priceRange[1] < 5000000,
    minArea && minArea !== "any",
    maxArea && maxArea !== "any",
    featuredOnly,
  ].filter(Boolean).length;

  // Save search handler
  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    const filters: Record<string, string> = {};
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "all") filters.status = statusFilter;
    if (typeFilter !== "all") filters.type = typeFilter;
    if (bedroomsFilter) filters.bedrooms = String(bedroomsFilter);
    if (bathroomsFilter) filters.bathrooms = String(bathroomsFilter);
    if (priceRange[0] > 0) filters.minPrice = String(priceRange[0]);
    if (priceRange[1] < 5000000) filters.maxPrice = String(priceRange[1]);
    if (minArea !== "any") filters.minArea = minArea;
    if (maxArea !== "any") filters.maxArea = maxArea;
    if (featuredOnly) filters.featured = "true";
    filters.sort = sortBy;

    const newSearch: SavedSearch = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name: saveSearchName.trim(),
      filters,
      createdAt: new Date().toISOString(),
    };
    const existing = loadSavedSearches();
    saveSavedSearches([newSearch, ...existing]);
    setSaveSearchName("");
    setShowSaveDialog(false);
    toast.success(t("savedSearch.searchSaved"));
  };

  // Handle search submission (track recent searches)
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      setRecentSearches(loadRecentSearches());
      setShowRecentSearches(false);
    }
  };

  // Apply recent search
  const applyRecentSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setShowRecentSearches(false);
    addRecentSearch(query);
    setRecentSearches(loadRecentSearches());
  };

  const filterProps = {
    t,
    locale,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    bedroomsFilter,
    setBedroomsFilter,
    bathroomsFilter,
    setBathroomsFilter,
    priceRange,
    setPriceRange,
    minArea,
    setMinArea,
    maxArea,
    setMaxArea,
    featuredOnly,
    setFeaturedOnly,
    hasActiveFilters,
    clearFilters,
    setPage,
    propertyTypes,
  };

  const badgeProps = {
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    bedroomsFilter,
    setBedroomsFilter,
    bathroomsFilter,
    setBathroomsFilter,
    minArea,
    setMinArea,
    maxArea,
    setMaxArea,
    featuredOnly,
    setFeaturedOnly,
    priceRange,
    t,
    setPage,
  };

  return (
    <div className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        {/* ──── Header ──── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 md:mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {t("properties.title")}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                {t("properties.subtitle")}
              </p>
            </div>
            {!loading && (
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                <span className="text-foreground font-semibold">{properties.length}</span>{" "}
                {t("properties.results")}
              </div>
            )}
          </div>
        </motion.div>

        {/* ──── Search and Controls ──── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              onFocus={() => setShowRecentSearches(true)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
              placeholder={t("properties.searchPlaceholder")}
              className="ps-10 pe-20 h-11 rounded-xl bg-background border-border"
            />
            {/* Recent Searches Popover */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="absolute top-full mt-1 start-0 w-full z-50 rounded-xl border bg-background shadow-lg overflow-hidden">
                <div className="p-2 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {t("properties.recentSearches")}
                    </span>
                    <button
                      onClick={() => { saveRecentSearches([]); setRecentSearches([]); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {t("properties.clear")}
                    </button>
                  </div>
                </div>
                {recentSearches.slice(0, 5).map((rs, i) => (
                  <button
                    key={i}
                    onClick={() => applyRecentSearch(rs.query)}
                    className="w-full text-start px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{rs.query}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(rs.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {/* Save Search Button */}
            <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                title={t("savedSearch.saveSearch")}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("savedSearch.saveSearch")}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 lg:hidden relative h-11 rounded-xl"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("common.filter")}
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -end-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border-2 border-background rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-11 rounded-xl">
                <SelectValue placeholder={t("properties.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("properties.newest")}</SelectItem>
                <SelectItem value="priceLow">{t("properties.priceLow")}</SelectItem>
                <SelectItem value="priceHigh">{t("properties.priceHigh")}</SelectItem>
                <SelectItem value="largest">{t("properties.largest")}</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle — Desktop */}
            <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none rounded-s-xl"
                onClick={() => setViewMode("grid")}
                aria-label={t("properties.gridView")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none"
                onClick={() => setViewMode("list")}
                aria-label={t("properties.listView")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none rounded-e-xl"
                onClick={() => setViewMode("map")}
                aria-label={t("mapView.title")}
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>

            {/* View Toggle — Mobile */}
            <div className="flex sm:hidden items-center border border-border rounded-xl overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none rounded-s-xl"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="icon"
                className="h-11 w-11 rounded-none rounded-e-xl"
                onClick={() => setViewMode("map")}
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ──── Active Filter Badges (Top Level) ──── */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 flex items-center gap-3 flex-wrap"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("properties.activeFilters")}:
            </span>
            <ActiveFilterBadges {...badgeProps} />
          </motion.div>
        )}

        {/* ──── Main Layout: Desktop sidebar + content ──── */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar — hidden in map view */}
          {viewMode !== "map" && (
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <Card className="rounded-xl border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                      {t("common.filter")}
                    </h3>
                    {activeFilterCount > 0 && (
                      <Badge className="bg-primary/10 text-primary text-xs border-0 rounded-lg px-2 py-0.5 font-medium">
                        {activeFilterCount} {t("properties.activeFilters")}
                      </Badge>
                    )}
                  </div>
                  <FiltersPanel {...filterProps} />
                </CardContent>
              </Card>
            </div>
          </div>
          )}

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 lg:hidden overflow-hidden"
                >
                  <Card className="rounded-xl border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                          {t("common.filter")}
                        </h3>
                        <div className="flex items-center gap-2">
                          {activeFilterCount > 0 && (
                            <Badge className="bg-primary/10 text-primary text-xs border-0 rounded-lg px-2 py-0.5 font-medium">
                              {activeFilterCount} {t("properties.activeFilters")}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowFilters(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <FiltersPanel {...filterProps} />

                      {/* Active Filter Badges (Mobile) */}
                      {hasActiveFilters && (
                        <div className="mt-5 pt-5 border-t border-border">
                          <ActiveFilterBadges {...badgeProps} />
                        </div>
                      )}

                      {/* Apply button for mobile */}
                      <div className="mt-5 pt-5 border-t border-border">
                        <Button
                          className="w-full rounded-xl"
                          onClick={() => setShowFilters(false)}
                        >
                          {t("common.filter")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map View */}
            {viewMode === "map" && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                {/* Drawn area indicator */}
                {drawnAreaBounds && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1 text-xs border-0 rounded-lg px-2.5 py-1 font-medium">
                      <MapPin className="w-3 h-3" />
                      {t("mapView.propertiesInArea").replace("{count}", String(mapProperties.filter(p => p.lat != null && p.lng != null).length))}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setDrawnAreaBounds(null)}
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t("mapView.clearArea")}
                    </Button>
                  </div>
                )}

                {mapLoading ? (
                  <MapSkeleton />
                ) : mapProperties.some(p => p.lat != null && p.lng != null) ? (
                  <InteractivePropertyMap
                    properties={mapProperties}
                    t={t}
                    locale={locale}
                    navigate={navigate}
                    selectedPropertyId={selectedMapPropertyId}
                    onPropertySelect={(id) => setSelectedMapPropertyId(id === selectedMapPropertyId ? null : id)}
                    drawnAreaBounds={drawnAreaBounds}
                    onDrawnAreaChange={setDrawnAreaBounds}
                    height="h-[600px]"
                  />
                ) : (
                  <SVGPropertyMap
                    properties={properties}
                    locale={locale}
                    t={t}
                    navigate={navigate}
                  />
                )}
              </motion.div>
            )}

            {/* Properties Grid/List */}
            {viewMode !== "map" && (
              <>
                {loading ? (
                  viewMode === "grid" ? <GridSkeleton /> : <ListSkeleton />
                ) : properties.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}
                  >
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} layout={viewMode} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center py-24"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("properties.noProperties")}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("properties.adjustFilters")}</p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                        {t("properties.clearFilters")}
                      </Button>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Pagination */}
            {viewMode !== "map" && totalPages > 1 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-2 mt-12"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setPage(p)}
                    className="w-10 h-10 rounded-xl"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-primary" />
              {t("savedSearch.saveSearch")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder={t("savedSearch.nameYourSearch")}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveSearch(); }}
              className="h-11"
            />
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground w-full mb-1">{t("properties.activeFilters")}:</span>
                {statusFilter !== "all" && <Badge variant="secondary" className="text-xs">{statusFilter === "sale" ? t("common.forSale") : t("common.forRent")}</Badge>}
                {typeFilter !== "all" && <Badge variant="secondary" className="text-xs">{t(`properties.${typeFilter}`)}</Badge>}
                {bedroomsFilter && <Badge variant="secondary" className="text-xs">{bedroomsFilter}+ {t("properties.bedrooms")}</Badge>}
                {searchQuery && <Badge variant="secondary" className="text-xs">"{searchQuery}"</Badge>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()} className="gap-2">
              <BookmarkPlus className="w-4 h-4" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
