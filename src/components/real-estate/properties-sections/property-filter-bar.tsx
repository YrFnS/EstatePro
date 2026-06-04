"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  propertyTypes,
  bedroomOptions,
  bathroomOptions,
  areaOptions,
  MAX_PRICE,
} from "@/components/real-estate/properties-sections/property-types";

export interface PropertyFilterBarProps {
  showFilters: boolean;
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
  setPage: (v: number) => void;
  t: (key: string) => string;
}

export function PropertyFilterBar({
  showFilters,
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
  setPage,
  t,
}: PropertyFilterBarProps) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? "max-h-[800px] opacity-100 mb-8" : "max-h-0 opacity-0"}`}
    >
      <div className="border border-border/40 p-5 md:p-6 rounded-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Status */}
          <div>
            <label className="editorial-label mb-2 block">
              {t("common.sale")}/{t("common.rent")}
            </label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full h-9">
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
            <label className="editorial-label mb-2 block">
              {t("properties.propertyType")}
            </label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full h-9">
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
            <label className="editorial-label mb-2 block">
              {t("properties.bedrooms")}
            </label>
            <div className="flex items-center gap-1 flex-wrap">
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
            <label className="editorial-label mb-2 block">
              {t("properties.bathrooms")}
            </label>
            <div className="flex items-center gap-1 flex-wrap">
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
        </div>

        <hr className="dashed-divider my-5" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Price Range */}
          <div className="sm:col-span-2">
            <label className="editorial-label mb-2 block">
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
              max={MAX_PRICE}
              step={50000}
            />
          </div>

          {/* Area Range */}
          <div>
            <label className="editorial-label mb-2 block">
              {t("properties.areaRange")} ({t("common.sqft")})
            </label>
            <div className="flex items-center gap-2">
              <Select value={minArea} onValueChange={(v) => { setMinArea(v); setPage(1); }}>
                <SelectTrigger className="w-full h-9">
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
                <SelectTrigger className="w-full h-9">
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

          {/* Featured Only */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <Label htmlFor="featured-toggle" className="editorial-label flex items-center gap-2 cursor-pointer">
              <Star className="w-3.5 h-3.5" />
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
        </div>
      </div>
    </div>
  );
}
