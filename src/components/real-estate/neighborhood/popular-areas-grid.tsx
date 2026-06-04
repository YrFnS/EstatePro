"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeUp, staggerContainer, staggerItem } from "@/components/real-estate/types/animations";
import type { View } from "@/lib/router";
import { neighborhoods } from "./neighborhood-data";

interface PopularAreasGridProps {
  t: (key: string) => string;
  onNavigate: (view: View, params?: Record<string, string>) => void;
}

export function PopularAreasGrid({ t, onNavigate }: PopularAreasGridProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.popularTitle")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.popularSubtitle")}</p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
        >
          {neighborhoods.map((nb, idx) => (
            <motion.div key={nb.id} variants={staggerItem}>
              <Card
                className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 break-inside-avoid group cursor-pointer"
                onClick={() => onNavigate("properties", { search: t(nb.nameKey) })}
              >
                <div className={`bg-primary relative overflow-hidden ${
                  idx % 3 === 0 ? "h-48" : idx % 3 === 1 ? "h-64" : "h-56"
                }`}>
                  {/* Decorative elements */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -start-4 w-20 h-20 rounded-full bg-white/5" />

                  {/* Content overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h3 className="text-xl font-bold text-primary-foreground mb-1">{t(nb.nameKey)}</h3>
                    <p className="text-white/80 text-sm mb-2">{nb.avgPrice}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-primary-foreground border-white/30 text-xs">
                        <MapPin className="w-3 h-3 me-1" />
                        {nb.propertyCount} {t("neighborhoodGuide.properties")}
                      </Badge>
                      <Badge className="bg-white/20 text-primary-foreground border-white/30 text-xs">
                        <Zap className="w-3 h-3 me-1" />
                        {nb.walkScore} {t("neighborhoodGuide.walkScore")}
                      </Badge>
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <ArrowRight className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
