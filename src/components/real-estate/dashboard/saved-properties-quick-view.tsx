"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/real-estate/types/animations";
import { Property } from "@/components/real-estate/types/property";

interface SavedPropertiesQuickViewProps {
  properties: Property[];
  favoritesCount: number;
  loading: boolean;
}

export function SavedPropertiesQuickView({ properties, favoritesCount }: SavedPropertiesQuickViewProps) {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-red-500" />
              {t("dashboard.savedProperties")}
              {favoritesCount > 0 && (
                <Badge variant="secondary" className="ms-1">{favoritesCount}</Badge>
              )}
            </CardTitle>
            {favoritesCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("favorites")}
                className="gap-1.5 text-primary"
              >
                {t("dashboard.quickView")}
                {locale === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {properties.map((property) => {
                const title = locale === "ar" ? property.titleAr : property.titleEn;
                const imageList = property.images ? property.images.split(",") : [];
                const mainImage = imageList[0] || `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(property.type)}`;

                return (
                  <motion.div
                    key={property.id}
                    whileHover={{ y: -4 }}
                    className="shrink-0 w-48 cursor-pointer"
                    onClick={() => navigate("property-detail", { id: property.id })}
                  >
                    <div className="rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow">
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={mainImage}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-1.5 start-2 text-primary-foreground text-xs font-bold">
                          ${property.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate">{title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {property.bedrooms} {t("common.beds")} · {property.area} {t("common.sqft")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-3">
                <Heart className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("common.noFavoritesYet")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("properties")}
                className="mt-3 gap-1.5"
              >
                {t("common.browsePropertiesNow")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
