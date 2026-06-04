"use client";

import {
  Search, Grid3X3, List, SlidersHorizontal, Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveFilterBadges } from "@/components/real-estate/properties-sections/active-filter-badges";
import type { ActiveFilterBadgesProps } from "@/components/real-estate/properties-sections/active-filter-badges";

export type ViewMode = "grid" | "list" | "map";

export interface PropertySearchBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  badgeProps: ActiveFilterBadgesProps;
  t: (key: string) => string;
}

export function PropertySearchBar({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
  badgeProps,
  t,
}: PropertySearchBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Primary search + view controls row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("properties.searchPlaceholder")}
            className="ps-10 h-10 bg-background border-border/60 transition-colors focus:border-primary"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={onToggleFilters}
          className="gap-2 relative h-10 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.filter")}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 w-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-36 h-10 hidden sm:flex">
            <SelectValue placeholder={t("properties.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("properties.newest")}</SelectItem>
            <SelectItem value="priceLow">{t("properties.priceLow")}</SelectItem>
            <SelectItem value="priceHigh">{t("properties.priceHigh")}</SelectItem>
            <SelectItem value="largest">{t("properties.largest")}</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center border border-border/60 rounded-sm overflow-hidden">
          {[
            { mode: "grid" as const, Icon: Grid3X3, label: t("properties.gridView") },
            { mode: "list" as const, Icon: List, label: t("properties.listView") },
            { mode: "map" as const, Icon: Map, label: t("mapView.title") },
          ].map(({ mode, Icon, label }) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="icon"
              className="h-10 w-10 rounded-none"
              onClick={() => onViewModeChange(mode)}
              aria-label={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile sort */}
      <div className="sm:hidden">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full h-10">
            <SelectValue placeholder={t("properties.sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("properties.newest")}</SelectItem>
            <SelectItem value="priceLow">{t("properties.priceLow")}</SelectItem>
            <SelectItem value="priceHigh">{t("properties.priceHigh")}</SelectItem>
            <SelectItem value="largest">{t("properties.largest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <ActiveFilterBadges {...badgeProps} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2 transition-colors"
          >
            {t("properties.clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}
