"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  BarChart3,
  TrendingUp,
  MessageSquare,
  MapPin,
  Building2,
  LogIn,
  LogOut,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronRight,
  Shield,
  Star,
  Globe,
  ArrowUpDown,
  ExternalLink,
  Home,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ===== Types =====
interface SiteSetting {
  id: string;
  key: string;
  valueEn: string;
  valueAr: string;
  category: string;
  type: string;
  updatedAt: string;
  createdAt: string;
}

interface Testimonial {
  id: string;
  authorEn: string;
  authorAr: string;
  roleEn: string;
  roleAr: string;
  contentEn: string;
  contentAr: string;
  avatar: string;
  rating: number;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Neighborhood {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  avgPrice: string;
  propertyCount: number;
  searchQuery: string;
  image: string;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PropertyTypeConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  type: string;
  icon: string;
  listingCount: number;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MarketDataPoint {
  id: string;
  label: string;
  value: number;
  period: string;
  createdAt: string;
}

interface MarketStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: string;
  change: string;
  changeType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

type TabKey = "site" | "stats" | "market" | "testimonials" | "neighborhoods" | "propertyTypes";

// ===== Main Component =====
export default function AdminPage() {
  const { t, dir, locale } = useI18n();
  const isRTL = dir === "rtl";

  // Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("site");

  // Data state
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeConfig[]>([]);
  const [dataPoints, setDataPoints] = useState<MarketDataPoint[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);

  // Loading states
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state for settings
  const [editedSettings, setEditedSettings] = useState<Record<string, { valueEn: string; valueAr: string }>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogData, setDialogData] = useState<Record<string, string | number | boolean>>({});
  const [dialogType, setDialogType] = useState<"testimonial" | "neighborhood" | "propertyType" | "dataPoint" | "stat">("testimonial");

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: "",
    id: "",
  });

  // ===== Auth =====
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
        toast.success(t("admin.loggedInSuccessfully"));
      } else {
        const data = await res.json();
        toast.error(data.error || t("admin.loginFailed"));
      }
    } catch {
      toast.error(t("admin.connectionFailed"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    setAdminUser(null);
    toast.success(t("admin.loggedOut"));
  };

  // ===== Load Data =====
  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [settingsRes, testimonialsRes, neighborhoodsRes, propertyTypesRes, marketDataRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/testimonials"),
        fetch("/api/admin/neighborhoods"),
        fetch("/api/admin/property-types"),
        fetch("/api/admin/market-data"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings || []);
      }
      if (testimonialsRes.ok) {
        const data = await testimonialsRes.json();
        setTestimonials(data.testimonials || []);
      }
      if (neighborhoodsRes.ok) {
        const data = await neighborhoodsRes.json();
        setNeighborhoods(data.neighborhoods || []);
      }
      if (propertyTypesRes.ok) {
        const data = await propertyTypesRes.json();
        setPropertyTypes(data.propertyTypes || []);
      }
      if (marketDataRes.ok) {
        const data = await marketDataRes.json();
        setDataPoints(data.dataPoints || []);
        setMarketStats(data.stats || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("admin.failedLoadData"));
    } finally {
      setDataLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (adminUser) {
      loadAllData();
    }
  }, [adminUser, loadAllData]);

  // ===== Settings Helpers =====
  const getSetting = (key: string): SiteSetting | undefined =>
    settings.find((s) => s.key === key);

  const getSettingValue = (key: string, lang?: "en" | "ar"): string => {
    const setting = getSetting(key);
    if (!setting) return "";
    const edited = editedSettings[key];
    if (edited) {
      return lang === "ar" ? edited.valueAr : edited.valueEn;
    }
    return lang === "ar" ? setting.valueAr : setting.valueEn;
  };

  const updateEditedSetting = (key: string, field: "valueEn" | "valueAr", value: string) => {
    setEditedSettings((prev) => {
      const current = prev[key] || { valueEn: getSetting(key)?.valueEn || "", valueAr: getSetting(key)?.valueAr || "" };
      return { ...prev, [key]: { ...current, [field]: value } };
    });
    setIsEditing(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedSettings).map(([key, values]) => ({
        key,
        valueEn: values.valueEn,
        valueAr: values.valueAr,
      }));
      if (updates.length === 0) {
        toast.info(t("admin.noChangesToSave"));
        setSaving(false);
        return;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updates }),
      });
      if (res.ok) {
        toast.success(t("admin.settingsSaved"));
        setEditedSettings({});
        setIsEditing(false);
        loadAllData();
      } else {
        toast.error(t("admin.failedSaveSettings"));
      }
    } catch {
      toast.error(t("admin.connectionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditedSettings({});
    setIsEditing(false);
  };

  // ===== CRUD Helpers =====
  const createItem = async (endpoint: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create");
    }
    return res.json();
  };

  const updateItem = async (endpoint: string, id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update");
    }
    return res.json();
  };

  const deleteItem = async (endpoint: string, id: string) => {
    const res = await fetch(`/api/admin/${endpoint}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete");
    }
    return res.json();
  };

  // ===== Dialog Helpers =====
  const openAddDialog = (type: "testimonial" | "neighborhood" | "propertyType" | "dataPoint" | "stat") => {
    setDialogMode("add");
    setDialogType(type);
    setDialogData({});
    setDialogOpen(true);
  };

  const openEditDialog = (type: "testimonial" | "neighborhood" | "propertyType" | "dataPoint" | "stat", item: Record<string, unknown>) => {
    setDialogMode("edit");
    setDialogType(type);
    setDialogData({ ...item });
    setDialogOpen(true);
  };

  const handleDialogSave = async () => {
    try {
      if (dialogMode === "add") {
        if (dialogType === "testimonial") {
          await createItem("testimonials", dialogData);
        } else if (dialogType === "neighborhood") {
          await createItem("neighborhoods", dialogData);
        } else if (dialogType === "propertyTypes") {
          await createItem("property-types", dialogData);
        } else if (dialogType === "marketData") {
          const endpoint = dialogData.kind === "stat" ? "market-data" : "market-data";
          await createItem(endpoint, dialogData);
        }
        toast.success(t("admin.itemCreated"));
      } else {
        if (dialogType === "testimonial") {
          await updateItem("testimonials", dialogData.id as string, dialogData);
        } else if (dialogType === "neighborhood") {
          await updateItem("neighborhoods", dialogData.id as string, dialogData);
        } else if (dialogType === "propertyTypes") {
          await updateItem("property-types", dialogData.id as string, dialogData);
        } else if (dialogType === "dataPoint" || dialogType === "stat") {
          await updateItem("market-data", dialogData.id as string, dialogData);
        }
        toast.success(t("admin.itemUpdated"));
      }
      setDialogOpen(false);
      loadAllData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.operationFailed"));
    }
  };

  const handleDelete = async () => {
    try {
      const { type, id } = deleteDialog;
      if (type === "testimonial") await deleteItem("testimonials", id);
      else if (type === "neighborhood") await deleteItem("neighborhoods", id);
      else if (type === "propertyType") await deleteItem("property-types", id);
      else await deleteItem("market-data", id);

      toast.success(t("admin.itemDeleted"));
      setDeleteDialog({ open: false, type: "", id: "" });
      loadAllData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.deleteFailed"));
    }
  };

  // ===== Tab Config =====
  const tabs: { key: TabKey; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { key: "site", label: "Site Settings", labelAr: "إعدادات الموقع", icon: <Settings className="w-4 h-4" /> },
    { key: "stats", label: "Statistics", labelAr: "الإحصائيات", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "market", label: "Market Data", labelAr: "بيانات السوق", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "testimonials", label: "Testimonials", labelAr: "الشهادات", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "neighborhoods", label: "Neighborhoods", labelAr: "الأحياء", icon: <MapPin className="w-4 h-4" /> },
    { key: "propertyTypes", label: "Property Types", labelAr: "أنواع العقارات", icon: <Building2 className="w-4 h-4" /> },
  ];

  // ===== Render Helpers =====
  const renderBilingualField = (
    settingKey: string,
    label: string,
    labelAr: string,
    multiline = false
  ) => {
    const valueEn = getSettingValue(settingKey);
    const valueAr = getSettingValue(settingKey, "ar");
    const edited = editedSettings[settingKey];
    const displayEn = edited ? edited.valueEn : valueEn;
    const displayAr = edited ? edited.valueAr : valueAr;

    const Component = multiline ? Textarea : Input;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isRTL ? labelAr : label}
          <Badge variant="outline" className="ms-2 text-[10px] px-1.5">{settingKey}</Badge>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" /> English
            </span>
            <Component
              value={displayEn}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateEditedSetting(settingKey, "valueEn", e.target.value)
              }
              placeholder="English value..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" /> العربية
            </span>
            <Component
              value={displayAr}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateEditedSetting(settingKey, "valueAr", e.target.value)
              }
              placeholder="القيمة بالعربية..."
              className="text-sm"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderListItem = (
    id: string,
    type: string,
    title: string,
    subtitle: string,
    badge?: string,
    item?: Record<string, unknown>
  ) => (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{title}</span>
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 ms-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            let dlgType: "testimonial" | "neighborhood" | "propertyType" | "dataPoint" | "stat" = type as "testimonial" | "neighborhood" | "propertyType" | "dataPoint" | "stat";
            openEditDialog(dlgType, item || {});
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={() => setDeleteDialog({ open: true, type, id })}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  // ===== LOGIN SCREEN =====
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">
                {isRTL ? "لوحة الإدارة" : "Admin Panel"}
              </CardTitle>
              <CardDescription>
                {isRTL ? "سجل الدخول لإدارة الموقع" : "Sign in to manage your site"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {isRTL ? "البريد الإلكتروني" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@estatepro.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {isRTL ? "كلمة المرور" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isRTL ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ===== ADMIN DASHBOARD =====
  const heroSettings = settings.filter((s) => s.category === "hero");
  const statsSettings = settings.filter((s) => s.category === "stats");
  const marketSettings = settings.filter((s) => s.category === "market");
  const generalSettings = settings.filter((s) => s.category === "general" || s.category === "footer" || s.category === "seo");

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--gold-foreground)]" />
            </div>
            <div>
              <h1 className="font-bold text-sm">
                {isRTL ? "لوحة إدارة EstatePro" : "EstatePro Admin"}
              </h1>
              <p className="text-[10px] text-muted-foreground">{adminUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRTL ? "عرض الموقع" : "View Site"}</span>
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? "خروج" : "Logout"}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 border-e bg-muted/30 flex-col">
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.key
                    ? "bg-[var(--gold)] text-[var(--gold-foreground)] shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="flex-1 text-start">{isRTL ? tab.labelAr : tab.label}</span>
                {activeTab === tab.key && (
                  <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] min-w-[60px] transition-colors ${
                activeTab === tab.key
                  ? "text-[var(--gold)]"
                  : "text-muted-foreground"
              }`}
            >
              {tab.icon}
              <span className="truncate">{isRTL ? tab.labelAr : tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
          {/* Dashboard Summary */}
          {!dataLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-l-4 border-l-[var(--gold)]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{settings.length > 0 ? getSettingValue("stats.propertiesSold") || "—" : "—"}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "العقارات" : "Properties"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{testimonials.length}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "الشهادات" : "Testimonials"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{settings.length}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "الإعدادات" : "Settings"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ===== SITE SETTINGS TAB ===== */}
              {activeTab === "site" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{isRTL ? "إعدادات الموقع" : "Site Settings"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إدارة محتوى الموقع والنصوص" : "Manage site content and copy"}
                      </p>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                          <X className="w-3.5 h-3.5" />
                          {isRTL ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button size="sm" onClick={saveSettings} disabled={saving} className="gap-1.5">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {isRTL ? "حفظ" : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <>
                      {/* Hero Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-primary" />
                            </div>
                            {isRTL ? "محتوى البطل" : "Hero Content"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {renderBilingualField("hero.eyebrow", "Eyebrow", "الشريط العلوي")}
                          {renderBilingualField("hero.title", "Title", "العنوان")}
                          {renderBilingualField("hero.subtitle", "Subtitle", "العنوان الفرعي", true)}
                        </CardContent>
                      </Card>

                      {/* CTA Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                              <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            </div>
                            {isRTL ? "محتوى الدعوة للعمل" : "CTA Content"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {renderBilingualField("cta.title", "CTA Title", "عنوان الدعوة")}
                          {renderBilingualField("cta.subtitle", "CTA Subtitle", "العنوان الفرعي", true)}
                        </CardContent>
                      </Card>

                      {/* General & Footer & SEO */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                              <Settings className="w-3.5 h-3.5 text-primary" />
                            </div>
                            {isRTL ? "الإعدادات العامة" : "General Settings"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {generalSettings.map((s) => (
                            <div key={s.key}>
                              {renderBilingualField(
                                s.key,
                                s.key.split(".").pop()?.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()) || s.key,
                                s.key
                              )}
                              <Separator className="mt-4" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}

              {/* ===== STATISTICS TAB ===== */}
              {activeTab === "stats" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{isRTL ? "الإحصائيات" : "Statistics"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إدارة أرقام الإحصائيات المعروضة" : "Manage displayed statistic numbers"}
                      </p>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                          <X className="w-3.5 h-3.5" />
                          {isRTL ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button size="sm" onClick={saveSettings} disabled={saving} className="gap-1.5">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {isRTL ? "حفظ" : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{isRTL ? "أرقام الإحصائيات" : "Stats Numbers"}</CardTitle>
                        <CardDescription>
                          {isRTL ? "القيم المعروضة في قسم الإحصائيات في الصفحة الرئيسية" : "Values displayed in the homepage statistics section"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {statsSettings.map((s) => (
                          <div key={s.key}>
                            {renderBilingualField(
                              s.key,
                              s.key.split(".")[1]?.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()) || s.key,
                              s.key
                            )}
                            <Separator className="mt-4" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ===== MARKET DATA TAB ===== */}
              {activeTab === "market" && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h2 className="text-xl font-bold">{isRTL ? "بيانات السوق" : "Market Data"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "إدارة إحصائيات ونقاط بيانات السوق" : "Manage market stats and chart data points"}
                    </p>
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <>
                      {/* Market Settings */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{isRTL ? "إعدادات السوق" : "Market Settings"}</CardTitle>
                            {isEditing && (
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" onClick={saveSettings} disabled={saving} className="gap-1.5">
                                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {marketSettings.map((s) => (
                            <div key={s.key}>
                              {renderBilingualField(
                                s.key,
                                s.key.split(".")[1]?.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()) || s.key,
                                s.key
                              )}
                              <Separator className="mt-4" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Market Stats */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{isRTL ? "إحصائيات السوق" : "Market Stats"}</CardTitle>
                              <CardDescription>{isRTL ? "بطاقات الإحصائيات المعروضة" : "Displayed stat cards"}</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openAddDialog("stat")} className="gap-1.5">
                              <Plus className="w-3.5 h-3.5" />
                              {isRTL ? "إضافة" : "Add Stat"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {marketStats.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              {isRTL ? "لا توجد إحصائيات" : "No market stats yet"}
                            </p>
                          ) : (
                            marketStats.map((stat) =>
                              renderListItem(
                                stat.id,
                                "stat",
                                isRTL ? stat.labelAr : stat.labelEn,
                                `${stat.value} • ${stat.change || "—"} • ${stat.changeType}`,
                                stat.changeType,
                                { ...stat }
                              )
                            )
                          )}
                        </CardContent>
                      </Card>

                      {/* Chart Data Points */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{isRTL ? "نقاط بيانات الرسم البياني" : "Chart Data Points"}</CardTitle>
                              <CardDescription>{isRTL ? "بيانات رسم بياني أسعار السوق" : "Market price chart data"}</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openAddDialog("dataPoint")} className="gap-1.5">
                              <Plus className="w-3.5 h-3.5" />
                              {isRTL ? "إضافة" : "Add Point"}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {dataPoints.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              {isRTL ? "لا توجد نقاط بيانات" : "No data points yet"}
                            </p>
                          ) : (
                            dataPoints.map((dp) =>
                              renderListItem(
                                dp.id,
                                "dataPoint",
                                dp.label,
                                `${isRTL ? "القيمة" : "Value"}: $${dp.value}K • ${dp.period}`,
                                dp.period,
                                { ...dp }
                              )
                            )
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}

              {/* ===== TESTIMONIALS TAB ===== */}
              {activeTab === "testimonials" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{isRTL ? "الشهادات" : "Testimonials"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إدارة شهادات العملاء" : "Manage client testimonials"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openAddDialog("testimonial")} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      {isRTL ? "إضافة شهادة" : "Add Testimonial"}
                    </Button>
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <div className="space-y-2">
                      {testimonials.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لا توجد شهادات بعد" : "No testimonials yet"}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        testimonials.map((t) => (
                          <Card key={t.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{isRTL ? t.authorAr : t.authorEn}</span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">{isRTL ? t.roleAr : t.roleEn}</span>
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: t.rating }).map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      ))}
                                    </div>
                                    {t.featured && <Badge className="text-[10px]">{isRTL ? "مميز" : "Featured"}</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {isRTL ? t.contentAr || t.contentEn : t.contentEn}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog("testimonial", { ...t })}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteDialog({ open: true, type: "testimonial", id: t.id })}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ===== NEIGHBORHOODS TAB ===== */}
              {activeTab === "neighborhoods" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{isRTL ? "الأحياء" : "Neighborhoods"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إدارة مناطق الأحياء" : "Manage neighborhood areas"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openAddDialog("neighborhood")} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      {isRTL ? "إضافة حي" : "Add Neighborhood"}
                    </Button>
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <div className="space-y-2">
                      {neighborhoods.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لا توجد أحياء بعد" : "No neighborhoods yet"}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        neighborhoods.map((n) => (
                          <Card key={n.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{isRTL ? n.nameAr : n.nameEn}</span>
                                    {n.featured && <Badge className="text-[10px]">{isRTL ? "مميز" : "Featured"}</Badge>}
                                    <Badge variant="outline" className="text-[10px]">{n.avgPrice}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {isRTL ? n.descAr || n.descEn : n.descEn}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {n.propertyCount} {isRTL ? "عقار" : "properties"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog("neighborhood", { ...n })}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteDialog({ open: true, type: "neighborhood", id: n.id })}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ===== PROPERTY TYPES TAB ===== */}
              {activeTab === "propertyTypes" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{isRTL ? "أنواع العقارات" : "Property Types"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "إدارة إعدادات أنواع العقارات" : "Manage property type configurations"}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openAddDialog("propertyType")} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      {isRTL ? "إضافة نوع" : "Add Type"}
                    </Button>
                  </div>

                  {dataLoading ? renderSkeleton() : (
                    <div className="space-y-2">
                      {propertyTypes.length === 0 ? (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? "لا توجد أنواع عقارات بعد" : "No property types yet"}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        propertyTypes.map((pt) => (
                          <Card key={pt.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm">{isRTL ? pt.nameAr : pt.nameEn}</span>
                                      <Badge variant="outline" className="text-[10px]">{pt.type}</Badge>
                                      {pt.featured && <Badge className="text-[10px]">{isRTL ? "مميز" : "Featured"}</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {pt.listingCount} {isRTL ? "إدراج" : "listings"} • {isRTL ? "رمز" : "Icon"}: {pt.icon}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog("propertyType", { ...pt })}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteDialog({ open: true, type: "propertyType", id: pt.id })}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ===== ADD/EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add"
                ? isRTL ? "إضافة عنصر جديد" : "Add New Item"
                : isRTL ? "تعديل العنصر" : "Edit Item"}
              {" "}
              ({isRTL
                ? dialogType === "testimonial" ? "شهادة" : dialogType === "neighborhood" ? "حي" : dialogType === "propertyType" ? "نوع عقار" : dialogType === "stat" ? "إحصائية" : "نقطة بيانات"
                : dialogType === "testimonial" ? "Testimonial" : dialogType === "neighborhood" ? "Neighborhood" : dialogType === "propertyType" ? "Property Type" : dialogType === "stat" ? "Market Stat" : "Data Point"
              })
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Testimonial Fields */}
            {dialogType === "testimonial" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Author (EN) *</Label>
                    <Input value={(dialogData.authorEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, authorEn: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Author (AR)</Label>
                    <Input value={(dialogData.authorAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, authorAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role (EN) *</Label>
                    <Input value={(dialogData.roleEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, roleEn: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role (AR)</Label>
                    <Input value={(dialogData.roleAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, roleAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Content (EN) *</Label>
                  <Textarea value={(dialogData.contentEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, contentEn: e.target.value })} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Content (AR)</Label>
                  <Textarea value={(dialogData.contentAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, contentAr: e.target.value })} rows={3} dir="rtl" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rating</Label>
                    <Select value={String(dialogData.rating ?? 5)} onValueChange={(v) => setDialogData({ ...dialogData, rating: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" value={dialogData.sortOrder ?? 0} onChange={(e) => setDialogData({ ...dialogData, sortOrder: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5 flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch checked={dialogData.featured as boolean || false} onCheckedChange={(v) => setDialogData({ ...dialogData, featured: v })} />
                      <Label className="text-xs">{isRTL ? "مميز" : "Featured"}</Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Neighborhood Fields */}
            {dialogType === "neighborhood" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name (EN) *</Label>
                    <Input value={(dialogData.nameEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, nameEn: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name (AR)</Label>
                    <Input value={(dialogData.nameAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, nameAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (EN) *</Label>
                  <Textarea value={(dialogData.descEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, descEn: e.target.value })} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (AR)</Label>
                  <Textarea value={(dialogData.descAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, descAr: e.target.value })} rows={3} dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Avg Price</Label>
                    <Input value={(dialogData.avgPrice as string) || ""} onChange={(e) => setDialogData({ ...dialogData, avgPrice: e.target.value })} placeholder="$450K - $1.2M" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Property Count</Label>
                    <Input type="number" value={dialogData.propertyCount ?? 0} onChange={(e) => setDialogData({ ...dialogData, propertyCount: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Search Query</Label>
                    <Input value={(dialogData.searchQuery as string) || ""} onChange={(e) => setDialogData({ ...dialogData, searchQuery: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" value={dialogData.sortOrder ?? 0} onChange={(e) => setDialogData({ ...dialogData, sortOrder: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={dialogData.featured as boolean || false} onCheckedChange={(v) => setDialogData({ ...dialogData, featured: v })} />
                  <Label className="text-xs">{isRTL ? "مميز" : "Featured"}</Label>
                </div>
              </>
            )}

            {/* Property Type Fields */}
            {dialogType === "propertyType" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name (EN) *</Label>
                    <Input value={(dialogData.nameEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, nameEn: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name (AR)</Label>
                    <Input value={(dialogData.nameAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, nameAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type Key *</Label>
                    <Input value={(dialogData.type as string) || ""} onChange={(e) => setDialogData({ ...dialogData, type: e.target.value })} placeholder="e.g. apartment" disabled={dialogMode === "edit"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Icon Name</Label>
                    <Input value={(dialogData.icon as string) || ""} onChange={(e) => setDialogData({ ...dialogData, icon: e.target.value })} placeholder="e.g. Building2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Listing Count</Label>
                    <Input type="number" value={dialogData.listingCount ?? 0} onChange={(e) => setDialogData({ ...dialogData, listingCount: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" value={dialogData.sortOrder ?? 0} onChange={(e) => setDialogData({ ...dialogData, sortOrder: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={dialogData.featured as boolean || false} onCheckedChange={(v) => setDialogData({ ...dialogData, featured: v })} />
                  <Label className="text-xs">{isRTL ? "مميز" : "Featured"}</Label>
                </div>
              </>
            )}

            {/* Market Stat Fields */}
            {dialogType === "stat" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label (EN) *</Label>
                    <Input value={(dialogData.labelEn as string) || ""} onChange={(e) => setDialogData({ ...dialogData, labelEn: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label (AR)</Label>
                    <Input value={(dialogData.labelAr as string) || ""} onChange={(e) => setDialogData({ ...dialogData, labelAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value *</Label>
                    <Input value={(dialogData.value as string) || ""} onChange={(e) => setDialogData({ ...dialogData, value: e.target.value })} placeholder="e.g. $485,000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Change</Label>
                    <Input value={(dialogData.change as string) || ""} onChange={(e) => setDialogData({ ...dialogData, change: e.target.value })} placeholder="e.g. +5.2%" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Change Type</Label>
                    <Select value={(dialogData.changeType as string) || "up"} onValueChange={(v) => setDialogData({ ...dialogData, changeType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">{isRTL ? "صعود" : "Up"} ↑</SelectItem>
                        <SelectItem value="down">{isRTL ? "هبوط" : "Down"} ↓</SelectItem>
                        <SelectItem value="neutral">{isRTL ? "مستقر" : "Neutral"} →</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" value={dialogData.sortOrder ?? 0} onChange={(e) => setDialogData({ ...dialogData, sortOrder: Number(e.target.value) })} />
                  </div>
                </div>
                {dialogMode === "add" && (
                  <input type="hidden" value="stat" onChange={() => setDialogData({ ...dialogData, kind: "stat" })} />
                )}
              </>
            )}

            {/* Data Point Fields */}
            {dialogType === "dataPoint" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label *</Label>
                    <Input value={(dialogData.label as string) || ""} onChange={(e) => setDialogData({ ...dialogData, label: e.target.value })} placeholder="e.g. Jan, Q1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value (K$) *</Label>
                    <Input type="number" value={dialogData.value ?? ""} onChange={(e) => setDialogData({ ...dialogData, value: Number(e.target.value) })} placeholder="e.g. 485" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Period</Label>
                  <Select value={(dialogData.period as string) || "monthly"} onValueChange={(v) => setDialogData({ ...dialogData, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{isRTL ? "شهري" : "Monthly"}</SelectItem>
                      <SelectItem value="quarterly">{isRTL ? "ربع سنوي" : "Quarterly"}</SelectItem>
                      <SelectItem value="yearly">{isRTL ? "سنوي" : "Yearly"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleDialogSave} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {dialogMode === "add"
                ? isRTL ? "إضافة" : "Create"
                : isRTL ? "تحديث" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "تأكيد الحذف" : "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this item? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isRTL ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
