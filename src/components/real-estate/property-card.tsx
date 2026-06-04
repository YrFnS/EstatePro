"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import { toast } from "sonner";
import {
  Heart,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Scale,
  Share2,
  CheckCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SharePropertyDialog } from "@/components/real-estate/share-property-dialog";
import { useCallback, useState } from "react";

import type { Property } from "@/components/real-estate/types/property";

interface PropertyCardProps {
  property: Property;
  layout?: "grid" | "list";
}

function getBadgeClasses(badge: string | null) {
  switch (badge) {
    case "new":
      return "bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/20";
    case "hot":
      return "bg-red-500/90 text-white shadow-lg shadow-red-500/20";
    case "premium":
      return "bg-[var(--gold)] text-[var(--gold-foreground)] shadow-lg shadow-[var(--gold)]/20";
    default:
      return "";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "sale":
      return "bg-[var(--gold)] text-[var(--gold-foreground)] shadow-lg shadow-[var(--gold)]/20";
    case "rent":
      return "bg-slate-600/90 text-white shadow-lg shadow-slate-600/20";
    default:
      return "bg-primary text-primary-foreground";
  }
}

function getPropertyTypeLabel(t: (key: string) => string, type: string) {
  const key = `properties.${type}`;
  const val = t(key);
  return val === key
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : val;
}

export function PropertyCard({ property, layout = "grid" }: PropertyCardProps) {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, toggleCompare } = useCompare();
  const [heartAnimating, setHeartAnimating] = useState(false);

  const title = locale === "ar" ? property.titleAr : property.titleEn;
  const location = locale === "ar" ? property.locationAr : property.locationEn;
  const imageList = property.images ? property.images.split(",") : [];
  const mainImage =
    imageList[0] ||
    `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(property.type)}`;

  const pricePerSqft =
    property.area > 0 ? Math.round(property.price / property.area) : 0;

  const favorited = isFavorite(property.id);
  const inCompare = isInCompare(property.id);

  // Format price with commas
  const formattedPrice = property.price.toLocaleString();

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHeartAnimating(true);
      setTimeout(() => setHeartAnimating(false), 400);
      const nowFav = toggleFavorite(property.id);
      toast(
        nowFav ? t("common.added") : t("common.removed"),
        nowFav
          ? `\u2764\uFE0F ${title}`
          : `\uD83D\uDC94 ${title}`
      );
    },
    [property.id, toggleFavorite, t, title]
  );

  const handleCompareClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const result = toggleCompare(property.id);
      if (result === false && !inCompare) {
        toast.warning(t("common.selectUpTo3"));
        return;
      }
      toast(
        inCompare ? t("common.removed") : t("common.added"),
        inCompare
          ? `${title} - ${t("common.removeFromCompare")}`
          : `${title} - ${t("common.addToCompare")}`
      );
    },
    [property.id, toggleCompare, inCompare, t, title]
  );

  const badgeLabel = (() => {
    switch (property.badge) {
      case "new":
        return t("featured.newListing");
      case "hot":
        return t("featured.hot");
      case "premium":
        return t("featured.premium");
      default:
        return "";
    }
  })();

  const statusLabel =
    property.status === "sale" ? t("common.forSale") : t("common.forRent");

  const typeLabel = getPropertyTypeLabel(t, property.type);
  const badgeClasses = getBadgeClasses(property.badge);
  const statusClasses = getStatusClasses(property.status);

  // ==================== LIST LAYOUT ====================
  if (layout === "list") {
    return (
      <Card
        className="overflow-hidden cursor-pointer card-editorial rounded-2xl border border-border bg-card h-full flex flex-col sm:flex-row"
        onClick={() => navigate("property-detail", { id: property.id })}
      >
        {/* Image Section */}
        <div className="relative sm:w-64 h-52 sm:h-auto shrink-0 overflow-hidden">
          <img
            src={mainImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Status pill — top-start */}
          <span className={`absolute top-3 start-3 tag ${statusClasses}`}>
            {statusLabel}
          </span>

          {/* Badge pill — below status */}
          {property.badge && (
            <span
              className={`absolute top-3 start-3 mt-7 tag ${badgeClasses}`}
            >
              {badgeLabel}
            </span>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-3">
          <div>
            {/* Price row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-foreground">
                    {t("common.currency")}{formattedPrice}
                  </span>
                  {property.status === "rent" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {t("common.perMonth")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t("common.pricePerSqft")}: {t("common.currency")}
                  {pricePerSqft.toLocaleString()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleFavoriteClick}
                  aria-label={favorited ? t("common.removed") : t("common.added")}
                >
                  <Heart
                    className={`h-4 w-4 transition-all duration-200 ${
                      favorited
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground hover:text-red-400"
                    } ${heartAnimating ? "animate-heart-pulse" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${
                    inCompare
                      ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                      : ""
                  }`}
                  onClick={handleCompareClick}
                  aria-label={
                    inCompare
                      ? t("common.removeFromCompare")
                      : t("common.addToCompare")
                  }
                >
                  <Scale className="h-4 w-4" />
                </Button>
                <SharePropertyDialog
                  propertyId={property.id}
                  propertyTitle={title}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t("share.share")}
                    >
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Title & Location */}
            <h3 className="font-semibold text-base text-foreground line-clamp-1 mt-2">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          {/* Divider + Specs row */}
          <div className="border-t pt-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.bedrooms}</span>{" "}
                {t("common.beds")}
              </span>
              <span className="w-px h-4 bg-border mx-3" />
              <span className="flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.bathrooms}</span>{" "}
                {t("common.baths")}
              </span>
              <span className="w-px h-4 bg-border mx-3" />
              <span className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.area}</span>{" "}
                {t("common.sqft")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ==================== GRID LAYOUT ====================
  return (
    <Card
      className="overflow-hidden cursor-pointer card-editorial rounded-2xl border border-border bg-card h-full flex flex-col group"
      onClick={() => navigate("property-detail", { id: property.id })}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent z-[5]" />

        {/* Status pill — top-start */}
        <span className={`absolute top-3 start-3 tag ${statusClasses} z-10`}>
          {statusLabel}
        </span>

        {/* Badge pill — below status */}
        {property.badge && (
          <span
            className={`absolute top-3 start-3 mt-7 tag ${badgeClasses} z-10`}
          >
            {badgeLabel}
          </span>
        )}

        {/* Type label — top-end */}
        <span className="absolute top-3 end-3 tag bg-card/90 text-card-foreground border border-border z-10">
          {typeLabel}
        </span>

        {/* Verified badge for featured properties */}
        {property.featured && (
          <span className="absolute top-3 start-3 mt-14 tag bg-emerald-500/90 text-white z-10 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {t("property.verified")}
          </span>
        )}

        {/* Agent avatar — bottom-right of image */}
        <div className="absolute bottom-3 end-3 z-10">
          <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-md">
            <img
              src={`https://placehold.co/36x36/e2e8f0/64748b?text=A`}
              alt="Agent"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Favorite button — prominent, top-end area */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 start-3 z-10 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white transition-all duration-200"
          onClick={handleFavoriteClick}
          aria-label={favorited ? t("common.removed") : t("common.added")}
        >
          <Heart
            className={`h-4.5 w-4.5 transition-all duration-200 ${
              favorited
                ? "fill-red-500 text-red-500"
                : "text-white hover:text-red-400"
            } ${heartAnimating ? "animate-heart-pulse" : ""}`}
          />
        </Button>

        {/* Hover overlay — "View Details" text */}
        <div className="absolute inset-x-0 bottom-0 z-[5] flex items-center justify-center py-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white text-sm font-medium flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {t("common.viewDetails")}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 flex-1 flex flex-col gap-1.5">
        {/* Price */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-foreground">
              {t("common.currency")}{formattedPrice}
            </span>
            {property.status === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">
                /{t("common.perMonth")}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("common.pricePerSqft")}: {t("common.currency")}
            {pricePerSqft.toLocaleString()}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base text-foreground line-clamp-1">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-0" />

        {/* Divider + Specs row */}
        <div className="border-t pt-3 mt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.bedrooms}</span>{" "}
                {t("common.beds")}
              </span>
              <span className="w-px h-4 bg-border mx-3" />
              <span className="flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.bathrooms}</span>{" "}
                {t("common.baths")}
              </span>
              <span className="w-px h-4 bg-border mx-3" />
              <span className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{property.area}</span>{" "}
                {t("common.sqft")}
              </span>
            </div>

            {/* Action icons — right-aligned, subtle */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full ${
                  inCompare ? "bg-[var(--gold)]/10 text-[var(--gold)]" : ""
                }`}
                onClick={handleCompareClick}
                aria-label={
                  inCompare
                    ? t("common.removeFromCompare")
                    : t("common.addToCompare")
                }
              >
                <Scale className="h-3.5 w-3.5" />
              </Button>
              <SharePropertyDialog
                propertyId={property.id}
                propertyTitle={title}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("share.share")}
                  >
                    <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
