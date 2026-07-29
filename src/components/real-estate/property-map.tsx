"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { DivIcon, LatLngExpression } from "leaflet";
import { Bath, Bed, MapPin, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export interface PropertyWithLocation {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  lat?: number | null;
  lng?: number | null;
  type?: string;
  status?: string;
  images?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  locationEn?: string;
  locationAr?: string;
  badge?: string | null;
  featured?: boolean;
}

interface PropertyMapProps {
  properties: PropertyWithLocation[];
  singleProperty?: boolean;
  height?: string;
  onMarkerClick?: (property: PropertyWithLocation) => void;
  selectedPropertyId?: string | null;
}

interface PropertyMapWithPanelProps extends PropertyMapProps {
  t: (key: string) => string;
  locale: string;
  navigate?: (view: string, params?: Record<string, string>) => void;
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false }
);

function validCoordinates(
  property: PropertyWithLocation
): property is PropertyWithLocation & { lat: number; lng: number } {
  return typeof property.lat === "number" && typeof property.lng === "number";
}

function firstImage(images?: string): string {
  return (
    images
      ?.split(",")
      .map((item) => item.trim())
      .find(Boolean) || ""
  );
}

function markerIcon(
  leaflet: typeof import("leaflet"),
  price: number,
  selected: boolean
): DivIcon {
  const label =
    price >= 1_000_000
      ? `$${(price / 1_000_000).toFixed(1)}M`
      : `$${Math.round(price / 1_000)}K`;

  return leaflet.divIcon({
    className: "estatepro-map-marker",
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:64px;height:30px;padding:0 10px;border-radius:999px;background:${
      selected ? "hsl(var(--primary))" : "hsl(var(--background))"
    };color:${selected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"};border:2px solid hsl(var(--primary));box-shadow:0 6px 18px rgba(0,0,0,.18);font-size:12px;font-weight:700;white-space:nowrap">${label}</span>`,
    iconSize: [72, 30],
    iconAnchor: [36, 30],
    popupAnchor: [0, -28],
  });
}

export function PropertyMap({
  properties,
  singleProperty = false,
  height = "h-[500px]",
  onMarkerClick,
  selectedPropertyId,
}: PropertyMapProps) {
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    import("leaflet").then(setLeaflet);
  }, []);

  const validProperties = useMemo(
    () => properties.filter(validCoordinates),
    [properties]
  );

  const center = useMemo<LatLngExpression>(() => {
    if (!validProperties.length) return [33.3152, 44.3661];
    if (singleProperty || validProperties.length === 1) {
      return [validProperties[0].lat, validProperties[0].lng];
    }
    return [
      validProperties.reduce((sum, item) => sum + item.lat, 0) /
        validProperties.length,
      validProperties.reduce((sum, item) => sum + item.lng, 0) /
        validProperties.length,
    ];
  }, [singleProperty, validProperties]);

  if (!mounted || !leaflet) {
    return <Skeleton className={`${height} w-full rounded-xl`} />;
  }

  if (!validProperties.length) {
    return (
      <div
        className={`${height} flex items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground`}
      >
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No map coordinates available
        </div>
      </div>
    );
  }

  const mapKey = validProperties
    .map((property) => `${property.id}:${property.lat}:${property.lng}`)
    .join("|");

  return (
    <div className={`${height} overflow-hidden rounded-xl border bg-muted`}>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={singleProperty || validProperties.length === 1 ? 14 : 10}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => {
          const selected = property.id === selectedPropertyId;
          const image = firstImage(property.images);
          return (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={markerIcon(leaflet, property.price, selected)}
              eventHandlers={{ click: () => onMarkerClick?.(property) }}
            >
              <Popup minWidth={220}>
                <div className="space-y-2 p-1">
                  {image ? (
                    <img
                      src={image}
                      alt={property.titleEn}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <p className="font-semibold">{property.titleEn}</p>
                  {property.locationEn ? (
                    <p className="text-xs text-muted-foreground">
                      {property.locationEn}
                    </p>
                  ) : null}
                  <p className="font-bold text-primary">
                    ${property.price.toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function PropertyMapWithPanel({
  properties,
  height = "h-[600px]",
  onMarkerClick,
  selectedPropertyId,
  t,
  locale,
  navigate,
}: PropertyMapWithPanelProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedPropertyId || null
  );
  const selectedId = selectedPropertyId ?? internalSelectedId;
  const validProperties = useMemo(
    () => properties.filter(validCoordinates),
    [properties]
  );

  const selectProperty = (property: PropertyWithLocation) => {
    setInternalSelectedId(property.id);
    onMarkerClick?.(property);
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1">
        <PropertyMap
          properties={validProperties}
          height={height}
          selectedPropertyId={selectedId}
          onMarkerClick={selectProperty}
        />
      </div>

      <div className="w-full overflow-hidden rounded-xl border bg-background lg:w-80">
        <div className="border-b bg-muted/30 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            {validProperties.length} {t("properties.results")}
          </h3>
        </div>
        <ScrollArea className="max-h-[540px]">
          <div className="space-y-2 p-2">
            {validProperties.map((property) => {
              const title =
                locale === "ar" ? property.titleAr : property.titleEn;
              const location =
                locale === "ar" ? property.locationAr : property.locationEn;
              const image = firstImage(property.images);
              const selected = property.id === selectedId;

              return (
                <button
                  type="button"
                  key={property.id}
                  onClick={() => selectProperty(property)}
                  className={`w-full rounded-xl border p-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex gap-2">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{title}</p>
                      {location ? (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {location}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-primary">
                          {t("common.currency")}
                          {property.price.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {property.bedrooms != null ? (
                            <span className="flex items-center gap-0.5">
                              <Bed className="h-3 w-3" />
                              {property.bedrooms}
                            </span>
                          ) : null}
                          {property.bathrooms != null ? (
                            <span className="flex items-center gap-0.5">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </span>
                          ) : null}
                          {property.area != null ? (
                            <span className="flex items-center gap-0.5">
                              <Maximize className="h-3 w-3" />
                              {property.area}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {selectedId && navigate ? (
          <div className="border-t p-3">
            <Button
              className="w-full"
              onClick={() => navigate("property-detail", { id: selectedId })}
            >
              {t("common.viewDetails")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
