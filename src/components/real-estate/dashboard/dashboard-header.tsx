"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion } from "framer-motion";
import { User, Clock, PlusCircle, Brain, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/real-estate/types/animations";

interface DashboardHeaderProps {
  getLastVisit: () => string;
}

export function DashboardHeader({ getLastVisit }: DashboardHeaderProps) {
  const { t } = useI18n();
  const { navigate } = useRouter();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8 text-primary-foreground">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -end-24 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -start-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 end-1/4 w-32 h-32 rounded-full bg-white/5" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">{t("dashboard.welcome")}</p>
              <h1 className="text-2xl md:text-3xl font-bold">{t("dashboard.guestUser")}</h1>
              <p className="text-primary-foreground/80 text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {t("dashboard.lastVisit")}: {getLastVisit()}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("list-property")}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-primary-foreground border border-white/20 gap-2 rounded-full"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t("dashboard.listProperty")}</span>
              <span className="sm:hidden">{t("dashboard.listProperty")}</span>
            </Button>
            <Button
              onClick={() => navigate("ai-recommend")}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-primary-foreground border border-white/20 gap-2 rounded-full"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">{t("dashboard.getRecommendations")}</span>
              <span className="sm:hidden">{t("dashboard.getRecommendations")}</span>
            </Button>
            <Button
              onClick={() => navigate("valuation")}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-primary-foreground border border-white/20 gap-2 rounded-full"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">{t("dashboard.propertyValuation")}</span>
              <span className="sm:hidden">{t("dashboard.propertyValuation")}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
