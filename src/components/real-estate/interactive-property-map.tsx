"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
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
  const isDark = useSyncExternalStore(
    useCallback((callback: () => void) => {
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }, []),
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.lat != null && p.lng != null),
    [properties]
  );

  // Calculate map center
  const center = useMemo((): LatLngExpression => {
    if (mappableProperties.length === 0) {
      return [40.7128, -74.006]; // Default: NYC
    }
    const avgLat =
      mappableProperties.reduce((sum, p) => sum + p.lat!, 0) /
      mappableProperties.length;
    const avgLng =
      mappableProperties.reduce((sum, p) => sum + p.lng!, 0) /
      mappableProperties.length;
    return [avgLat, avgLng];
  }, [mappableProperties]);

  const zoom = mappableProperties.length <= 1 ? 13 : 11;

  // Set map ref and fit bounds on load
  const setMapRef = useCallback(
    (map: any) => {
      if (map && !mapInstance) {
        setMapInstance(map);
        if (mappableProperties.length > 1) {
          const leaflet = L!;
          const bounds: LatLngBounds = leaflet.latLngBounds(
            mappableProperties.map((p) => [p.lat!, p.lng!])
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    },
    [mappableProperties, mapInstance]
  );

  const handleZoomIn = useCallback(() => {
    if (mapInstance) mapInstance.zoomIn();
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) mapInstance.zoomOut();
  }, [mapInstance]);

  // Drawing interaction handlers
  useEffect(() => {
    if (!mapInstance || !L) return;

    const leaflet = L;

    const onMouseDown = (e: any) => {
      if (!isDrawing) return;
      drawingRef.current = true;
      startLatLngRef.current = e.latlng;
      if (rectangleRef.current) {
        mapInstance.removeLayer(rectangleRef.current);
      }
      rectangleRef.current = leaflet.rectangle([e.latlng, e.latlng], {
        color: "hsl(38, 90%, 55%)",
        weight: 2,
        fillOpacity: 0.15,
        dashArray: "6 4",
      });
      mapInstance.addLayer(rectangleRef.current);
      mapInstance.dragging.disable();
    };

    const onMouseMove = (e: any) => {
      if (!drawingRef.current || !rectangleRef.current) return;
      rectangleRef.current.setBounds([startLatLngRef.current, e.latlng]);
    };

    const onMouseUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      mapInstance.dragging.enable();

      if (rectangleRef.current && startLatLngRef.current) {
        const bounds = rectangleRef.current.getBounds();
        onDrawComplete({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    };

    if (isDrawing) {
      mapInstance.on("mousedown", onMouseDown);
      mapInstance.on("mousemove", onMouseMove);
      mapInstance.on("mouseup", onMouseUp);
      mapInstance.getContainer().style.cursor = "crosshair";
    }

    return () => {
      mapInstance.off("mousedown", onMouseDown);
      mapInstance.off("mousemove", onMouseMove);
      mapInstance.off("mouseup", onMouseUp);
      mapInstance.getContainer().style.cursor = "";
      mapInstance.dragging.enable();
    };
  }, [isDrawing, mapInstance, onDrawComplete]);

  // Show drawn area rectangle
  useEffect(() => {
    if (!mapInstance || !L || !drawnAreaBounds) return;

    const leaflet = L;
    const rect = leaflet.rectangle(
      [
        [drawnAreaBounds.south, drawnAreaBounds.west],
        [drawnAreaBounds.north, drawnAreaBounds.east],
      ],
      {
        color: "hsl(38, 90%, 55%)",
        weight: 2,
        fillOpacity: 0.15,
        dashArray: "6 4",
      }
    );
    mapInstance.addLayer(rect);

    return () => {
      mapInstance.removeLayer(rect);
    };
  }, [drawnAreaBounds, mapInstance]);

  // Tile URL - use dark tiles in dark mode
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (mappableProperties.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground p-6">
          <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t("mapView.noLocationData")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        ref={setMapRef}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {/* Property markers */}
        {mappableProperties.map((property) => {
          const isSelected = selectedPropertyId === property.id;
          const title =
            locale === "ar" ? property.titleAr : property.titleEn;
          const location =
            locale === "ar" ? property.locationAr : property.locationEn;
          const statusLabel =
            property.status === "sale"
              ? t("map.forSale")
              : t("map.forRent");
          const imageList = property.images ? property.images.split(",") : [];
          const mainImage = imageList[0] || "";

          return (
            <Marker
              key={property.id}
              position={[property.lat!, property.lng!]}
              icon={createPriceIcon(property.price, property.status, isSelected)}
              eventHandlers={{
                click: () => {
                  onPropertySelect?.(property.id);
                },
              }}
            >
              <Popup className="property-map-popup" maxWidth={280}>
                <div
                  className="p-2"
                  style={{ direction: locale === "ar" ? "rtl" : "ltr" }}
                >
                  {mainImage && (
                    <div className="w-full h-28 rounded-md overflow-hidden mb-2">
                      <img
                        src={mainImage}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm text-foreground mb-1 truncate">
                    {title}
                  </h3>
                  {location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{location}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-primary">
                      {t("common.currency")}
                      {property.price.toLocaleString()}
                      {property.status === "rent" && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {t("common.perMonth")}
                        </span>
                      )}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary"
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  {(property.bedrooms || property.bathrooms || property.area) && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {property.bedrooms && (
                        <span className="flex items-center gap-0.5">
                          <Bed className="w-3 h-3" />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-0.5">
                          <Bath className="w-3 h-3" />
                          {property.bathrooms}
                        </span>
                      )}
                      {property.area && (
                        <span className="flex items-center gap-0.5">
                          <Maximize className="w-3 h-3" />
                          {property.area} {t("common.sqft")}
                        </span>
                      )}
                    </div>
                  )}
                  {navigate && (
                    <Button
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() =>
                        navigate("property-detail", { id: property.id })
                      }
                    >
                      {t("common.viewDetails")}
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Custom Zoom Controls */}
      <div className="absolute top-3 start-3 z-[1000] flex flex-col gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md bg-background/90 backdrop-blur-sm"
          onClick={handleZoomIn}
          aria-label={t("map.zoomIn")}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md bg-background/90 backdrop-blur-sm"
          onClick={handleZoomOut}
          aria-label={t("map.zoomOut")}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Property count badge */}
      {mappableProperties.length > 0 && (
        <div className="absolute top-3 end-3 z-[1000]">
          <Badge
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm shadow-md gap-1"
          >
            <MapPin className="w-3 h-3" />
            {mappableProperties.length} {t("properties.results")}
          </Badge>
        </div>
      )}

      {/* Drawing instructions overlay */}
      {isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/95 backdrop-blur-sm shadow-lg rounded-xl px-4 py-3 border flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {t("mapView.drawInstructions")}
          </span>
        </div>
      )}
    </>
  );
}

// ──────────────────────── Loading Skeleton ────────────────────────

function MapSkeleton({ height }: { height: string }) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

// ──────────────────────── Main Export Component ────────────────────────

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
  // Track client-side availability
  const isClient = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet on mount
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
    () => properties.filter((p) => p.lat != null && p.lng != null),
    [properties]
  );

  if (!isClient || !leafletLoaded) {
    return <MapSkeleton height={height} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      {/* Map Area */}
      <div className={`relative ${height} lg:flex-1 rounded-xl overflow-hidden border bg-background`}>
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

      {/* Side Panel - Property List */}
      <div className="w-full lg:w-80 shrink-0 border rounded-xl bg-background overflow-hidden flex flex-col mt-4 lg:mt-0 lg:ms-4">
        {/* Panel Header */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {drawnAreaBounds
                ? t("mapView.propertiesInArea").replace(
                    "{count}",
                    String(mappableProperties.length)
                  )
                : `${mappableProperties.length} ${t("properties.results")}`}
            </h3>
          </div>
          {/* Draw Search Area button */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant={isDrawing ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5 h-8 text-xs"
              onClick={() => setIsDrawing(!isDrawing)}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("mapView.drawArea")}
            </Button>
            {drawnAreaBounds && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={handleClearDrawnArea}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("mapView.clearArea")}
              </Button>
            )}
          </div>
        </div>

        {/* Property List */}
        <ScrollArea className="flex-1 max-h-[460px]">
          <div className="p-2 space-y-2">
            {mappableProperties.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {drawnAreaBounds
                    ? t("mapView.noPropertiesInArea")
                    : t("mapView.noLocationData")}
                </p>
              </div>
            ) : (
              mappableProperties.map((property) => {
                const title =
                  locale === "ar" ? property.titleAr : property.titleEn;
                const location =
                  locale === "ar"
                    ? property.locationAr
                    : property.locationEn;
                const isSelected = selectedPropertyId === property.id;
                const imageList = property.images
                  ? property.images.split(",")
                  : [];
                const mainImage = imageList[0] || "";

                return (
                  <div
                    key={property.id}
                    onClick={() => onPropertySelect?.(property.id)}
                    className={`cursor-pointer rounded-lg border p-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex gap-2">
                      {mainImage && (
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                          <img
                            src={mainImage}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {location}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-primary">
                            {t("common.currency")}
                            {property.price.toLocaleString()}
                            {property.status === "rent" && (
                              <span className="text-xs font-normal text-muted-foreground">
                                /mo
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {property.bedrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bed className="w-3 h-3" />
                                {property.bedrooms}
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="flex items-center gap-0.5">
                                <Bath className="w-3 h-3" />
                                {property.bathrooms}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* View Details Button for selected property */}
        {selectedPropertyId && navigate && (
          <div className="border-t p-3">
            <Button
              className="w-full gap-2"
              onClick={() =>
                navigate("property-detail", { id: selectedPropertyId })
              }
            >
              {t("common.viewDetails")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
