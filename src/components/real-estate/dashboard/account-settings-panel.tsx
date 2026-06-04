"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Shield,
  Bell,
  Mail,
  AlertTriangle,
  LogIn,
  Sparkles,
  PlusCircle,
  Brain,
  DollarSign,
  BookmarkPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { fadeUp } from "@/components/real-estate/types/animations";

interface AccountSettingsPanelProps {
  emailNotifs: boolean;
  pushNotifs: boolean;
  propertyAlerts: boolean;
  onEmailNotifsChange: (v: boolean) => void;
  onPushNotifsChange: (v: boolean) => void;
  onPropertyAlertsChange: (v: boolean) => void;
}

export function AccountSettingsPanel({
  emailNotifs,
  pushNotifs,
  propertyAlerts,
  onEmailNotifsChange,
  onPushNotifsChange,
  onPropertyAlertsChange,
}: AccountSettingsPanelProps) {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { theme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Account Settings Preview */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              {t("dashboard.accountSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  {theme === "dark" ? (
                    <span className="text-sm">🌙</span>
                  ) : (
                    <span className="text-sm">☀️</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t("dashboard.theme")}</p>
                  <p className="text-xs text-muted-foreground capitalize">{theme}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  <span className="text-sm">{locale === "ar" ? "🇸🇦" : "🇺🇸"}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("dashboard.language")}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar" ? t("common.arabic") : t("common.english")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                {t("dashboard.notifications")}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t("dashboard.emailNotifications")}</span>
                  </div>
                  <Switch
                    checked={emailNotifs}
                    onCheckedChange={onEmailNotifsChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t("dashboard.pushNotifications")}</span>
                  </div>
                  <Switch
                    checked={pushNotifs}
                    onCheckedChange={onPushNotifsChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t("dashboard.propertyAlerts")}</span>
                  </div>
                  <Switch
                    checked={propertyAlerts}
                    onCheckedChange={onPropertyAlertsChange}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Sign In */}
            <div className="text-center pt-2">
              <Button
                disabled
                className="w-full gap-2 rounded-full relative"
              >
                <LogIn className="w-4 h-4" />
                {t("dashboard.signIn")}
                <Badge className="absolute -top-2 -end-2 text-[10px] px-1.5 py-0 bg-amber-500 text-primary-foreground border-amber-600 hover:bg-amber-500">
                  {t("dashboard.comingSoon")}
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Card */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-11"
              onClick={() => navigate("list-property")}
            >
              <PlusCircle className="w-4 h-4 text-primary" />
              {t("dashboard.listProperty")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-11"
              onClick={() => navigate("ai-recommend")}
            >
              <Brain className="w-4 h-4 text-violet-500" />
              {t("dashboard.getRecommendations")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-11"
              onClick={() => navigate("valuation")}
            >
              <DollarSign className="w-4 h-4 text-amber-500" />
              {t("dashboard.propertyValuation")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-11"
              onClick={() => navigate("calculator")}
            >
              <DollarSign className="w-4 h-4 text-primary" />
              {t("common.calculator")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-11"
              onClick={() => navigate("saved-searches")}
            >
              <BookmarkPlus className="w-4 h-4 text-blue-500" />
              {t("savedSearch.title")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
