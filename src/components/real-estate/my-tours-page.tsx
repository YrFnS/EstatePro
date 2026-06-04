"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Video,
  Eye,
  X,
  Building,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleTourDialog } from "@/components/real-estate/schedule-tour-dialog";

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
  images: string;
  type: string;
  price: number;
  status: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const tourTypeIcons: Record<string, typeof MapPin> = {
  "in-person": MapPin,
  "virtual": Monitor,
  "video-call": Video,
};

export function MyToursPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [properties, setProperties] = useState<Record<string, PropertyInfo>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tours");
      const data = await res.json();
      setTours(data.tours || []);

      // Fetch property details for each unique propertyId
      const propertyIds = [...new Set((data.tours || []).map((tour: Tour) => tour.propertyId))];
      const propsMap: Record<string, PropertyInfo> = {};
      await Promise.all(
        propertyIds.map(async (id) => {
          try {
            const pRes = await fetch(`/api/properties/${id}`);
            const pData = await pRes.json();
            if (pData.id) {
              propsMap[id] = pData;
            }
          } catch {
            // skip failed property fetches
          }
        })
      );
      setProperties(propsMap);
    } catch {
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleCancelTour = async (tourId: string) => {
    try {
      // Optimistic update
      setTours((prev) =>
        prev.map((tour) =>
          tour.id === tourId ? { ...tour, status: "cancelled" } : tour
        )
      );
    } catch {
      // Revert on error
      fetchTours();
    }
  };

  const filteredTours =
    statusFilter === "all"
      ? tours
      : tours.filter((tour) => tour.status === statusFilter);

  const filterTabs = [
    { value: "all", label: t("tour.allTours") },
    { value: "pending", label: t("tour.pending") },
    { value: "confirmed", label: t("tour.confirmed") },
    { value: "completed", label: t("tour.completed") },
    { value: "cancelled", label: t("tour.cancelled") },
  ];

  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center inline-flex">
                  <Calendar className="w-5 h-5 text-primary" />
                </span>
                {t("tour.title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {locale === "ar"
                  ? `لديك ${tours.length} جولة مجدولة`
                  : `You have ${tours.length} scheduled tour${tours.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <ScheduleTourDialog
              propertyId="any"
              propertyTitle={t("tour.scheduleNewTour")}
              trigger={
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("tour.scheduleTour")}
                </Button>
              }
            />
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-2"
        >
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ms-1.5 text-xs opacity-70">
                  ({tours.filter((tour) => tour.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tour Cards */}
        <AnimatePresence mode="popLayout">
          {filteredTours.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("tour.noTours")}</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                {t("tour.noToursDesc")}
              </p>
              <Button
                onClick={() => navigate("properties")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Building className="w-4 h-4" />
                {t("tour.browseProperties")}
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {filteredTours.map((tour, index) => {
                const prop = properties[tour.propertyId];
                const TourIcon = tourTypeIcons[tour.tourType] || MapPin;
                const propTitle = prop
                  ? locale === "ar"
                    ? prop.titleAr
                    : prop.titleEn
                  : tour.propertyId;
                const propImage = prop?.images ? prop.images.split(",")[0] : null;

                return (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Property Image */}
                          <div className="sm:w-48 h-32 sm:h-auto bg-muted shrink-0">
                            {propImage ? (
                              <img
                                src={propImage}
                                alt={propTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Tour Details */}
                          <div className="flex-1 p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={statusColors[tour.status] || "bg-muted"}>
                                    {t(`tour.${tour.status}`)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <TourIcon className="w-3 h-3" />
                                    {tour.tourType === "in-person"
                                      ? t("tour.inPerson")
                                      : tour.tourType === "virtual"
                                      ? t("tour.virtual")
                                      : t("tour.videoCall")}
                                  </Badge>
                                </div>
                                <h3
                                  className="font-semibold text-base cursor-pointer hover:text-primary transition-colors"
                                  onClick={() =>
                                    navigate("property-detail", { id: tour.propertyId })
                                  }
                                >
                                  {propTitle}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {tour.date}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {tour.time}
                                  </span>
                                  {prop && (
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {locale === "ar" ? prop.titleAr : prop.titleEn}
                                    </span>
                                  )}
                                </div>
                                {tour.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                    {tour.notes}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex sm:flex-col gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() =>
                                    navigate("property-detail", { id: tour.propertyId })
                                  }
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  {t("tour.viewProperty")}
                                </Button>
                                {(tour.status === "pending" || tour.status === "confirmed") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => handleCancelTour(tour.id)}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    {t("tour.cancelTour")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
