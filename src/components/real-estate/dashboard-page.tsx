"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useAuth } from "@/lib/auth-context";
import { getActivities, clearActivities, getSavedSearchesCount, type ActivityType } from "@/lib/activity-log";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Heart,
  Scale,
  Search,
  Eye,
  Clock,
  PlusCircle,
  Brain,
  DollarSign,
  Home,
  Sparkles,
  Shield,
  Bell,
  Mail,
  AlertTriangle,
  LogIn,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Star,
  Building,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import type { Property } from "@/components/real-estate/types/property";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "favorite":
      return Heart;
    case "compare":
      return Scale;
    case "search":
      return Search;
    case "view":
      return Eye;
    case "inquiry":
      return Mail;
    default:
      return Clock;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "favorite":
      return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    case "compare":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "search":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    case "view":
      return "bg-primary/10 text-primary";
    case "inquiry":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function formatTimeAgo(timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
  if (hours < 24) return t("notifications.hoursAgo", { count: hours });
  return t("notifications.daysAgo", { count: days });
}

export function DashboardPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { favoritesCount, favoritesList } = useFavorites();
  const { compareCount } = useCompare();
  const { recentlyViewedCount } = useRecentlyViewed();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [savedSearchesCount, setSavedSearchesCount] = useState(0);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Notification settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [propertyAlerts, setPropertyAlerts] = useState(true);

  // Load data on mount
  useEffect(() => {
    setActivities(getActivities(10));
    setSavedSearchesCount(getSavedSearchesCount());

    // Load notification preferences
    try {
      const prefs = JSON.parse(localStorage.getItem("estatepro-notification-prefs") || "{}");
      if (prefs.emailNotifs !== undefined) setEmailNotifs(prefs.emailNotifs);
      if (prefs.pushNotifs !== undefined) setPushNotifs(prefs.pushNotifs);
      if (prefs.propertyAlerts !== undefined) setPropertyAlerts(prefs.propertyAlerts);
    } catch {
      // defaults are fine
    }
  }, []);

  // Fetch favorite properties for quick view
  useEffect(() => {
    const fetchFavProperties = async () => {
      if (favoritesList.length === 0) {
        setFavoriteProperties([]);
        return;
      }
      setLoadingFavs(true);
      try {
        const results = await Promise.all(
          favoritesList.slice(0, 8).map(async (id) => {
            const res = await fetch(`/api/properties/${id}`);
            if (res.ok) return await res.json();
            return null;
          })
        );
        setFavoriteProperties(results.filter(Boolean));
      } catch {
        setFavoriteProperties([]);
      } finally {
        setLoadingFavs(false);
      }
    };
    fetchFavProperties();
  }, [favoritesList]);

  // Save notification prefs
  const saveNotifPref = useCallback((key: string, value: boolean) => {
    try {
      const prefs = JSON.parse(localStorage.getItem("estatepro-notification-prefs") || "{}");
      prefs[key] = value;
      localStorage.setItem("estatepro-notification-prefs", JSON.stringify(prefs));
    } catch {
      // silently fail
    }
  }, []);

  const handleClearActivities = () => {
    clearActivities();
    setActivities([]);
    toast.success(t("dashboard.recentActivity") + " cleared");
  };

  // Last visit
  const getLastVisit = () => {
    try {
      const val = localStorage.getItem("estatepro-last-visit");
      if (val) {
        const date = new Date(parseInt(val));
        return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {
      // ignore
    }
    return t("dashboard.today");
  };

  // Save last visit on mount
  useEffect(() => {
    try {
      localStorage.setItem("estatepro-last-visit", Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  // Quick search shortcuts
  const quickSearches = [
    { key: "buyHome", icon: Home, filters: { status: "sale" }, color: "bg-primary" },
    { key: "rentHome", icon: Building, filters: { status: "rent" }, color: "bg-primary" },
    { key: "luxury", icon: Sparkles, filters: { minPrice: "1000000" }, color: "from-amber-500 to-amber-600" },
    { key: "under500k", icon: DollarSign, filters: { maxPrice: "500000" }, color: "bg-primary" },
    { key: "threePlusBeds", icon: Bed, filters: { bedrooms: "3" }, color: "from-violet-500 to-violet-600" },
    { key: "newListings", icon: Star, filters: { sort: "newest" }, color: "from-rose-500 to-rose-600" },
  ];

  // Stats data
  const stats = [
    {
      label: t("dashboard.savedProperties"),
      value: favoritesCount,
      icon: Heart,
      gradient: "from-red-500 to-rose-500",
      bgLight: "bg-red-50 dark:bg-red-950/30",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: t("dashboard.propertiesCompared"),
      value: compareCount,
      icon: Scale,
      gradient: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t("dashboard.searchesSaved"),
      value: savedSearchesCount,
      icon: BookmarkPlus,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: t("dashboard.recentlyViewed"),
      value: recentlyViewedCount,
      icon: Eye,
      gradient: "bg-primary",
      bgLight: "bg-primary/10",
      textColor: "text-primary",
    },
  ];

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* ===================== A. DASHBOARD HEADER ===================== */}
        <motion.div {...fadeUp} className="mb-8">
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
                  <h1 className="text-2xl md:text-3xl font-bold">{isAuthenticated && user ? user.name : t("dashboard.guestUser")}</h1>
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

        {/* ===================== B. ACTIVITY OVERVIEW STATS ===================== */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Gradient accent at top */}
                <div className={`absolute top-0 inset-x-0 h-1 ${stat.gradient}`} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bgLight}`}>
                      <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                    <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* ===================== C. RECENT ACTIVITY TIMELINE ===================== */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-primary" />
                      {t("dashboard.recentActivity")}
                    </CardTitle>
                    {activities.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearActivities}
                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("notifications.clearAll")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
                      {activities.map((activity, idx) => {
                        const Icon = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);
                        const typeLabel = t(`dashboard.${activity.type === "favorite" ? "favorited" : activity.type === "compare" ? "compared" : activity.type === "search" ? "searched" : activity.type === "view" ? "viewed" : "inquired"}`);

                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            {/* Timeline line */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {idx < activities.length - 1 && (
                                <div className="w-px h-6 bg-border" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                                  {typeLabel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(activity.timestamp, t)}
                                </span>
                              </div>
                              <p className="text-sm truncate">{activity.description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{t("dashboard.noActivity")}</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        {t("dashboard.noActivityDesc")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ===================== D. SAVED PROPERTIES QUICK VIEW ===================== */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
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
                  {favoriteProperties.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                      {favoriteProperties.map((property) => {
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

            {/* ===================== E. QUICK SEARCH SHORTCUTS ===================== */}
            <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
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
          </div>

          {/* Right Column - Account Settings */}
          <div className="space-y-8">
            {/* ===================== F. ACCOUNT SETTINGS PREVIEW ===================== */}
            <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
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
                        <span className="text-sm">{t("dashboard.flagEmoji")}</span>
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
                          onCheckedChange={(v) => {
                            setEmailNotifs(v);
                            saveNotifPref("emailNotifs", v);
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{t("dashboard.pushNotifications")}</span>
                        </div>
                        <Switch
                          checked={pushNotifs}
                          onCheckedChange={(v) => {
                            setPushNotifs(v);
                            saveNotifPref("pushNotifs", v);
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{t("dashboard.propertyAlerts")}</span>
                        </div>
                        <Switch
                          checked={propertyAlerts}
                          onCheckedChange={(v) => {
                            setPropertyAlerts(v);
                            saveNotifPref("propertyAlerts", v);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sign In / User Info */}
                  <div className="text-center pt-2">
                    {isAuthenticated && user ? (
                      <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-accent/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] font-bold text-sm">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="text-start">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => navigate("home")}
                        className="w-full gap-2 rounded-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-[var(--gold-foreground)]"
                      >
                        <LogIn className="w-4 h-4" />
                        {t("auth.signIn")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions Card (mobile-only shows here too for better access) */}
            <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
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
        </div>
      </div>
    </div>
  );
}
