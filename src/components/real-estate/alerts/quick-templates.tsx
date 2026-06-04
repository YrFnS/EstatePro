"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import { Home, Crown, Building, Castle, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickTemplate } from "./alerts-types";

export interface QuickTemplatesProps {
  onSelectTemplate: (template: QuickTemplate) => void;
}

export function QuickTemplates({ onSelectTemplate }: QuickTemplatesProps) {
  const { t } = useI18n();

  const quickTemplates: QuickTemplate[] = [
    {
      name: t("alerts.budgetHomes") || "Budget Homes Under $300K",
      propertyType: "any",
      status: "for-sale",
      minPrice: 0,
      maxPrice: 300000,
      bedrooms: "any",
      location: "",
      frequency: "daily",
      icon: Home,
      desc: "Houses & apartments under $300K",
      color: "text-primary",
    },
    {
      name: t("alerts.luxuryProperties") || "Luxury Properties Over $1M",
      propertyType: "any",
      status: "for-sale",
      minPrice: 1000000,
      maxPrice: 0,
      bedrooms: "3+",
      location: "",
      frequency: "weekly",
      icon: Crown,
      desc: "Premium properties $1M+",
      color: "text-amber-600",
    },
    {
      name: t("alerts.newRentals") || "New Rentals in Downtown",
      propertyType: "apartment",
      status: "for-rent",
      minPrice: 0,
      maxPrice: 0,
      bedrooms: "any",
      location: "Downtown",
      frequency: "instant",
      icon: Building,
      desc: "Apartments for rent in Downtown",
      color: "text-sky-600",
    },
    {
      name: t("alerts.familyHomes") || "Family Homes 3+ Bedrooms",
      propertyType: "house",
      status: "for-sale",
      minPrice: 0,
      maxPrice: 0,
      bedrooms: "3+",
      location: "",
      frequency: "daily",
      icon: Castle,
      desc: "Houses with 3+ bedrooms",
      color: "text-violet-600",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t("alerts.quickTemplates") || "Quick Templates"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickTemplates.map((template, idx) => {
            const TemplateIcon = template.icon;
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                onClick={() => onSelectTemplate(template)}
                className="w-full cursor-pointer hover:bg-muted/50 transition-colors rounded-xl p-4 border-2 border-dashed border-muted hover:border-primary/30 dark:hover:border-primary/60 text-start"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${template.color}`}>
                    <TemplateIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{template.desc}</div>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </motion.button>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
