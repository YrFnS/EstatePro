"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  BellOff,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AuthDialog } from "@/components/real-estate/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import {
  type AccountPropertyAlert,
  type PropertyAlertFilters,
  type PropertyAlertFrequency,
  normalizeLegacyPropertyAlert,
} from "@/lib/property-alerts";
import { useRouter } from "@/lib/router";

const LEGACY_ALERTS_KEY = "estatepro-property-alerts";
const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "house",
  "condo",
  "townhouse",
  "penthouse",
];

interface AlertDraft {
  name: string;
  search: string;
  type: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
  frequency: PropertyAlertFrequency;
  enabled: boolean;
}

const emptyDraft: AlertDraft = {
  name: "",
  search: "",
  type: "any",
  status: "any",
  minPrice: "",
  maxPrice: "",
  bedrooms: "any",
  bathrooms: "any",
  minArea: "",
  maxArea: "",
  frequency: "daily",
  enabled: true,
};

function draftToFilters(
  draft: AlertDraft
): PropertyAlertFilters {
  const filters: PropertyAlertFilters = {};

  if (draft.search.trim()) filters.search = draft.search.trim();
  if (draft.type !== "any") filters.type = draft.type;
  if (draft.status !== "any") filters.status = draft.status;
  if (draft.minPrice) filters.minPrice = draft.minPrice;
  if (draft.maxPrice) filters.maxPrice = draft.maxPrice;
  if (draft.bedrooms !== "any") {
    filters.bedrooms = draft.bedrooms;
  }
  if (draft.bathrooms !== "any") {
    filters.bathrooms = draft.bathrooms;
  }
  if (draft.minArea) filters.minArea = draft.minArea;
  if (draft.maxArea) filters.maxArea = draft.maxArea;

  return filters;
}

function alertToDraft(alert: AccountPropertyAlert): AlertDraft {
  return {
    name: alert.name,
    search: alert.filters.search || "",
    type: alert.filters.type || "any",
    status: alert.filters.status || "any",
    minPrice: alert.filters.minPrice || "",
    maxPrice: alert.filters.maxPrice || "",
    bedrooms: alert.filters.bedrooms || "any",
    bathrooms: alert.filters.bathrooms || "any",
    minArea: alert.filters.minArea || "",
    maxArea: alert.filters.maxArea || "",
    frequency: alert.frequency,
    enabled: alert.enabled,
  };
}

function formatDate(
  value: string | null,
  locale: string
): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(
    locale === "ar" ? "ar-IQ" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function filterLabels(
  alert: AccountPropertyAlert,
  t: (key: string) => string
): string[] {
  const labels: string[] = [];
  const filters = alert.filters;

  if (filters.search) labels.push(`“${filters.search}”`);
  if (filters.type) {
    const key = `properties.${filters.type}`;
    const translated = t(key);
    labels.push(
      translated === key ? filters.type : translated
    );
  }
  if (filters.status) {
    labels.push(
      filters.status === "sale"
        ? t("common.forSale")
        : t("common.forRent")
    );
  }
  if (filters.bedrooms) {
    labels.push(
      `${filters.bedrooms}+ ${t("properties.bedrooms")}`
    );
  }
  if (filters.bathrooms) {
    labels.push(
      `${filters.bathrooms}+ ${t("properties.bathrooms")}`
    );
  }
  if (filters.minPrice) {
    labels.push(`≥ $${Number(filters.minPrice).toLocaleString()}`);
  }
  if (filters.maxPrice) {
    labels.push(`≤ $${Number(filters.maxPrice).toLocaleString()}`);
  }
  if (filters.minArea) {
    labels.push(
      `≥ ${Number(filters.minArea).toLocaleString()} ${t(
        "common.sqft"
      )}`
    );
  }
  if (filters.maxArea) {
    labels.push(
      `≤ ${Number(filters.maxArea).toLocaleString()} ${t(
        "common.sqft"
      )}`
    );
  }

  return labels;
}

export function PropertyAlertsPage() {
  const { t, locale, dir } = useI18n();
  const { navigate } = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [alerts, setAlerts] = useState<AccountPropertyAlert[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(
    null
  );
  const [draft, setDraft] = useState<AlertDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [runningIds, setRunningIds] = useState<Set<string>>(
    new Set()
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(
    new Set()
  );

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/account/property-alerts",
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );
      const payload = (await response.json()) as {
        alerts?: AccountPropertyAlert[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to load property alerts"
        );
      }
      setAlerts(payload.alerts || []);
    } catch (caught) {
      console.error(caught);
      setError(
        locale === "ar"
          ? "تعذر تحميل تنبيهات العقارات."
          : "We could not load your property alerts."
      );
    } finally {
      setLoading(false);
    }
  }, [locale, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem(LEGACY_ALERTS_KEY)
            : null;
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        const legacy = Array.isArray(parsed)
          ? parsed
              .map(normalizeLegacyPropertyAlert)
              .filter(
                (
                  item
                ): item is NonNullable<
                  ReturnType<typeof normalizeLegacyPropertyAlert>
                > => item !== null
              )
          : [];

        if (legacy.length) {
          const response = await fetch(
            "/api/account/property-alerts",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ alerts: legacy }),
            }
          );

          if (response.ok && typeof window !== "undefined") {
            window.localStorage.removeItem(LEGACY_ALERTS_KEY);
            toast.success(
              locale === "ar"
                ? "تمت مزامنة تنبيهاتك القديمة"
                : "Your existing alerts were synchronized"
            );
          }
        }
      } catch (caught) {
        console.error(
          "Failed to migrate legacy property alerts:",
          caught
        );
      }

      if (!cancelled) await fetchAlerts();
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchAlerts, locale, user?.id]);

  const recentMatches = useMemo(
    () =>
      alerts
        .flatMap((alert) =>
          alert.recentMatches.map((match) => ({
            ...match,
            alertName: alert.name,
          }))
        )
        .sort(
          (left, right) =>
            new Date(right.matchedAt).getTime() -
            new Date(left.matchedAt).getTime()
        )
        .slice(0, 8),
    [alerts]
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const openEdit = (alert: AccountPropertyAlert) => {
    setEditingId(alert.id);
    setDraft(alertToDraft(alert));
    setDialogOpen(true);
  };

  const saveAlert = async () => {
    const name = draft.name.trim();
    const filters = draftToFilters(draft);

    if (!name) {
      toast.error(
        locale === "ar"
          ? "أدخل اسماً للتنبيه"
          : "Enter a name for this alert"
      );
      return;
    }
    if (!Object.keys(filters).length) {
      toast.error(
        locale === "ar"
          ? "اختر معياراً واحداً على الأقل"
          : "Choose at least one alert criterion"
      );
      return;
    }

    setSaving(true);

    try {
      const endpoint = editingId
        ? `/api/account/property-alerts/${encodeURIComponent(
            editingId
          )}`
        : "/api/account/property-alerts";
      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? {
                name,
                filters,
                frequency: draft.frequency,
                enabled: draft.enabled,
              }
            : {
                alert: {
                  name,
                  filters,
                  frequency: draft.frequency,
                  enabled: draft.enabled,
                },
              }
        ),
      });
      const payload = (await response.json()) as {
        alert?: AccountPropertyAlert;
        alerts?: AccountPropertyAlert[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to save property alert"
        );
      }

      const updatedAlert = payload.alert;
      if (updatedAlert) {
        setAlerts((current) =>
          current.map((item) =>
            item.id === updatedAlert.id ? updatedAlert : item
          )
        );
      } else if (payload.alerts) {
        setAlerts(payload.alerts);
      } else {
        await fetchAlerts();
      }

      setDialogOpen(false);
      toast.success(
        locale === "ar"
          ? editingId
            ? "تم تحديث التنبيه"
            : "تم إنشاء التنبيه"
          : editingId
            ? "Alert updated"
            : "Alert created"
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Failed to save property alert"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (
    alert: AccountPropertyAlert,
    enabled: boolean
  ) => {
    const previous = alerts;
    setAlerts((current) =>
      current.map((item) =>
        item.id === alert.id ? { ...item, enabled } : item
      )
    );

    try {
      const response = await fetch(
        `/api/account/property-alerts/${encodeURIComponent(
          alert.id
        )}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );
      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };
        throw new Error(
          payload.error || "Failed to update alert"
        );
      }
      await fetchAlerts();
    } catch (caught) {
      setAlerts(previous);
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Failed to update alert"
      );
    }
  };

  const deleteAlert = async (alert: AccountPropertyAlert) => {
    setDeletingIds((current) => new Set(current).add(alert.id));

    try {
      const response = await fetch(
        `/api/account/property-alerts/${encodeURIComponent(
          alert.id
        )}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };
        throw new Error(
          payload.error || "Failed to delete alert"
        );
      }
      setAlerts((current) =>
        current.filter((item) => item.id !== alert.id)
      );
      toast.success(
        locale === "ar" ? "تم حذف التنبيه" : "Alert deleted"
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Failed to delete alert"
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(alert.id);
        return next;
      });
    }
  };

  const runAlert = async (alert: AccountPropertyAlert) => {
    setRunningIds((current) => new Set(current).add(alert.id));

    try {
      const response = await fetch(
        `/api/account/property-alerts/${encodeURIComponent(
          alert.id
        )}/run`,
        { method: "POST" }
      );
      const payload = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to refresh alert"
        );
      }
      await fetchAlerts();
      toast.success(
        locale === "ar"
          ? "تم فحص العقارات المطابقة"
          : "Matching properties checked"
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Failed to refresh alert"
      );
    } finally {
      setRunningIds((current) => {
        const next = new Set(current);
        next.delete(alert.id);
        return next;
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 h-10 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="container mx-auto max-w-3xl px-4 py-16"
        dir={dir}
      >
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center p-10 text-center md:p-16">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <BellRing className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              {t("alerts.title")}
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {locale === "ar"
                ? "سجّل الدخول لحفظ تنبيهاتك في حسابك والحصول على إشعارات تلقائية عند إضافة عقارات مطابقة."
                : "Sign in to save alerts to your account and receive automatic notifications when matching properties are added."}
            </p>
            <Button
              className="mt-7"
              onClick={() => setAuthDialogOpen(true)}
            >
              {t("auth.signIn")}
            </Button>
          </CardContent>
        </Card>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultTab="login"
        />
      </div>
    );
  }

  return (
    <div
      className="container mx-auto max-w-6xl px-4 py-10 md:py-14"
      dir={dir}
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge
            variant="secondary"
            className="mb-3 rounded-full"
          >
            <CheckCircle2 className="me-1 h-3.5 w-3.5" />
            {locale === "ar"
              ? "متزامنة مع الحساب"
              : "Account synchronized"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("alerts.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {t("alerts.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("alerts.createAlert")}
        </Button>
      </div>

      {error ? (
        <Card className="mb-6 rounded-2xl border-destructive/30">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p>{error}</p>
            </div>
            <Button variant="outline" onClick={fetchAlerts}>
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {alerts.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <BellOff className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold">
              {t("alerts.noAlerts")}
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              {t("alerts.noAlertsDesc")}
            </p>
            <Button className="mt-6" onClick={openCreate}>
              {t("alerts.createAlert")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {alerts.map((alert) => {
            const labels = filterLabels(alert, t);
            const running = runningIds.has(alert.id);
            const deleting = deletingIds.has(alert.id);
            const FrequencyIcon =
              alert.frequency === "instant"
                ? Zap
                : alert.frequency === "weekly"
                  ? CalendarDays
                  : Clock;

            return (
              <Card
                key={alert.id}
                className="rounded-2xl border-border/70"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {alert.name}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge
                          variant={
                            alert.enabled
                              ? "default"
                              : "secondary"
                          }
                          className="rounded-full"
                        >
                          {alert.enabled
                            ? t("alerts.enabled")
                            : t("alerts.disabled")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-full"
                        >
                          <FrequencyIcon className="h-3 w-3" />
                          {t(`alerts.${alert.frequency}`)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full"
                        >
                          {alert.currentMatchCount}{" "}
                          {t("alerts.matchCount")}
                        </Badge>
                        {alert.savedSearchId ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full"
                          >
                            {locale === "ar"
                              ? "بحث محفوظ"
                              : "Saved search"}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={(checked) =>
                        void toggleAlert(alert, checked)
                      }
                      aria-label={
                        alert.enabled
                          ? t("alerts.disabled")
                          : t("alerts.enabled")
                      }
                    />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex min-h-8 flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="rounded-full font-normal"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar"
                          ? "آخر فحص"
                          : "Last checked"}
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(alert.lastRunAt, locale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar"
                          ? "الفحص القادم"
                          : "Next check"}
                      </p>
                      <p className="mt-1 font-medium">
                        {alert.enabled
                          ? formatDate(alert.nextRunAt, locale)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {alert.lastError ? (
                    <div className="mt-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="line-clamp-2">
                        {alert.lastError}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() =>
                        navigate("properties", alert.filters)
                      }
                    >
                      <Eye className="h-4 w-4" />
                      {t("alerts.viewMatches")}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => void runAlert(alert)}
                      disabled={!alert.enabled || running}
                      aria-label={t("alerts.refreshMatchCount")}
                    >
                      {running ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(alert)}
                      aria-label={t("alerts.editAlert")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => void deleteAlert(alert)}
                      disabled={deleting}
                      className="text-destructive hover:text-destructive"
                      aria-label={t("alerts.deleteAlert")}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {recentMatches.length ? (
        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              {t("alerts.alertHistory")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "ar"
                ? "أحدث العقارات التي تم اكتشافها بواسطة تنبيهاتك."
                : "The latest properties discovered by your alerts."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recentMatches.map((match) => {
              const title =
                locale === "ar"
                  ? match.property.titleAr
                  : match.property.titleEn;
              const location =
                locale === "ar"
                  ? match.property.locationAr
                  : match.property.locationEn;
              const image =
                match.property.images.split(",")[0]?.trim();

              return (
                <Card
                  key={match.id}
                  className="cursor-pointer overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
                  onClick={() =>
                    navigate("property-detail", {
                      id: match.property.id,
                    })
                  }
                >
                  <CardContent className="flex gap-4 p-4">
                    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="secondary"
                        className="mb-2 max-w-full truncate"
                      >
                        {match.alertName}
                      </Badge>
                      <h3 className="truncate font-semibold">
                        {title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {location}
                      </p>
                      <p className="mt-2 font-bold text-primary">
                        {t("common.currency")}
                        {match.property.price.toLocaleString()}
                        {match.property.status === "rent"
                          ? t("common.perMonth")
                          : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("alerts.editAlert")
                : t("alerts.createAlert")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="alert-name">
                {t("alerts.alertName")}
              </Label>
              <Input
                id="alert-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder={t("alerts.alertNamePlaceholder")}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-search">
                {locale === "ar"
                  ? "الموقع أو كلمة البحث"
                  : "Location or search phrase"}
              </Label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="alert-search"
                  className="ps-9"
                  value={draft.search}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "properties.searchPlaceholder"
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("properties.propertyType")}</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {t("properties.any")}
                    </SelectItem>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`properties.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {t("common.sale")}/{t("common.rent")}
                </Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {t("properties.any")}
                    </SelectItem>
                    <SelectItem value="sale">
                      {t("common.forSale")}
                    </SelectItem>
                    <SelectItem value="rent">
                      {t("common.forRent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("properties.minPrice")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.minPrice}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      minPrice: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("properties.maxPrice")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.maxPrice}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxPrice: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("properties.bedrooms")}</Label>
                <Select
                  value={draft.bedrooms}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      bedrooms: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {t("properties.any")}
                    </SelectItem>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <SelectItem
                        key={value}
                        value={String(value)}
                      >
                        {value}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("properties.bathrooms")}</Label>
                <Select
                  value={draft.bathrooms}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      bathrooms: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">
                      {t("properties.any")}
                    </SelectItem>
                    {[1, 2, 3, 4].map((value) => (
                      <SelectItem
                        key={value}
                        value={String(value)}
                      >
                        {value}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("properties.minArea")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.minArea}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      minArea: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("properties.maxArea")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.maxArea}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxArea: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("alerts.frequency")}</Label>
              <Select
                value={draft.frequency}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    frequency:
                      value as PropertyAlertFrequency,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">
                    <span className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5" />
                      {t("alerts.instant")}
                    </span>
                  </SelectItem>
                  <SelectItem value="daily">
                    {t("alerts.daily")}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {t("alerts.weekly")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "التنبيهات الفورية تُفحص كل 15 دقيقة. اليومية والأسبوعية تُفحص حسب الجدول."
                  : "Instant alerts are checked every 15 minutes; daily and weekly alerts follow their selected schedule."}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">
                  {t("alerts.enabled")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "أوقف التنبيه مؤقتاً بدون حذفه."
                    : "Pause this alert without deleting it."}
                </p>
              </div>
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    enabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void saveAlert()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : editingId ? (
                t("alerts.updateAlert")
              ) : (
                t("alerts.createAlert")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
