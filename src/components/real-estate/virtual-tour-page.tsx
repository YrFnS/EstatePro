"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { PanoramicViewer } from "@/components/real-estate/panoramic-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Home,
  Eye,
} from "lucide-react";

interface PropertyTourData {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  status: string;
  type: string;
  addressEn: string;
  addressAr: string;
  locationEn: string;
  locationAr: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string;
  virtualTourUrl: string | null;
  virtualTourImages: string | null;
}

const ROOM_LABELS_EN = [
  "Living Room",
  "Master Bedroom",
  "Kitchen",
  "Bathroom",
  "Balcony",
  "Dining Room",
  "Guest Room",
  "Study",
  "Garage",
  "Garden",
];

const ROOM_LABELS_AR = [
  "غرفة المعيشة",
  "غرفة النوم الرئيسية",
  "المطبخ",
  "الحمام",
  "الشرفة",
  "غرفة الطعام",
  "غرفة الضيوف",
  "المكتب",
  "المرآب",
  "الحديقة",
];

export function VirtualTourPage() {
  const { t, locale } = useI18n();
  const { params, back, navigate } = useRouter();
  const [property, setProperty] = useState<PropertyTourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThumb, setSelectedThumb] = useState(0);

  const propertyId = params.propertyId || params.id;

  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setProperty(null);
        return;
      }
      setProperty(data);
    } catch {
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Get panoramic images from property data
  const getPanoramicImages = useCallback((): string[] => {
    if (!property) return [];

    // Priority: virtualTourImages field
    if (property.virtualTourImages) {
      const images = property.virtualTourImages
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean);
      if (images.length > 0) return images;
    }

    // Fallback: use regular property images as panoramic
    if (property.images) {
      return property.images
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean);
    }

    return [];
  }, [property]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
          <Skeleton className="h-6 w-48 bg-white/10" />
        </div>
        <div className="flex-1">
          <Skeleton className="w-full h-full bg-white/5" />
        </div>
        <div className="p-4 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-24 rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  // No property found
  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("virtualTour.noTourAvailable")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("virtualTour.noTourDesc")}
          </p>
          <Button onClick={() => navigate("properties")}>
            {t("common.browsePropertiesNow")}
          </Button>
        </div>
      </div>
    );
  }

  const panoramicImages = getPanoramicImages();
  const title = locale === "ar" ? property.titleAr : property.titleEn;
  const address = locale === "ar" ? property.addressAr : property.addressEn;
  const location =
    locale === "ar" ? property.locationAr : property.locationEn;
  const roomLabels =
    locale === "ar" ? ROOM_LABELS_AR : ROOM_LABELS_EN;
  const statusLabel =
    property.status === "sale" ? t("common.forSale") : t("common.forRent");

  // No panoramic images
  if (panoramicImages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("virtualTour.noTourAvailable")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("virtualTour.noTourDesc")}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("property-detail", { id: property.id })}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("virtualTour.backToProperty")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Bar - Property Info Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10 shrink-0 mt-0.5"
              onClick={() =>
                navigate("property-detail", { id: property.id })
              }
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-white font-bold text-lg md:text-xl leading-tight">
                {title}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/10"
                >
                  {statusLabel}
                </Badge>
                <span className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {address}, {location}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-white/70 text-xs">
                <span className="flex items-center gap-1">
                  <Bed className="w-3 h-3" /> {property.bedrooms} {t("common.beds")}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3 h-3" /> {property.bathrooms} {t("common.baths")}
                </span>
                <span className="flex items-center gap-1">
                  <Maximize className="w-3 h-3" /> {property.area} {t("common.sqft")}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-xl">
              {t("common.currency")}
              {property.price.toLocaleString()}
            </p>
            {property.status === "rent" && (
              <span className="text-white/60 text-sm">
                {t("common.perMonth")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Panoramic Viewer */}
      <div className="flex-1 relative">
        <PanoramicViewer
          images={panoramicImages}
          autoRotate={true}
          roomLabels={roomLabels.slice(0, panoramicImages.length)}
          className="!h-full !rounded-none"
          startIndex={selectedThumb}
          onIndexChange={setSelectedThumb}
        />
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="relative z-10 bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {panoramicImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedThumb(idx)}
                className={`shrink-0 relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  idx === selectedThumb
                    ? "border-white shadow-lg shadow-white/20 scale-105"
                    : "border-white/20 hover:border-white/50 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={
                    roomLabels[idx] || `${t("virtualTour.room")} ${idx + 1}`
                  }
                  className="w-24 h-16 object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                  {roomLabels[idx] || `${t("virtualTour.room")} ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Back to Property FAB */}
      <Button
        className="fixed bottom-24 right-4 z-30 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg gap-2 rounded-full px-4"
        onClick={() =>
          navigate("property-detail", { id: property.id })
        }
      >
        <Home className="w-4 h-4" />
        <span className="text-sm">{t("virtualTour.backToProperty")}</span>
      </Button>
    </div>
  );
}
