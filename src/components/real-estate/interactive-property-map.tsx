"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import type { DivIcon, LatLngBounds, LatLngExpression } from "leaflet";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Bed,
  Bath,
  Maximize,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// ──────────────────────── Types ────────────────────────

export interface MapProperty {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  lat: number | null;
  lng: number | null;
  type: string;
  status: string;
  images?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  locationEn?: string;
  locationAr?: string;
  badge?: string | null;
  featured?: boolean;
}

interface InteractivePropertyMapProps {
  properties: MapProperty[];
  onPropertySelect?: (id: string) => void;
  selectedPropertyId?: string | null;
  onDrawnAreaChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null) => void;
  drawnAreaBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  height?: string;
  t: (key: string) => string;
  locale: string;
  navigate?: (view: string, params?: Record<string, string>) => void;
}

// ──────────────────────── Dynamic Leaflet Imports ────────────────────────

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// ──────────────────────── Leaflet Loader ────────────────────────

let L: typeof import("leaflet") | null = null;
async function getLeaflet() {
  if (!L) {
    L = await import("leaflet");
    // Fix default marker icons for webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }
  return L;
}

// ──────────────────────── Price Formatting ────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(price / 1000)}K`;
}

// ──────────────────────── Custom Price Marker Icon ────────────────────────

function createPriceIcon(
  price: number,
  status: string,
  isSelected: boolean
): DivIcon {
  const leaflet = L!;
  const priceLabel = `$${formatPrice(price)}`;
  const statusClass = status === "rent" ? "for-rent" : "for-sale";

  return leaflet.divIcon({
    html: `<div class="property-marker ${statusClass}${isSelected ? " selected" : ""}">${priceLabel}</div>`,
    className: "custom-marker",
    iconSize: [80, 36],
    iconAnchor: [40, 36],
    popupAnchor: [0, -36],
  });
}

// ──────────────────────── Map Inner Component ────────────────────────
// This component is only rendered client-side after Leaflet has loaded

function MapInner({
  properties,
  onPropertySelect,
  selectedPropertyId,
  isDrawing,
  onDrawComplete,
  drawnAreaBounds,
  t,
  locale,
  navigate,
}: {
  properties: MapProperty[];
  onPropertySelect?: (id: string) => void;
  selectedPropertyId?: string | null;
  isDrawing: boolean;
  onDrawComplete: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  drawnAreaBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  t: (key: string) => string;
  locale: string;
  navigate?: (view: string, params?: Record<string, string>) => void;
}) {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const drawingRef = useRef(false);
  const startLatLngRef = useRef<any>(null);
  const rectangleRef = useRef<any>(null);

  // Track dark mode
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const validProperties = useMemo(
    () =>
      properties.filter(
        (p): p is MapProperty & { lat: number; lng: number } =>
          typeof p.lat === "number" && typeof p.lng === "number"
      ),
    [properties]
  );

  const center = useMemo<LatLngExpression>(() => {
    if (validProperties.length === 0) return [25.2048, 55.2708];
    const lat =
      validProperties.reduce((sum, property) => sum + property.lat, 0) /
      validProperties.length;
    const lng =
      validProperties.reduce((sum, property) => sum + property.lng, 0) /
      validProperties.length;
    return [lat, lng];
  }, [validProperties]);

  useEffect(() => {
    if (!mapInstance || !L) return;
    if (validProperties.length === 1) {
      mapInstance.setView(
        [validProperties[0].lat, validProperties[0].lng],
        13
      );
      return;
    }
    if (validProperties.length > 1) {
      const bounds = L.latLngBounds(
        validProperties.map((property) => [property.lat, property.lng])
      );
      mapInstance.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    }
  }, [mapInstance, validProperties]);

  useEffect(() => {
    if (!mapInstance || !L) return;

    if (rectangleRef.current) {
      mapInstance.removeLayer(rectangleRef.current);
      rectangleRef.current = null;
    }

    if (drawnAreaBounds) {
      const bounds = L.latLngBounds(
        [drawnAreaBounds.south, drawnAreaBounds.west],
        [drawnAreaBounds.north, drawnAreaBounds.east]
      );
      rectangleRef.current = L.rectangle(bounds, {
        color: "hsl(var(--primary))",
        weight: 2,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.08,
      }).addTo(mapInstance);
    }
  }, [drawnAreaBounds, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !L) return;

    const container = mapInstance.getContainer();
    container.style.cursor = isDrawing ? "crosshair" : "grab";

    const onMouseDown = (event: any) => {
      if (!isDrawing) return;
      drawingRef.current = true;
      startLatLngRef.current = event.latlng;
      mapInstance.dragging.disable();

      if (rectangleRef.current) {
        mapInstance.removeLayer(rectangleRef.current);
        rectangleRef.current = null;
      }
    };

    const onMouseMove = (event: any) => {
      if (!drawingRef.current || !startLatLngRef.current) return;
      const bounds = L!.latLngBounds(startLatLngRef.current, event.latlng);
      if (rectangleRef.current) {
        rectangleRef.current.setBounds(bounds);
      } else {
        rectangleRef.current = L!.rectangle(bounds, {
          color: "hsl(var(--primary))",
          weight: 2,
          fillColor: "hsl(var(--primary))",
          fillOpacity: 0.08,
        }).addTo(mapInstance);
      }
    };

    const onMouseUp = (event: any) => {
      if (!drawingRef.current || !startLatLngRef.current) return;
      drawingRef.current = false;
      mapInstance.dragging.enable();
      const bounds = L!.latLngBounds(startLatLngRef.current, event.latlng);
      startLatLngRef.current = null;
      onDrawComplete({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    mapInstance.on("mousedown", onMouseDown);
    mapInstance.on("mousemove", onMouseMove);
    mapInstance.on("mouseup", onMouseUp);

    return () => {
      mapInstance.off("mousedown", onMouseDown);
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.off("mouseup", onMouseUp);
      if (!mapInstance.dragging.enabled()) mapInstance.dragging.enable();
    };
  }, [isDrawing, mapInstance, onDrawComplete]);

  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <>
      <MapContainer
        center={center}
        zoom={validProperties.length ? 11 : 4}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        ref={(map) => {
          if (map) setMapInstance(map);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        {validProperties.map((property) => {
          const selected = selectedPropertyId === property.id;
          const title = locale === "ar" ? property.titleAr : property.titleEn;
          const location =
            locale === "ar" ? property.locationAr : property.locationEn;
          const image = property.images
            ?.split(",")
            .map((item) => item.trim())
            .find(Boolean);

          return (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={createPriceIcon(property.price, property.status, selected)}
              eventHandlers={{
                click: () => onPropertySelect?.(property.id),
              }}
            >
              <Popup minWidth={230}>
                <div className="space-y-2 p-1">
                  {image ? (
                    <img
                      src={image}
                      alt={title}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <div>
                    <p className="line-clamp-2 font-semibold">{title}</p>
                    {location ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    ) : null}
                    <p className="mt-2 text-base font-bold text-primary">
                      {t("common.currency")}
                      {property.price.toLocaleString()}
                    </p>
                    {(property.bedrooms || property.bathrooms || property.area) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {property.bedrooms ? (
                          <span className="flex items-center gap-0.5">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms}
                          </span>
                        ) : null}
                        {property.bathrooms ? (
                          <span className="flex items-center gap-0.5">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms}
                          </span>
                        ) : null}
                        {property.area ? (
                          <span className="flex items-center gap-0.5">
                            <Maximize className="h-3 w-3" />
                            {property.area} {t("common.sqft")}
                          </span>
                        ) : null}
                      </div>
                    )}
                    {navigate ? (
                      <Button
                        size="sm"
                        className="mt-3 h-8 w-full text-xs"
                        onClick={() =>
                          navigate("property-detail", { id: property.id })
                        }
                      >
                        {t("common.viewDetails")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute start-3 top-3 z-[1000] flex flex-col gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-background/90 shadow-md backdrop-blur-sm"
          onClick={handleZoomIn}
          aria-label={t("map.zoomIn")}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-background/90 shadow-md backdrop-blur-sm"
          onClick={handleZoomOut}
          aria-label={t("map.zoomOut")}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {validProperties.length > 0 ? (
        <div className="absolute end-3 top-3 z-[1000]">
          <Badge
            variant="secondary"
            className="gap-1 bg-background/90 shadow-md backdrop-blur-sm"
          >
            <MapPin className="h-3 w-3" />
            {validProperties.length} {t("properties.results")}
          </Badge>
        </div>
      ) : null}

      {isDrawing ? (
        <div className="absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <Pencil className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {t("mapView.drawInstructions")}
          </span>
        </div>
      ) : null}
    </>
  );
}

function MapSkeleton({ height }: { height: string }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export function InteractivePropertyMap({
  properties,
  onPropertySelect,
  selectedPropertyId,
  onDrawnAreaChange,
  drawnAreaBounds,
  height = "h-[600px]",
  t,
  locale,
  navigate,
}: InteractivePropertyMapProps) {
  const isClient = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    getLeaflet().then(() => setLeafletLoaded(true));
  }, []);

  const handleDrawComplete = useCallback(
    (bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      setIsDrawing(false);
      onDrawnAreaChange?.(bounds);
    },
    [onDrawnAreaChange]
  );

  const handleClearDrawnArea = useCallback(() => {
    onDrawnAreaChange?.(null);
  }, [onDrawnAreaChange]);

  const mappableProperties = useMemo(
    () => properties.filter((property) => property.lat != null && property.lng != null),
    [properties]
  );

  if (!isClient || !leafletLoaded) {
    return <MapSkeleton height={height} />;
  }

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <div className={`relative ${height} overflow-hidden rounded-xl border bg-background lg:flex-1`}>
        <MapInner
          properties={properties}
          onPropertySelect={onPropertySelect}
          selectedPropertyId={selectedPropertyId}
          isDrawing={isDrawing}
          onDrawComplete={handleDrawComplete}
          drawnAreaBounds={drawnAreaBounds || null}
          t={t}
          locale={locale}
          navigate={navigate}
        />
      </div>

      <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-background lg:w-80">
        <div className="border-b bg-muted/30 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            {drawnAreaBounds
              ? t("mapView.propertiesInArea").replace(
                  "{count}",
                  String(mappableProperties.length)
                )
              : `${mappableProperties.length} ${t("properties.results")}`}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant={isDrawing ? "default" : "outline"}
              size="sm"
              className="h-8 flex-1 gap-1.5 text-xs"
              onClick={() => setIsDrawing((value) => !value)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("mapView.drawArea")}
            </Button>
            {drawnAreaBounds ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleClearDrawnArea}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("mapView.clearArea")}
              </Button>
            ) : null}
          </div>
        </div>

        <ScrollArea className="max-h-[520px] flex-1">
          <div className="space-y-2 p-2">
            {mappableProperties.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {drawnAreaBounds
                    ? t("mapView.noPropertiesInArea")
                    : t("mapView.noLocationData")}
                </p>
              </div>
            ) : (
              mappableProperties.map((property) => {
                const title = locale === "ar" ? property.titleAr : property.titleEn;
                const location =
                  locale === "ar" ? property.locationAr : property.locationEn;
                const selected = selectedPropertyId === property.id;
                const image = property.images
                  ?.split(",")
                  .map((item) => item.trim())
                  .find(Boolean);

                return (
                  <button
                    type="button"
                    key={property.id}
                    onClick={() => onPropertySelect?.(property.id)}
                    className={`w-full rounded-lg border p-2 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex gap-2">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-16 w-16 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {location}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-primary">
                            {t("common.currency")}
                            {property.price.toLocaleString()}
                            {property.status === "rent" ? (
                              <span className="text-xs font-normal text-muted-foreground">
                                /mo
                              </span>
                            ) : null}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {property.bedrooms ? (
                              <span className="flex items-center gap-0.5">
                                <Bed className="h-3 w-3" />
                                {property.bedrooms}
                              </span>
                            ) : null}
                            {property.bathrooms ? (
                              <span className="flex items-center gap-0.5">
                                <Bath className="h-3 w-3" />
                                {property.bathrooms}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {selectedPropertyId && navigate ? (
          <div className="border-t p-3">
            <Button
              className="w-full"
              onClick={() =>
                navigate("property-detail", { id: selectedPropertyId })
              }
            >
              {t("common.viewDetails")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
