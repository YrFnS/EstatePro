/**
 * Pure computation functions and custom hooks for the Compare page.
 * All UI-independent logic lives here so visual sections stay declarative.
 */

import { useMemo } from "react";
import type { Property } from "@/components/real-estate/types/property";
import { getPropertyTitle, getPropertyLocation, getPropertyImages } from "@/components/real-estate/types/property";
import { CHART_COLORS } from "./compare-types";
import type { LucideIcon } from "lucide-react";
import { Tag, Scale, Bed, Bath, Maximize, Calendar, Car, MapPin } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getTitle = (p: Property, locale: string) => getPropertyTitle(p, locale);
export const getLocation = (p: Property, locale: string) => getPropertyLocation(p, locale);
export const getImage = (p: Property) => {
  const imgs = getPropertyImages(p);
  return imgs[0] || "";
};

export const formatPrice = (price: number, currency: string) =>
  `${currency}${price.toLocaleString()}`;

export const pricePerSqft = (p: Property) =>
  p.area > 0 ? Math.round(p.price / p.area) : 0;

export const getLowestPrice = (properties: Property[]) => {
  if (properties.length < 2) return -1;
  let minIdx = 0;
  for (let i = 1; i < properties.length; i++) {
    if (properties[i].price < properties[minIdx].price) minIdx = i;
  }
  return minIdx;
};

export const getLargestArea = (properties: Property[]) => {
  if (properties.length < 2) return -1;
  let maxIdx = 0;
  for (let i = 1; i < properties.length; i++) {
    if (properties[i].area > properties[maxIdx].area) maxIdx = i;
  }
  return maxIdx;
};

// ---------------------------------------------------------------------------
// Radar chart data (normalised 0-100)
// ---------------------------------------------------------------------------

export function useRadarData(properties: Property[], locale: string, t: (key: string) => string) {
  return useMemo(() => {
    if (properties.length === 0) return [];

    const maxPrice = Math.max(...properties.map((p) => p.price), 1);
    const maxArea = Math.max(...properties.map((p) => p.area), 1);
    const maxBed = Math.max(...properties.map((p) => p.bedrooms), 1);
    const maxBath = Math.max(...properties.map((p) => p.bathrooms), 1);
    const maxYearBuilt = Math.max(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const minYearBuilt = Math.min(...properties.map((p) => p.yearBuilt || 1990), 1990);
    const yearRange = maxYearBuilt - minYearBuilt || 1;

    const getPriceScore = (p: Property) =>
      Math.round((1 - p.price / maxPrice) * 60 + 40);

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
}

// ---------------------------------------------------------------------------
// Bar chart data
// ---------------------------------------------------------------------------

export function usePriceBarData(properties: Property[], locale: string) {
  return useMemo(
    () =>
      properties.map((p, idx) => ({
        name: getTitle(p, locale).length > 15 ? getTitle(p, locale).slice(0, 15) + "\u2026" : getTitle(p, locale),
        price: p.price,
        color: CHART_COLORS[idx],
      })),
    [properties, locale],
  );
}

export function useAreaBarData(properties: Property[], locale: string) {
  return useMemo(
    () =>
      properties.map((p, idx) => ({
        name: getTitle(p, locale).length > 15 ? getTitle(p, locale).slice(0, 15) + "\u2026" : getTitle(p, locale),
        area: p.area,
        color: CHART_COLORS[idx],
      })),
    [properties, locale],
  );
}

// ---------------------------------------------------------------------------
// Feature matrix
// ---------------------------------------------------------------------------

export function useFeatureMatrix(properties: Property[]) {
  return useMemo(() => {
    if (properties.length === 0) return { allFeatures: [] as string[], matrix: [] as { feature: string; hasIt: boolean[] }[] };

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
}

// ---------------------------------------------------------------------------
// Overall property scores
// ---------------------------------------------------------------------------

export interface PropertyScore {
  property: Property;
  overall: number;
  breakdown: { label: string; value: number; color: string }[];
}

export function usePropertyScores(properties: Property[], t: (key: string) => string): PropertyScore[] {
  return useMemo(() => {
    if (properties.length === 0) return [];
    const maxPrice = Math.max(...properties.map((p) => p.price), 1);
    const maxArea = Math.max(...properties.map((p) => p.area), 1);
    const maxBed = Math.max(...properties.map((p) => p.bedrooms), 1);
    const maxBath = Math.max(...properties.map((p) => p.bathrooms), 1);
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
}

// ---------------------------------------------------------------------------
// Comparison rows (detailed table)
// ---------------------------------------------------------------------------

export interface ComparisonRow {
  label: string;
  icon: LucideIcon;
  getValue: (p: Property) => string;
  highlight: (i: number) => boolean;
}

export function useComparisonRows(
  properties: Property[],
  locale: string,
  t: (key: string) => string,
): ComparisonRow[] {
  const currency = t("common.currency");
  const lowestIdx = getLowestPrice(properties);
  const largestIdx = getLargestArea(properties);

  return [
    { label: t("compare.price"), icon: Tag, getValue: (p) => formatPrice(p.price, currency), highlight: (i) => i === lowestIdx },
    { label: t("compare.type"), icon: Scale, getValue: (p) => t(`properties.${p.type}`), highlight: () => false },
    { label: t("compare.status"), icon: Scale, getValue: (p) => p.status === "sale" ? t("common.forSale") : t("common.forRent"), highlight: () => false },
    { label: t("compare.bedrooms"), icon: Bed, getValue: (p) => String(p.bedrooms), highlight: () => false },
    { label: t("compare.bathrooms"), icon: Bath, getValue: (p) => String(p.bathrooms), highlight: () => false },
    { label: t("compare.area"), icon: Maximize, getValue: (p) => `${p.area} ${t("common.sqft")}`, highlight: (i) => i === largestIdx },
    { label: t("compare.pricePerSqft"), icon: Tag, getValue: (p) => `${currency}${pricePerSqft(p)}/sqft`, highlight: (i) => i === lowestIdx },
    { label: t("compare.yearBuilt"), icon: Calendar, getValue: (p) => p.yearBuilt ? String(p.yearBuilt) : "\u2014", highlight: () => false },
    { label: t("compare.parking"), icon: Car, getValue: (p) => String(p.parking), highlight: () => false },
    { label: t("compare.location"), icon: MapPin, getValue: (p) => getLocation(p, locale), highlight: () => false },
  ];
}
