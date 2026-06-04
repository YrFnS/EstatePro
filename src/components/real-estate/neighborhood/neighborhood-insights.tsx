"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp, staggerContainer, staggerItem } from "@/components/real-estate/types/animations";
import { neighborhoods } from "./neighborhood-data";

interface NeighborhoodInsightsProps {
  t: (key: string) => string;
}

export function NeighborhoodInsights({ t }: NeighborhoodInsightsProps) {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("neighborhoodGuide.insightsTitle")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("neighborhoodGuide.insightsSubtitle")}</p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto"
        >
          {neighborhoods.map((nb) => (
            <motion.div key={nb.id} variants={staggerItem}>
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0`}>
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{t(nb.nameKey)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(nb.insightKey)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
