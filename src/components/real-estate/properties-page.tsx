"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Grid3X3,
  List,
  Map,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { usePathname, useRouter as useNextRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { InteractivePropertyMap, type MapProperty } from "@/components/real-estate/interactive-property-map";
import { PropertyCard } from "@/components/real-estate/property-card";
import {
  PropertyFilterPanel,
  type PropertyFilterPanelProps,
} from "@/components/real-estate/property-filter-panel";
import type { Property } from "@/components/real-estate/types/property";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_TYPES = [
  "apartment",
  "villa",
  "house",
  "condo",
  "townhouse",
  "penthouse",
];

type ViewMode = "grid" | "list" | "map";

function ResultsSkeleton({ view }: { view: ViewMode }) {
  if (view === "map") return <Skeleton className="h-[650px] w-full rounded-2xl" />;
  return (
    <div className={cn(view === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4")}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className={cn("rounded-2xl", view === "grid" ? "h-[430px]" : "h-60")} />
      ))}
    </div>
  );
}

export function PropertiesPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const searchValue = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const bedrooms = searchParams.get("bedrooms") || "";
  const bathrooms = searchParams.get("bathrooms") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minArea = searchParams.get("minArea") || "";
  const maxArea = searchParams.get("maxArea") || "";
  const featured = searchParams.get("featured") === "true";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const requestedView = searchParams.get("view");
  const view: ViewMode = requestedView === "list" || requestedView === "map" ? requestedView : "grid";

  const [searchDraft, setSearchDraft] = useState(searchValue);
  const [properties, setProperties] = useState<Property[]>([]);
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [propertyTypes, setPropertyTypes] = useState(DEFAULT_TYPES);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [drawnAreaBounds, setDrawnAreaBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  useEffect(() => setSearchDraft(searchValue), [searchValue]);

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") next.delete(key);
        else next.set(key, value);
      });
      if (resetPage && !("page" in updates)) next.delete("page");
      const serialized = next.toString();
      nextRouter.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
    },
    [nextRouter, pathname, searchParams]
  );

  const setFilter = useCallback(
    (key: string, value?: string) => updateQuery({ [key]: value }),
    [updateQuery]
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (view !== "grid") next.set("view", view);
    if (sort !== "newest") next.set("sort", sort);
    nextRouter.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
    setSearchDraft("");
    setDrawnAreaBounds(null);
  }, [nextRouter, pathname, sort, view]);

  const activeFilters = useMemo(
    () => [
      searchValue,
      status,
      type,
      bedrooms,
      bathrooms,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      featured,
    ].filter(Boolean).length,
    [bathrooms, bedrooms, featured, maxArea, maxPrice, minArea, minPrice, searchValue, status, type]
  );

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams(queryString);
        params.delete("view");
        params.set("page", String(page));
        params.set("limit", "9");
        const response = await fetch(`/api/properties?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load properties");
        setProperties(payload.properties || []);
        setTotal(Number(payload.total || 0));
        setTotalPages(Math.max(1, Number(payload.totalPages || 1)));
      } catch (caught) {
        if ((caught as Error).name === "AbortError") return;
        console.error(caught);
        setProperties([]);
        setTotal(0);
        setTotalPages(1);
        setError(locale === "ar" ? "تعذر تحميل العقارات. حاول مرة أخرى." : "We could not load the properties. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [locale, page, queryString]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const response = await fetch("/api/property-types");
        if (!response.ok) return;
        const payload = await response.json();
        const values = (payload.propertyTypes || []).map((item: { type: string }) => item.type);
        if (values.length) setPropertyTypes(values);
      } catch {
        // Keep safe defaults.
      }
    };
    loadTypes();
  }, []);

  useEffect(() => {
    if (view !== "map") return;
    const controller = new AbortController();
    const loadMap = async () => {
      setMapLoading(true);
      try {
        const params = new URLSearchParams(queryString);
        ["page", "limit", "sort", "view"].forEach((key) => params.delete(key));
        if (drawnAreaBounds) {
          Object.entries(drawnAreaBounds).forEach(([key, value]) => params.set(key, String(value)));
        }
        const response = await fetch(`/api/properties/map?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load map");
        setMapProperties(payload.properties || []);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") setMapProperties([]);
      } finally {
        setMapLoading(false);
      }
    };
    loadMap();
    return () => controller.abort();
  }, [drawnAreaBounds, queryString, view]);

  const filterPanelProps: PropertyFilterPanelProps = {
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
    activeCount: activeFilters,
  };

  const badges = [
    searchValue ? { key: "search", label: `“${searchValue}”` } : null,
    status ? { key: "status", label: status === "sale" ? t("common.forSale") : t("common.forRent") } : null,
    type ? { key: "type", label: t(`properties.${type}`) } : null,
    bedrooms ? { key: "bedrooms", label: `${bedrooms}+ ${t("properties.bedrooms")}` } : null,
    bathrooms ? { key: "bathrooms", label: `${bathrooms}+ ${t("properties.bathrooms")}` } : null,
    minPrice ? { key: "minPrice", label: `${t("common.currency")}${Number(minPrice).toLocaleString()}+` } : null,
    maxPrice ? { key: "maxPrice", label: `≤ ${t("common.currency")}${Number(maxPrice).toLocaleString()}` } : null,
    minArea ? { key: "minArea", label: `${minArea}+ ${t("common.sqft")}` } : null,
    maxArea ? { key: "maxArea", label: `≤ ${maxArea} ${t("common.sqft")}` } : null,
    featured ? { key: "featured", label: t("properties.featuredOnly") } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">
            {total.toLocaleString()} {t("properties.totalResults")}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("properties.title")}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("properties.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("list-property")}>
          {t("hero.listProperty")}
        </Button>
      </div>

      <Card className="mb-6 rounded-2xl border-border/70 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <form
            className="flex flex-col gap-3 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setFilter("search", searchDraft.trim() || undefined);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t("properties.searchPlaceholder")}
                className="h-11 ps-10"
              />
            </div>
            <Button type="submit" className="h-11 px-6">{t("common.search")}</Button>
            <Button
              type="button"
              variant="outline"
              className="relative h-11 gap-2 lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("common.filter")}
              {activeFilters > 0 ? (
                <Badge className="ms-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {activeFilters}
                </Badge>
              ) : null}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <Badge key={badge.key} variant="secondary" className="gap-1 rounded-full py-1 ps-3 pe-1.5">
              {badge.label}
              <button
                type="button"
                onClick={() => setFilter(badge.key)}
                aria-label={`${t("common.remove")}: ${badge.label}`}
                className="rounded-full p-1 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {badges.length ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
              {t("properties.clearFilters")}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={(value) => setFilter("sort", value === "newest" ? undefined : value)}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("properties.newest")}</SelectItem>
              <SelectItem value="priceLow">{t("properties.priceLow")}</SelectItem>
              <SelectItem value="priceHigh">{t("properties.priceHigh")}</SelectItem>
              <SelectItem value="largest">{t("properties.largest")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border p-1" role="group" aria-label="Property view">
            {([
              ["grid", Grid3X3, t("properties.gridView")],
              ["list", List, t("properties.listView")],
              ["map", Map, t("mapView.title")],
            ] as const).map(([mode, Icon, label]) => (
              <Button
                key={mode}
                type="button"
                variant={view === mode ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setFilter("view", mode === "grid" ? undefined : mode)}
                aria-label={label}
                aria-pressed={view === mode}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-2xl">
            <CardContent className="p-5"><PropertyFilterPanel {...filterPanelProps} /></CardContent>
          </Card>
        </aside>

        <main className="min-w-0">
          {loading && view !== "map" ? (
            <ResultsSkeleton view={view} />
          ) : error ? (
            <Card className="rounded-2xl border-destructive/30">
              <CardContent className="flex flex-col items-center p-10 text-center">
                <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
                <p className="font-semibold">{error}</p>
                <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                  {locale === "ar" ? "إعادة المحاولة" : "Try again"}
                </Button>
              </CardContent>
            </Card>
          ) : view === "map" ? (
            mapLoading ? (
              <ResultsSkeleton view="map" />
            ) : (
              <InteractivePropertyMap
                properties={mapProperties}
                selectedPropertyId={selectedMapPropertyId}
                onPropertySelect={setSelectedMapPropertyId}
                drawnAreaBounds={drawnAreaBounds}
                onDrawnAreaChange={setDrawnAreaBounds}
                height="h-[650px]"
                t={t}
                locale={locale}
                navigate={(target, targetParams) => navigate(target as Parameters<typeof navigate>[0], targetParams)}
              />
            )
          ) : !properties.length ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center p-12 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/35" />
                <h2 className="text-xl font-semibold">{t("properties.noProperties")}</h2>
                <p className="mt-2 text-muted-foreground">{t("properties.adjustFilters")}</p>
                {activeFilters ? (
                  <Button variant="outline" className="mt-5" onClick={clearFilters}>
                    {t("properties.clearFilters")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className={cn(view === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4")}>
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} layout={view === "list" ? "list" : "grid"} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => updateQuery({ page: String(page - 1) }, false)}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="px-3 text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => updateQuery({ page: String(page + 1) }, false)}
                  >
                    {t("common.next")}
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </main>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side={locale === "ar" ? "right" : "left"} className="w-[90vw] max-w-sm overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{t("common.filter")}</SheetTitle>
          </SheetHeader>
          <PropertyFilterPanel {...filterPanelProps} />
          <Button className="mt-8 w-full" onClick={() => setMobileFiltersOpen(false)}>
            {total.toLocaleString()} {t("properties.results")}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
