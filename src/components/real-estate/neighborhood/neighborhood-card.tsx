"use client";

import { motion } from "framer-motion";
import {
  MapPin, Bus, Shield, UtensilsCrossed, GraduationCap,
  TreePine, ShoppingBag, ArrowRight, Users, Briefcase, Heart,
  Star, TrendingUp, Home
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { staggerItem } from "@/components/real-estate/types/animations";
import type { View } from "@/lib/router";
import type { NeighborhoodData } from "./neighborhood-data";
import { ScoreBar } from "./score-bar";

const bestForIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "neighborhoodGuide.families": Users,
  "neighborhoodGuide.youngProfessionals": Briefcase,
  "neighborhoodGuide.retirees": Heart,
  "neighborhoodGuide.investors": TrendingUp,
  "neighborhoodGuide.luxurySeekers": Star,
  "neighborhoodGuide.firstTimeBuyers": Home,
  "neighborhoodGuide.petLovers": TreePine,
};

interface NeighborhoodCardProps {
  nb: NeighborhoodData;
  t: (key: string) => string;
  onNavigate: (view: View, params?: Record<string, string>) => void;
}

export function NeighborhoodCard({ nb, t, onNavigate }: NeighborhoodCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group cursor-pointer">
        {/* Gradient Header */}
        <div className={`bg-primary p-5 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full bg-white/10" />
          <h3 className="text-lg font-bold text-primary-foreground relative z-10">{t(nb.nameKey)}</h3>
          <span className="text-white/80 text-sm relative z-10">{nb.avgPrice}</span>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Scores */}
          <div className="space-y-2">
            <ScoreBar value={nb.walkScore} label={t("neighborhoodGuide.walkScore")} icon={MapPin} color="bg-primary" />
            <ScoreBar value={nb.transitScore} label={t("neighborhoodGuide.transitScore")} icon={Bus} color="bg-primary" />
            <ScoreBar value={nb.safetyRating} label={t("neighborhoodGuide.safetyRating")} icon={Shield} color="bg-amber-500" />
          </div>

          {/* Top amenities */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
              <span>{nb.restaurants}+</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>{nb.schools}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TreePine className="w-3.5 h-3.5 text-cyan-500" />
              <span>{nb.parks}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>{nb.shopping}</span>
            </div>
          </div>

          {/* Property count & browse button */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {nb.propertyCount} {t("neighborhoodGuide.properties")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-primary hover:text-primary"
              onClick={() => onNavigate("properties", { search: t(nb.nameKey) })}
            >
              {t("neighborhoodGuide.browse")}
              <ArrowRight className="w-3 h-3 ms-1" />
            </Button>
          </div>

          {/* Best for tags */}
          <div className="flex flex-wrap gap-1.5">
            {nb.bestForKeys.map((key) => {
              const Icon = bestForIcons[key] || Star;
              return (
                <Badge key={key} variant="secondary" className="text-[10px] px-2 py-0.5">
                  <Icon className="w-2.5 h-2.5 me-1" />
                  {t(key)}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
