"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useFavorites } from "@/lib/favorites";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ArrowRight, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyCard } from "@/components/real-estate/property-card";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import type { Property } from "@/components/real-estate/types/property";

export function FavoritesPage() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { favoritesList, clearFavorites, favoritesCount } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favoritesList.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          favoritesList.map(async (id) => {
            const res = await fetch(`/api/properties/${id}`);
            if (res.ok) return await res.json();
            return null;
          })
        );
        setProperties(results.filter(Boolean));
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [favoritesList]);

  const handleClearAll = () => {
    clearFavorites();
    toast.success(t("common.removed"));
    setProperties([]);
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("favorites.title")}</h1>
              <p className="text-muted-foreground">
                {favoritesCount > 0
                  ? t("favorites.savedCount", { count: favoritesCount })
                  : t("favorites.subtitle")}
              </p>
            </div>
            {favoritesCount > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                {t("favorites.clearAll")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-56 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {properties.map((property, idx) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{t("favorites.emptyTitle")}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("favorites.emptyDesc")}</p>
            <Button
              onClick={() => navigate("properties")}
              className="gap-2 rounded-full px-8"
            >
              {t("favorites.browseNow")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
