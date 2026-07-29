"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Bath,
  Bed,
  CheckCircle2,
  Heart,
  MapPin,
  Maximize,
  Scale,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useCompare } from "@/lib/compare";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { SharePropertyDialog } from "@/components/real-estate/share-property-dialog";
import type { Property } from "@/components/real-estate/types/property";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PropertyCardProps {
  property: Property;
  layout?: "grid" | "list";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function localizedType(t: (key: string) => string, type: string) {
  const key = `properties.${type}`;
  const translated = t(key);
  return translated === key
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : translated;
}

export function PropertyCard({ property, layout = "grid" }: PropertyCardProps) {
  const { t, locale } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, toggleCompare } = useCompare();
  const [favoritePulse, setFavoritePulse] = useState(false);

  const href = `/properties/${encodeURIComponent(property.id)}`;
  const title = locale === "ar" ? property.titleAr : property.titleEn;
  const location = locale === "ar" ? property.locationAr : property.locationEn;
  const agentName = property.agent
    ? locale === "ar"
      ? property.agent.nameAr
      : property.agent.nameEn
    : "";
  const image = useMemo(
    () =>
      property.images
        ?.split(",")
        .map((item) => item.trim())
        .find(Boolean) || "",
    [property.images]
  );
  const favorite = isFavorite(property.id);
  const compared = isInCompare(property.id);
  const formattedPrice = property.price.toLocaleString(locale === "ar" ? "ar-IQ" : "en-US");

  const handleFavorite = useCallback(() => {
    setFavoritePulse(true);
    window.setTimeout(() => setFavoritePulse(false), 350);
    const saved = toggleFavorite(property.id);
    toast.success(
      saved
        ? locale === "ar" ? "تم حفظ العقار" : "Property saved"
        : locale === "ar" ? "تمت إزالة العقار من المفضلة" : "Property removed from favorites"
    );
  }, [locale, property.id, toggleFavorite]);

  const handleCompare = useCallback(() => {
    const wasCompared = isInCompare(property.id);
    const result = toggleCompare(property.id);
    if (!wasCompared && !result) {
      toast.warning(t("common.selectUpTo3"));
      return;
    }
    toast.success(
      wasCompared ? t("common.removeFromCompare") : t("common.addToCompare")
    );
  }, [isInCompare, property.id, t, toggleCompare]);

  const actions = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleFavorite}
        className="h-9 w-9 rounded-full"
        aria-label={favorite
          ? locale === "ar" ? "إزالة من المفضلة" : "Remove from favorites"
          : locale === "ar" ? "إضافة إلى المفضلة" : "Add to favorites"}
        aria-pressed={favorite}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-transform",
            favorite && "fill-red-500 text-red-500",
            favoritePulse && "scale-125"
          )}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCompare}
        className={cn("h-9 w-9 rounded-full", compared && "bg-primary/10 text-primary")}
        aria-label={compared ? t("common.removeFromCompare") : t("common.addToCompare")}
        aria-pressed={compared}
      >
        <Scale className="h-4 w-4" />
      </Button>
      <SharePropertyDialog
        propertyId={property.id}
        propertyTitle={title}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label={t("share.share")}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );

  const facts = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Bed className="h-4 w-4" />
        <strong className="font-semibold text-foreground">{property.bedrooms}</strong>
        {t("common.beds")}
      </span>
      <span className="flex items-center gap-1.5">
        <Bath className="h-4 w-4" />
        <strong className="font-semibold text-foreground">{property.bathrooms}</strong>
        {t("common.baths")}
      </span>
      <span className="flex items-center gap-1.5">
        <Maximize className="h-4 w-4" />
        <strong className="font-semibold text-foreground">{property.area.toLocaleString()}</strong>
        {t("common.sqft")}
      </span>
    </div>
  );

  if (layout === "list") {
    return (
      <Card className="overflow-hidden rounded-2xl border-border/70 transition-shadow hover:shadow-md">
        <div className="grid sm:grid-cols-[260px_minmax(0,1fr)]">
          <Link href={href} className="group relative min-h-52 overflow-hidden bg-muted">
            {image ? (
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full min-h-52 items-center justify-center text-muted-foreground">
                {localizedType(t, property.type)}
              </div>
            )}
            <div className="absolute start-3 top-3 flex flex-wrap gap-2">
              <Badge>{property.status === "sale" ? t("common.forSale") : t("common.forRent")}</Badge>
              {property.featured ? (
                <Badge variant="secondary" className="gap-1 bg-background/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {t("property.verified")}
                </Badge>
              ) : null}
            </div>
          </Link>

          <CardContent className="flex min-w-0 flex-col justify-between gap-5 p-5 md:p-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {t("common.currency")}{formattedPrice}
                    {property.status === "rent" ? (
                      <span className="ms-1 text-sm font-normal text-muted-foreground">{t("common.perMonth")}</span>
                    ) : null}
                  </p>
                  <Badge variant="outline" className="mt-2 rounded-full">
                    {localizedType(t, property.type)}
                  </Badge>
                </div>
                {actions}
              </div>

              <Link href={href} className="mt-4 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <h2 className="line-clamp-1 text-lg font-semibold hover:text-primary">{title}</h2>
              </Link>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            </div>

            <div className="border-t pt-4">
              {facts}
              {property.agent ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-7 w-7">
                    {property.agent.image ? <AvatarImage src={property.agent.image} alt={agentName} /> : null}
                    <AvatarFallback>{initials(agentName || "A")}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{agentName}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {localizedType(t, property.type)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute start-3 top-3 flex max-w-[70%] flex-wrap gap-2">
          <Badge>{property.status === "sale" ? t("common.forSale") : t("common.forRent")}</Badge>
          {property.featured ? (
            <Badge className="gap-1 bg-emerald-600 text-white">
              <CheckCircle2 className="h-3 w-3" />
              {t("property.verified")}
            </Badge>
          ) : null}
        </div>
        <Badge variant="secondary" className="absolute end-3 top-3 bg-background/90">
          {localizedType(t, property.type)}
        </Badge>
      </Link>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight">
              {t("common.currency")}{formattedPrice}
              {property.status === "rent" ? (
                <span className="ms-1 text-xs font-normal text-muted-foreground">{t("common.perMonth")}</span>
              ) : null}
            </p>
            <Link href={href} className="mt-2 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <h2 className="line-clamp-1 font-semibold hover:text-primary">{title}</h2>
            </Link>
          </div>
          {actions}
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{location}</span>
        </p>

        <div className="mt-5 border-t pt-4">{facts}</div>

        {property.agent ? (
          <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
            <Avatar className="h-7 w-7">
              {property.agent.image ? <AvatarImage src={property.agent.image} alt={agentName} /> : null}
              <AvatarFallback>{initials(agentName || "A")}</AvatarFallback>
            </Avatar>
            <span className="truncate">{agentName}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
