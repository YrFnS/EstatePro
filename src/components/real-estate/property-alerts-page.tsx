"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing,
  Plus,
  Trash2,
  Eye,
  Zap,
  Clock,
  CalendarDays,
  Home,
  Building,
  Castle,
  Hotel,
  Landmark,
  Crown,
  Search,
  AlertCircle,
  BellOff,
  Sparkles,
  TrendingUp,
  MapPin,
  Pencil,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface PropertyAlert {
  id: string;
  name: string;
  propertyType: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  minArea: number;
  maxArea: number;
  location: string;
  frequency: "instant" | "daily" | "weekly";
  enabled: boolean;
  createdAt: string;
  matchCount: number;
}

interface AlertHistoryItem {
  id: string;
  alertId: string;
  alertName: string;
  propertyName: string;
  propertyId: string;
  matchedAt: string;
}

const STORAGE_KEY = "estatepro-property-alerts";
const HISTORY_KEY = "estatepro-property-alerts-history";

const PROPERTY_TYPES = [
  { value: "apartment", icon: Building },
  { value: "villa", icon: Castle },
  { value: "house", icon: Home },
  { value: "condo", icon: Hotel },
  { value: "townhouse", icon: Landmark },
  { value: "penthouse", icon: Crown },
];

const FREQUENCY_STYLES: Record<string, string> = {
  instant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  daily: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  weekly: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

const FREQUENCY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instant: Zap,
  daily: Clock,
  weekly: CalendarDays,
};

function loadAlerts(): PropertyAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PropertyAlert[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function loadHistory(): AlertHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: AlertHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function PropertyAlertsPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();

  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({});

  // Form state
  const [alertName, setAlertName] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [status, setStatus] = useState("for-sale");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("any");
  const [bathrooms, setBathrooms] = useState("any");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState<"instant" | "daily" | "weekly">("daily");

  // Load data
  useEffect(() => {
    const loadedAlerts = loadAlerts();
    setAlerts(loadedAlerts);
    if (loadedAlerts.length > 0) {
      setHistory(loadHistory());
    }
  }, []);

  // Fetch real match counts from API
  const fetchMatchCount = useCallback(async (alert: PropertyAlert) => {
    setLoadingMatches((prev) => ({ ...prev, [alert.id]: true }));
    try {
      const queryParams = new URLSearchParams();
      if (alert.propertyType && alert.propertyType !== "any") queryParams.set("type", alert.propertyType);
      if (alert.status) queryParams.set("status", alert.status === "for-sale" ? "sale" : "rent");
      if (alert.minPrice) queryParams.set("minPrice", String(alert.minPrice));
      if (alert.maxPrice) queryParams.set("maxPrice", String(alert.maxPrice));
      if (alert.bedrooms && alert.bedrooms !== "any") queryParams.set("bedrooms", alert.bedrooms.replace("+", ""));
      if (alert.bathrooms && alert.bathrooms !== "any") queryParams.set("bathrooms", alert.bathrooms.replace("+", ""));
      if (alert.minArea) queryParams.set("minArea", String(alert.minArea));
      if (alert.maxArea) queryParams.set("maxArea", String(alert.maxArea));
      if (alert.location) queryParams.set("search", alert.location);
      queryParams.set("limit", "1");
      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      const data = await res.json();
      const count = data.total || 0;
      setMatchCounts((prev) => ({ ...prev, [alert.id]: count }));
      // Also update the alert's matchCount in localStorage
      const currentAlerts = loadAlerts();
      const updatedAlerts = currentAlerts.map((a) =>
        a.id === alert.id ? { ...a, matchCount: count } : a
      );
      saveAlerts(updatedAlerts);
    } catch {
      setMatchCounts((prev) => ({ ...prev, [alert.id]: 0 }));
    } finally {
      setLoadingMatches((prev) => ({ ...prev, [alert.id]: false }));
    }
  }, []);

  // Fetch match counts for all alerts on load
  useEffect(() => {
    if (alerts.length > 0) {
      alerts.forEach((alert) => {
        if (matchCounts[alert.id] === undefined) {
          fetchMatchCount(alert);
        }
      });
    }
  }, [alerts, fetchMatchCount, matchCounts]);

  const handleSaveAlerts = useCallback((updated: PropertyAlert[]) => {
    setAlerts(updated);
    saveAlerts(updated);
  }, []);

  const resetForm = () => {
    setAlertName("");
    setPropertyType("apartment");
    setStatus("for-sale");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("any");
    setBathrooms("any");
    setMinArea("");
    setMaxArea("");
    setLocation("");
    setFrequency("daily");
    setEditingAlertId(null);
  };

  const handleCreateAlert = () => {
    if (!alertName.trim()) return;

    // If editing an existing alert
    if (editingAlertId) {
      const updated = alerts.map((a) =>
        a.id === editingAlertId
          ? {
              ...a,
              name: alertName.trim(),
              propertyType,
              status,
              minPrice: minPrice ? Number(minPrice) : 0,
              maxPrice: maxPrice ? Number(maxPrice) : 0,
              bedrooms,
              bathrooms,
              minArea: minArea ? Number(minArea) : 0,
              maxArea: maxArea ? Number(maxArea) : 0,
              location: location.trim(),
              frequency,
            }
          : a
      );
      handleSaveAlerts(updated);
      resetForm();
      setShowForm(false);
      // Re-fetch match count for edited alert
      const editedAlert = updated.find((a) => a.id === editingAlertId);
      if (editedAlert) {
        setMatchCounts((prev) => {
          const next = { ...prev };
          delete next[editingAlertId];
          return next;
        });
        fetchMatchCount(editedAlert);
      }
      return;
    }

    const newAlert: PropertyAlert = {
      id: `alert-${Date.now()}`,
      name: alertName.trim(),
      propertyType,
      status,
      minPrice: minPrice ? Number(minPrice) : 0,
      maxPrice: maxPrice ? Number(maxPrice) : 0,
      bedrooms,
      bathrooms,
      minArea: minArea ? Number(minArea) : 0,
      maxArea: maxArea ? Number(maxArea) : 0,
      location: location.trim(),
      frequency,
      enabled: true,
      createdAt: new Date().toISOString(),
      matchCount: 0,
    };

    const updated = [newAlert, ...alerts];
    handleSaveAlerts(updated);
    resetForm();
    setShowForm(false);

    // Fetch match count for new alert
    fetchMatchCount(newAlert);

  };

  const handleToggleAlert = (id: string) => {
    const updated = alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    handleSaveAlerts(updated);
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    handleSaveAlerts(updated);
    // Also remove history for this alert
    const updatedHistory = history.filter((h) => h.alertId !== id);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
    // Clean up match count
    setMatchCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleEditAlert = (alert: PropertyAlert) => {
    setEditingAlertId(alert.id);
    setAlertName(alert.name);
    setPropertyType(alert.propertyType);
    setStatus(alert.status);
    setMinPrice(alert.minPrice ? String(alert.minPrice) : "");
    setMaxPrice(alert.maxPrice ? String(alert.maxPrice) : "");
    setBedrooms(alert.bedrooms);
    setBathrooms(alert.bathrooms);
    setMinArea(alert.minArea ? String(alert.minArea) : "");
    setMaxArea(alert.maxArea ? String(alert.maxArea) : "");
    setLocation(alert.location);
    setFrequency(alert.frequency);
    setShowForm(true);
  };

  const handleViewMatches = (alert: PropertyAlert) => {
    const params: Record<string, string> = {};
    if (alert.propertyType && alert.propertyType !== "any") params.type = alert.propertyType;
    if (alert.status) params.status = alert.status === "for-sale" ? "sale" : "rent";
    if (alert.minPrice) params.minPrice = String(alert.minPrice);
    if (alert.maxPrice) params.maxPrice = String(alert.maxPrice);
    if (alert.bedrooms && alert.bedrooms !== "any") params.bedrooms = alert.bedrooms;
    if (alert.location) params.search = alert.location;
    navigate("properties", params);
  };

  const handleQuickTemplate = (template: {
    name: string;
    propertyType: string;
    status: string;
    minPrice: number;
    maxPrice: number;
    bedrooms: string;
    location: string;
    frequency: "instant" | "daily" | "weekly";
  }) => {
    const newAlert: PropertyAlert = {
      id: `alert-${Date.now()}`,
      name: template.name,
      propertyType: template.propertyType,
      status: template.status,
      minPrice: template.minPrice,
      maxPrice: template.maxPrice,
      bedrooms: template.bedrooms,
      bathrooms: "any",
      minArea: 0,
      maxArea: 0,
      location: template.location,
      frequency: template.frequency,
      enabled: true,
      createdAt: new Date().toISOString(),
      matchCount: 0,
    };
    const updated = [newAlert, ...alerts];
    handleSaveAlerts(updated);
    fetchMatchCount(newAlert);
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("alerts.justNow") || "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCriteriaBadges = (alert: PropertyAlert) => {
    const badges: { label: string; color: string }[] = [];
    if (alert.propertyType && alert.propertyType !== "any") {
      badges.push({
        label: t(`properties.${alert.propertyType}`) || alert.propertyType,
        color: "bg-primary/10 text-primary",
      });
    }
    if (alert.status) {
      badges.push({
        label: alert.status === "for-sale" ? t("common.forSale") : t("common.forRent"),
        color: "bg-primary/10 text-primary",
      });
    }
    if (alert.minPrice || alert.maxPrice) {
      const min = alert.minPrice ? `$${(alert.minPrice / 1000).toFixed(0)}K` : "";
      const max = alert.maxPrice ? `$${(alert.maxPrice / 1000).toFixed(0)}K` : "";
      badges.push({
        label: `${min}-${max}`,
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      });
    }
    if (alert.bedrooms && alert.bedrooms !== "any") {
      badges.push({
        label: `${alert.bedrooms} ${t("properties.bedrooms") || "Beds"}`,
        color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
      });
    }
    if (alert.location) {
      badges.push({
        label: alert.location,
        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      });
    }
    return badges;
  };

  const quickTemplates = [
    {
      name: t("alerts.budgetHomes") || "Budget Homes Under $300K",
      propertyType: "any",
      status: "for-sale",
      minPrice: 0,
      maxPrice: 300000,
      bedrooms: "any",
      location: "",
      frequency: "daily" as const,
      icon: Home,
      desc: t("alerts.budgetHomesDesc") || "Houses & apartments under $300K",
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
      frequency: "weekly" as const,
      icon: Crown,
      desc: t("alerts.luxuryPropertiesDesc") || "Premium properties $1M+",
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
      frequency: "instant" as const,
      icon: Building,
      desc: t("alerts.newRentalsDesc") || "Apartments for rent in Downtown",
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
      frequency: "daily" as const,
      icon: Castle,
      desc: t("alerts.familyHomesDesc") || "Houses with 3+ bedrooms",
      color: "text-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 start-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-10 w-96 h-96 bg-primary-foreground/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                <BellRing className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge className="bg-white/20 border-0 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 me-1" />
                {t("alerts.smartAlerts")}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
              {t("alerts.title") || "Property Alerts"}
            </h1>
            <p className="text-white/80 text-lg">
              {t("alerts.subtitle") || "Get notified when new properties matching your criteria become available"}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form & Templates */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Alert Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Button
                onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) resetForm();
                }}
                className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                {t("alerts.createAlert") || "Create Alert"}
              </Button>
            </motion.div>

            {/* Alert Creation Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-primary/20/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BellRing className="w-5 h-5 text-primary" />
                        {editingAlertId
                          ? t("alerts.editAlert")
                          : (t("alerts.createAlert") || "Create Alert")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Alert Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("alerts.alertName") || "Alert Name"}</label>
                        <Input
                          placeholder={t("alerts.alertNamePlaceholder") || "e.g., Downtown Apartments Under $500K"}
                          value={alertName}
                          onChange={(e) => setAlertName(e.target.value)}
                          className="h-10"
                        />
                      </div>

                      {/* Property Type */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("properties.propertyType") || "Property Type"}</label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">{t("properties.any") || "Any"}</SelectItem>
                            {PROPERTY_TYPES.map((pt) => (
                              <SelectItem key={pt.value} value={pt.value}>
                                {t(`properties.${pt.value}`) || pt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("properties.propertyType") === "نوع العقار" ? "الحالة" : "Status"}</label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="for-sale">{t("common.forSale") || "For Sale"}</SelectItem>
                            <SelectItem value="for-rent">{t("common.forRent") || "For Rent"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("properties.priceRange") || "Price Range"}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t("properties.minPrice") || "Min Price"}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder={t("properties.maxPrice") || "Max Price"}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </div>

                      {/* Bedrooms & Bathrooms */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{t("properties.bedrooms") || "Bedrooms"}</label>
                          <Select value={bedrooms} onValueChange={setBedrooms}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">{t("properties.any") || "Any"}</SelectItem>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={`${n}+`}>{n}+</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{t("properties.bathrooms") || "Bathrooms"}</label>
                          <Select value={bathrooms} onValueChange={setBathrooms}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">{t("properties.any") || "Any"}</SelectItem>
                              {[1, 2, 3, 4].map((n) => (
                                <SelectItem key={n} value={`${n}+`}>{n}+</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Area Range */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("properties.area") || "Area"} (sqft)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t("properties.minArea") || "Min"}
                            value={minArea}
                            onChange={(e) => setMinArea(e.target.value)}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder={t("properties.maxArea") || "Max"}
                            value={maxArea}
                            onChange={(e) => setMaxArea(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("hero.location") || "Location"}</label>
                        <Input
                          placeholder={t("hero.searchPlaceholder") || "City, neighborhood..."}
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-10"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t("alerts.frequency") || "Frequency"}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["instant", "daily", "weekly"] as const).map((freq) => {
                            const FreqIcon = FREQUENCY_ICONS[freq];
                            return (
                              <button
                                key={freq}
                                onClick={() => setFrequency(freq)}
                                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                                  frequency === freq
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted hover:border-primary/30 dark:hover:border-primary/60"
                                }`}
                              >
                                <FreqIcon className="w-4 h-4" />
                                {t(`alerts.${freq}`) || freq.charAt(0).toUpperCase() + freq.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Submit */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateAlert}
                          disabled={!alertName.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          <BellRing className="w-4 h-4 me-2" />
                          {editingAlertId
                            ? t("alerts.updateAlert")
                            : (t("alerts.createAlert") || "Create Alert")}
                        </Button>
                        <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>
                          {t("common.cancel") || "Cancel"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Alert Templates */}
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
                        onClick={() => handleQuickTemplate(template)}
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
          </div>

          {/* Right Column - Alerts & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Alerts */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BellRing className="w-5 h-5 text-primary" />
                      {t("alerts.activeAlerts") || "Active Alerts"}
                      {alerts.length > 0 && (
                        <Badge variant="secondary" className="ms-1">
                          {alerts.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                        <BellOff className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        {t("alerts.noAlerts") || "No Alerts Yet"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                        {t("alerts.noAlertsDesc") || "Create your first alert to get notified when matching properties become available"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {t("alerts.createAlert") || "Create Alert"}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {alerts.map((alert, idx) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`rounded-xl border bg-card p-4 hover:shadow-md transition-all border-s-4 ${
                              alert.enabled
                                ? "border-s-primary"
                                : "border-s-gray-300 dark:border-s-gray-600 opacity-70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-base truncate">{alert.name}</h4>
                                  <Badge className={FREQUENCY_STYLES[alert.frequency]}>
                                    {(() => {
                                      const FIcon = FREQUENCY_ICONS[alert.frequency];
                                      return <FIcon className="w-3 h-3 me-1" />;
                                    })()}
                                    {t(`alerts.${alert.frequency}`) || alert.frequency}
                                  </Badge>
                                </div>

                                {/* Criteria Badges */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {getCriteriaBadges(alert).map((badge, i) => (
                                    <Badge key={i} variant="secondary" className={`text-xs ${badge.color}`}>
                                      {badge.label}
                                    </Badge>
                                  ))}
                                </div>

                                {/* Meta info */}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {formatDate(alert.createdAt)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {t("alerts.matchCount") || "Matches"}:{" "}
                                    {loadingMatches[alert.id] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <span className="font-semibold text-primary">{matchCounts[alert.id] ?? alert.matchCount}</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Switch
                                  checked={alert.enabled}
                                  onCheckedChange={() => handleToggleAlert(alert.id)}
                                  aria-label={alert.enabled ? t("alerts.enabled") || "Enabled" : t("alerts.disabled") || "Disabled"}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => fetchMatchCount(alert)}
                                  title={t("alerts.refreshMatchCount")}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewMatches(alert)}
                                  title={t("alerts.viewMatches") || "View Matches"}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditAlert(alert)}
                                  title={t("alerts.editAlertShort")}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteAlert(alert.id)}
                                  title={t("alerts.deleteAlert") || "Delete Alert"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Status label */}
                            <div className="mt-2">
                              <span className={`text-xs font-medium ${alert.enabled ? "text-primary" : "text-muted-foreground"}`}>
                                {alert.enabled ? (t("alerts.enabled") || "Enabled") : (t("alerts.disabled") || "Disabled")}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Alert History */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-sky-600" />
                    {t("alerts.alertHistory") || "Alert History"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-3">
                        <AlertCircle className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("alerts.noHistory") || "No alert matches yet. Create an alert to start receiving notifications."}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute start-5 top-0 bottom-0 w-px bg-border" />

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {history.slice(0, 15).map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.03 }}
                            className="relative ps-10"
                          >
                            {/* Timeline dot */}
                            <div className="absolute start-3.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm">
                                  <span className="font-medium">{t("alerts.matchedProperty") || "Matched property"}:</span>{" "}
                                  <button
                                    onClick={() => navigate("property-detail", { id: item.propertyId })}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {item.propertyName}
                                  </button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <BellRing className="w-3 h-3" />
                                  {item.alertName}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatRelativeTime(item.matchedAt)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
