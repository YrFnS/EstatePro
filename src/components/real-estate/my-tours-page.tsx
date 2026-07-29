"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Monitor,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AuthDialog } from "@/components/real-estate/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Tour {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string | null;
  tourType: string;
  status: string;
  createdAt: string;
}

interface PropertyInfo {
  id: string;
  titleEn: string;
  titleAr: string;
  locationEn: string;
  locationAr: string;
  images: string;
}

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type TourFilter = (typeof FILTERS)[number];

const statusClasses: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  completed: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

export function MyToursPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [properties, setProperties] = useState<Record<string, PropertyInfo>>({});
  const [filter, setFilter] = useState<TourFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const label = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  const loadTours = useCallback(async () => {
    if (!isAuthenticated) {
      setTours([]);
      setProperties({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tours", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load tours");

      const rows: Tour[] = Array.isArray(payload.tours) ? payload.tours : [];
      setTours(rows);

      const propertyIds = Array.from(new Set(rows.map((tour) => tour.propertyId)));
      const propertyRows = await Promise.all(
        propertyIds.map(async (propertyId) => {
          try {
            const propertyResponse = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
              cache: "no-store",
            });
            if (!propertyResponse.ok) return null;
            return (await propertyResponse.json()) as PropertyInfo;
          } catch {
            return null;
          }
        })
      );

      const nextProperties: Record<string, PropertyInfo> = {};
      propertyRows.forEach((property) => {
        if (property?.id) nextProperties[property.id] = property;
      });
      setProperties(nextProperties);
    } catch (caught) {
      console.error(caught);
      setTours([]);
      setProperties({});
      setError(
        locale === "ar"
          ? "تعذر تحميل الجولات المحجوزة."
          : "We could not load your scheduled tours."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, locale]);

  useEffect(() => {
    if (!authLoading) loadTours();
  }, [authLoading, loadTours]);

  const filteredTours = useMemo(
    () => (filter === "all" ? tours : tours.filter((tour) => tour.status === filter)),
    [filter, tours]
  );

  const cancelTour = async (tourId: string) => {
    setUpdatingId(tourId);
    try {
      const response = await fetch(`/api/tours/${encodeURIComponent(tourId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to cancel tour");
      setTours((current) =>
        current.map((tour) =>
          tour.id === tourId ? { ...tour, status: "cancelled" } : tour
        )
      );
      toast.success(label("tour.cancelled", "Tour cancelled"));
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : label("tour.cancelFailed", "Failed to cancel tour")
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="mb-3 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-80" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-3xl text-center">
          <CardContent className="p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">{t("tour.title")}</h1>
            <p className="mt-3 text-muted-foreground">
              {locale === "ar"
                ? "سجّل الدخول لعرض وإدارة الجولات المحجوزة."
                : "Sign in to view and manage your scheduled property tours."}
            </p>
            <Button className="mt-6" onClick={() => setAuthOpen(true)}>
              {t("auth.signIn")}
            </Button>
          </CardContent>
        </Card>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full">
            {tours.length} {label("tour.allTours", "tours")}
          </Badge>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </span>
            {t("tour.title")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {label("tour.manageSubtitle", "Review upcoming visits and manage your bookings.")}
          </p>
        </div>
        <Button onClick={() => navigate("properties")} className="gap-2">
          <Building2 className="h-4 w-4" />
          {t("tour.browseProperties")}
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTERS.map((value) => {
          const count =
            value === "all"
              ? tours.length
              : tours.filter((tour) => tour.status === value).length;
          return (
            <Button
              type="button"
              key={value}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(value)}
              className="shrink-0 rounded-full"
            >
              {value === "all" ? t("tour.allTours") : t(`tour.${value}`)}
              <span className="ms-1 text-xs opacity-70">{count}</span>
            </Button>
          );
        })}
      </div>

      {error ? (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="p-8 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadTours}>
              {label("common.retry", "Try again")}
            </Button>
          </CardContent>
        </Card>
      ) : !filteredTours.length ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/35" />
            <h2 className="text-xl font-semibold">{t("tour.noTours")}</h2>
            <p className="mt-2 max-w-md text-muted-foreground">{t("tour.noToursDesc")}</p>
            <Button className="mt-6" onClick={() => navigate("properties")}>
              {t("tour.browseProperties")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTours.map((tour) => {
            const property = properties[tour.propertyId];
            const title = property
              ? locale === "ar"
                ? property.titleAr
                : property.titleEn
              : label("tour.property", "Property");
            const location = property
              ? locale === "ar"
                ? property.locationAr
                : property.locationEn
              : "";
            const image = property?.images
              ?.split(",")
              .map((item) => item.trim())
              .find(Boolean);
            const TypeIcon =
              tour.tourType === "virtual"
                ? Monitor
                : tour.tourType === "video-call"
                  ? Video
                  : MapPin;
            const canCancel = tour.status === "pending" || tour.status === "confirmed";

            return (
              <Card key={tour.id} className="overflow-hidden rounded-2xl border-border/70 transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <div className="grid sm:grid-cols-[220px_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => navigate("property-detail", { id: tour.propertyId })}
                      className="relative min-h-44 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    >
                      {image ? (
                        <img src={image} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full min-h-44 items-center justify-center">
                          <Building2 className="h-9 w-9 text-muted-foreground/45" />
                        </div>
                      )}
                    </button>

                    <div className="flex flex-col justify-between gap-5 p-5 md:p-6">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn("rounded-full", statusClasses[tour.status])}>
                            {t(`tour.${tour.status}`)}
                          </Badge>
                          <Badge variant="secondary" className="gap-1 rounded-full">
                            <TypeIcon className="h-3 w-3" />
                            {tour.tourType === "in-person"
                              ? t("tour.inPerson")
                              : tour.tourType === "virtual"
                                ? t("tour.virtual")
                                : t("tour.videoCall")}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("property-detail", { id: tour.propertyId })}
                          className="rounded-sm text-start text-lg font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {title}
                        </button>
                        {location ? (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" /> {location}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" /> {tour.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {tour.time}
                          </span>
                        </div>
                        {tour.notes ? (
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tour.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("property-detail", { id: tour.propertyId })}
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t("tour.viewProperty")}
                        </Button>
                        {canCancel ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === tour.id}
                            onClick={() => cancelTour(tour.id)}
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            {updatingId === tour.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            {t("tour.cancelTour")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
