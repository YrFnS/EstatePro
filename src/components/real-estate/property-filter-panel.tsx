"use client";

import { Bath, Bed, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];

export interface PropertyFilterPanelProps {
  t: (key: string) => string;
  propertyTypes: string[];
  status: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  featured: boolean;
  setFilter: (key: string, value?: string) => void;
  clearFilters: () => void;
  activeCount: number;
}

export function PropertyFilterPanel({
  t,
  propertyTypes,
  status,
  type,
  bedrooms,
  bathrooms,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  featured,
  setFilter,
  clearFilters,
  activeCount,
}: PropertyFilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{t("common.filter")}</h2>
          <p className="text-xs text-muted-foreground">
            {activeCount} {t("properties.activeFilters")}
          </p>
        </div>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {t("properties.clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>{t("common.sale")}/{t("common.rent")}</Label>
        <Select
          value={status || "all"}
          onValueChange={(value) => setFilter("status", value === "all" ? undefined : value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="sale">{t("common.forSale")}</SelectItem>
            <SelectItem value="rent">{t("common.forRent")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("properties.propertyType")}</Label>
        <Select
          value={type || "all"}
          onValueChange={(value) => setFilter("type", value === "all" ? undefined : value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("properties.any")}</SelectItem>
            {propertyTypes.map((item) => {
              const key = `properties.${item}`;
              const translated = t(key);
              return (
                <SelectItem key={item} value={item}>
                  {translated === key
                    ? item.charAt(0).toUpperCase() + item.slice(1)
                    : translated}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("properties.bedrooms")}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={!bedrooms ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("bedrooms")}
          >
            {t("properties.any")}
          </Button>
          {BEDROOM_OPTIONS.map((value) => (
            <Button
              type="button"
              key={value}
              variant={bedrooms === String(value) ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("bedrooms", String(value))}
              className="gap-1"
            >
              <Bed className="h-3.5 w-3.5" /> {value}+
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("properties.bathrooms")}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={!bathrooms ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("bathrooms")}
          >
            {t("properties.any")}
          </Button>
          {BATHROOM_OPTIONS.map((value) => (
            <Button
              type="button"
              key={value}
              variant={bathrooms === String(value) ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("bathrooms", String(value))}
              className="gap-1"
            >
              <Bath className="h-3.5 w-3.5" /> {value}+
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("properties.priceRange")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min="0"
            value={minPrice}
            placeholder={t("properties.minPrice")}
            onChange={(event) => setFilter("minPrice", event.target.value || undefined)}
          />
          <Input
            type="number"
            min="0"
            value={maxPrice}
            placeholder={t("properties.maxPrice")}
            onChange={(event) => setFilter("maxPrice", event.target.value || undefined)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("properties.areaRange")} ({t("common.sqft")})</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min="0"
            value={minArea}
            placeholder={t("properties.minArea")}
            onChange={(event) => setFilter("minArea", event.target.value || undefined)}
          />
          <Input
            type="number"
            min="0"
            value={maxArea}
            placeholder={t("properties.maxArea")}
            onChange={(event) => setFilter("maxArea", event.target.value || undefined)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border p-3">
        <Label htmlFor="featured-properties" className="flex cursor-pointer items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          {t("properties.featuredOnly")}
        </Label>
        <Switch
          id="featured-properties"
          checked={featured}
          onCheckedChange={(checked) => setFilter("featured", checked ? "true" : undefined)}
        />
      </div>
    </div>
  );
}
