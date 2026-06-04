"use client";

import { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { DivIcon, LatLngBounds } from "leaflet";
import { useI18n } from "@/lib/i18n/provider";
import { MapPin, ZoomIn, ZoomOut, Bed, Bath, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// ──────────────────────── Types ────────────────────────

export interface PropertyWithLocation {
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
}

interface PropertyMapProps {
  properties: PropertyWithLocation[];
  height?: string;
  singleProperty?: boolean;
  onPropertySelect?: (id: string) => void;
  selectedPropertyId?: string | null;
}

// ──────────────────────── Dynamic Leaflet Import ────────────────────────

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

// Lazy-load Leaflet only on the client
let L: typeof import("leaflet") | null = null;
async function getLeaflet() {
  if (!L) {
    L = await import("leaflet");
  }
  return L;
}

function createCustomIcon(isSelected: boolean, isHovered: boolean): DivIcon {
  const leaflet = L!;
  const size = isSelected ? 40 : isHovered ? 36 : 32;
  const anchor = size / 2;

  return leaflet.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isSelected ? `
          <div style="
            position: absolute;
            width: ${size + 16}px;
            height: ${size + 16}px;
            border-radius: 50%;
            background: hsl(var(--primary) / 0.2);
            border: 2px solid hsl(var(--primary) / 0.4);
            animation: marker-pulse 1.5s ease-out infinite;
          "></div>
        ` : ""}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: hsl(var(--primary));
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="${Math.round(size * 0.4)}" height="${Math.round(size * 0.4)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, size],
    popupAnchor: [0, -size],
  });
}

// ──────────────────────── Map Inner Component ────────────────────────

function MapInner({
  properties,
  singleProperty,
  onPropertySelect,
  selectedPropertyId,
  t,
  locale,
}: {
  properties: PropertyWithLocation[];
  singleProperty?: boolean;
  onPropertySelect?: (id: string) => void;
  selectedPropertyId?: string | null;
  t: (key: string) => string;
  locale: string;
}) {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet on mount
  useEffect(() => {
    getLeaflet().then(() => setLeafletLoaded(true));
  }, []);

  // Track dark mode using useSyncExternalStore to avoid setState in effect
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
  const center = useMemo(() => {
    if (mappableProperties.length === 0) {
      return { lat: 40.7128, lng: -74.006 }; // Default: NYC
    }
    if (singleProperty && mappableProperties.length === 1) {
      return { lat: mappableProperties[0].lat!, lng: mappableProperties[0].lng! };
    }
    const avgLat =
      mappableProperties.reduce((sum, p) => sum + p.lat!, 0) /
      mappableProperties.length;
    const avgLng =
      mappableProperties.reduce((sum, p) => sum + p.lng!, 0) /
      mappableProperties.length;
    return { lat: avgLat, lng: avgLng };
  }, [mappableProperties, singleProperty]);

  const zoom = singleProperty ? 15 : mappableProperties.length <= 1 ? 13 : 11;

  // Fit bounds when map loads with multiple properties
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

  // Tile URL - use dark tiles in dark mode
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (!leafletLoaded) {
    return <MapSkeleton height="400px" />;
  }

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
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        ref={setMapRef}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {mappableProperties.map((property) => {
          const isSelected = selectedPropertyId === property.id;
          const isHovered = hoveredId === property.id;
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
              icon={createCustomIcon(isSelected, isHovered)}
              eventHandlers={{
                click: () => {
                  onPropertySelect?.(property.id);
                },
                mouseover: () => setHoveredId(property.id),
                mouseout: () => setHoveredId(null),
              }}
            >
              <Popup className="property-map-popup" maxWidth={280}>
                <div
                  className="p-1"
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
                  {onPropertySelect && (
                    <Button
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => onPropertySelect(property.id)}
                    >
                      {t("map.viewProperty")}
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
      {!singleProperty && mappableProperties.length > 0 && (
        <div className="absolute top-3 end-3 z-[1000]">
          <Badge
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm shadow-md"
          >
            <MapPin className="w-3 h-3 me-1" />
            {mappableProperties.length} {t("properties.results")}
          </Badge>
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

export function PropertyMap({
  properties,
  height = "h-[400px]",
  singleProperty = false,
  onPropertySelect,
  selectedPropertyId,
}: PropertyMapProps) {
  const { t, locale } = useI18n();

  // Track client-side availability without setState in effect
  const isClient = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  if (!isClient) {
    return <MapSkeleton height={height} />;
  }

  return (
    <div
      className={`relative ${height} rounded-xl overflow-hidden border shadow-sm`}
    >
      <MapInner
        properties={properties}
        singleProperty={singleProperty}
        onPropertySelect={onPropertySelect}
        selectedPropertyId={selectedPropertyId}
        t={t}
        locale={locale}
      />
    </div>
  );
}

// ──────────────────────── Multi-Property Map with Side Panel ────────────────────────

export function PropertyMapWithPanel({
  properties,
  onPropertySelect,
  selectedPropertyId,
  t,
  locale,
  navigate,
}: {
  properties: PropertyWithLocation[];
  onPropertySelect?: (id: string) => void;
  selectedPropertyId?: string | null;
  t: (key: string) => string;
  locale: string;
  navigate: (view: string, params?: Record<string, string>) => void;
}) {
  // Track client-side availability without setState in effect
  const isClient = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.lat != null && p.lng != null),
    [properties]
  );

  const selectedProperty = mappableProperties.find(
    (p) => p.id === selectedPropertyId
  );

  if (!isClient) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
        <Skeleton className="flex-1 h-full rounded-xl" />
        <Skeleton className="w-full lg:w-80 h-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
      {/* Map Area */}
      <div className="flex-1 relative rounded-xl overflow-hidden border bg-background">
        <MapInner
          properties={properties}
          onPropertySelect={onPropertySelect}
          selectedPropertyId={selectedPropertyId}
          t={t}
          locale={locale}
        />
      </div>

      {/* Side Panel - Property List */}
      <div className="w-full lg:w-80 shrink-0 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {mappableProperties.length} {t("properties.results")}
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {mappableProperties.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t("mapView.noLocationData")}
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

        {/* View Details Button */}
        {selectedProperty && (
          <div className="border-t p-3">
            <Button
              className="w-full gap-2"
              onClick={() =>
                navigate("property-detail", { id: selectedProperty.id })
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
