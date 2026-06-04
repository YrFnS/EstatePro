"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeUp } from "@/components/real-estate/types/animations";
import { Home, Building, Sparkles, DollarSign, Bed, Star } from "lucide-react";
import type { QuickSearchItem } from "./dashboard-types";

const quickSearches: QuickSearchItem[] = [
  { key: "buyHome", icon: Home, filters: { status: "sale" }, color: "bg-primary" },
  { key: "rentHome", icon: Building, filters: { status: "rent" }, color: "bg-primary" },
  { key: "luxury", icon: Sparkles, filters: { minPrice: "1000000" }, color: "from-amber-500 to-amber-600" },
  { key: "under500k", icon: DollarSign, filters: { maxPrice: "500000" }, color: "bg-primary" },
  { key: "threePlusBeds", icon: Bed, filters: { bedrooms: "3" }, color: "from-violet-500 to-violet-600" },
  { key: "newListings", icon: Star, filters: { sort: "newest" }, color: "from-rose-500 to-rose-600" },
];

export function QuickSearchShortcuts() {
  const { t } = useI18n();
  const { navigate } = useRouter();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5 text-primary" />
            {t("dashboard.quickSearch")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickSearches.map((item) => (
              <motion.button
                key={item.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("properties", item.filters)}
                className="relative overflow-hidden rounded-xl p-4 text-start group cursor-pointer border hover:shadow-md transition-shadow"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 ${item.color} opacity-[0.07] group-hover:opacity-[0.14] transition-opacity`} />

                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${item.color} text-primary-foreground mb-2.5`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-sm font-semibold">{t(`dashboard.${item.key}`)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
