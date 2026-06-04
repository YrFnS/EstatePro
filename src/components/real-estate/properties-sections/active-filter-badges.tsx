"use client";

import { X, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MAX_PRICE } from "@/components/real-estate/properties-sections/property-types";

export interface ActiveFilterBadgesProps {
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
}

export function ActiveFilterBadges({
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
}: ActiveFilterBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statusFilter !== "all" && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          {statusFilter === "sale" ? t("common.forSale") : t("common.forRent")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setStatusFilter("all"); setPage(1); }} />
        </Badge>
      )}
      {typeFilter !== "all" && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          {t(`properties.${typeFilter}`)}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setTypeFilter("all"); setPage(1); }} />
        </Badge>
      )}
      {bedroomsFilter && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          {bedroomsFilter}+ {t("properties.bedrooms")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setBedroomsFilter(null); setPage(1); }} />
        </Badge>
      )}
      {bathroomsFilter && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          {bathroomsFilter}+ {t("properties.bathrooms")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setBathroomsFilter(null); setPage(1); }} />
        </Badge>
      )}
      {(priceRange[0] > 0 || priceRange[1] < MAX_PRICE) && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          {t("common.currency")}{priceRange[0].toLocaleString()}–{t("common.currency")}{priceRange[1].toLocaleString()}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setPage(1); }} />
        </Badge>
      )}
      {minArea !== "any" && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          ≥{minArea} {t("common.sqft")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setMinArea("any"); setPage(1); }} />
        </Badge>
      )}
      {maxArea !== "any" && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          ≤{maxArea} {t("common.sqft")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setMaxArea("any"); setPage(1); }} />
        </Badge>
      )}
      {featuredOnly && (
        <Badge className="bg-foreground/5 text-foreground hover:bg-foreground/10 gap-1 text-xs border-0 rounded-sm px-2.5 py-1 font-medium transition-colors">
          <Star className="w-3 h-3" />
          {t("properties.featuredOnly")}
          <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => { setFeaturedOnly(false); setPage(1); }} />
        </Badge>
      )}
    </div>
  );
}
