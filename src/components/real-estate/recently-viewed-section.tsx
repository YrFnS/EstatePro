"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { motion } from "framer-motion";
import { Clock, MapPin, Trash2, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface PropertyMini {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  status: string;
  type: string;
  locationEn: string;
  locationAr: string;
  images: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function RecentlyViewedSection() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { recentlyViewedList, recentlyViewedCount, clearRecentlyViewed } = useRecentlyViewed();
  const [properties, setProperties] = useState<PropertyMini[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recentlyViewedList.length === 0) {
      setProperties([]);
      return;
    }

    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Fetch each property by ID - we use Promise.all for parallel fetching
        const results = await Promise.all(
          recentlyViewedList.slice(0, 6).map(async (id) => {
            try {
              const res = await fetch(`/api/properties/${id}`);
              if (res.ok) {
                return await res.json();
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        setProperties(results.filter((p): p is PropertyMini => p !== null));
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [recentlyViewedList]);

  if (recentlyViewedCount === 0 && !loading) {
    return (
      <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("recentlyViewed.title")}</h2>
            <p className="text-muted-foreground">{t("recentlyViewed.subtitle")}</p>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Card className="max-w-md mx-auto border-dashed border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t("recentlyViewed.emptyTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{t("recentlyViewed.emptyDesc")}</p>
                <Button
                  onClick={() => navigate("properties")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
                >
                  {t("recentlyViewed.startExploring")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">{t("recentlyViewed.title")}</h2>
              <div className="hidden sm:block h-px w-16 bg-primary/50 to-transparent" />
            </div>
            <p className="text-muted-foreground">{t("recentlyViewed.subtitle")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearRecentlyViewed}
            className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("recentlyViewed.clearHistory")}
          </Button>
        </motion.div>

        {/* Horizontal scrollable row */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="w-64 shrink-0 overflow-hidden">
                  <div className="h-36 bg-muted animate-pulse" />
                  <CardContent className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : (
              properties.map((property, idx) => {
                const title = locale === "ar" ? property.titleAr : property.titleEn;
                const location = locale === "ar" ? property.locationAr : property.locationEn;
                const imageList = property.images ? property.images.split(",") : [];
                const statusLabel = property.status === "sale" ? t("common.forSale") : t("common.forRent");
                const statusColor = property.status === "sale" ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground";

                return (
                  <motion.div
                    key={property.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card
                      className="w-64 shrink-0 cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm"
                      onClick={() => navigate("property-detail", { id: property.id })}
                    >
                      {/* Image */}
                      <div className="relative h-36 overflow-hidden">
                        {imageList.length > 0 ? (
                          <img
                            src={imageList[0]}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Eye className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        {/* Status badge */}
                        <span className={`absolute top-2 start-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>
                          {statusLabel}
                        </span>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-bold text-sm">
                            {t("common.currency")}{property.price.toLocaleString()}
                            {property.status === "rent" && <span className="text-[10px] font-normal text-muted-foreground">{t("common.perMonth")}</span>}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {t(`properties.${property.type}`)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
