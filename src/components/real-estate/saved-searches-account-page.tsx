"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  BookmarkPlus,
  Cloud,
  CloudOff,
  Pencil,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useSavedSearches } from "@/lib/saved-searches";
import type {
  AccountSavedSearch,
  SavedSearchFilters,
} from "@/lib/account-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface SearchDraft {
  name: string;
  query: string;
  type: string;
  status: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
  notificationsEnabled: boolean;
}

const emptyDraft: SearchDraft = {
  name: "",
  query: "",
  type: "any",
  status: "any",
  bedrooms: "",
  minPrice: "",
  maxPrice: "",
  notificationsEnabled: false,
};

const propertyTypes = [
  "apartment",
  "villa",
  "house",
  "condo",
  "townhouse",
  "penthouse",
] as const;

function toFilters(draft: SearchDraft): SavedSearchFilters {
  const filters: SavedSearchFilters = {};
  if (draft.query.trim()) filters.search = draft.query.trim();
  if (draft.type !== "any") filters.type = draft.type;
  if (draft.status !== "any") filters.status = draft.status;
  if (draft.bedrooms) filters.bedrooms = draft.bedrooms;
  if (draft.minPrice) filters.minPrice = draft.minPrice;
  if (draft.maxPrice) filters.maxPrice = draft.maxPrice;
  return filters;
}

function fromSearch(item: AccountSavedSearch): SearchDraft {
  return {
    name: item.name,
    query: item.filters.search || "",
    type: item.filters.type || "any",
    status: item.filters.status || "any",
    bedrooms: item.filters.bedrooms || "",
    minPrice: item.filters.minPrice || "",
    maxPrice: item.filters.maxPrice || "",
    notificationsEnabled: item.notificationsEnabled,
  };
}

export function SavedSearchesAccountPage() {
  const { locale, t } = useI18n();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const {
    savedSearches,
    isLoading,
    isSynced,
    createSavedSearch,
    updateSavedSearch,
    removeSavedSearch,
  } = useSavedSearches();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SearchDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const visibleSearches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return savedSearches;
    return savedSearches.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }, [query, savedSearches]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const openEdit = (item: AccountSavedSearch) => {
    setEditingId(item.id);
    setDraft(fromSearch(item));
    setDialogOpen(true);
  };

  const save = async () => {
    const name = draft.name.trim();
    const filters = toFilters(draft);
    if (!name) {
      toast.error(
        locale === "ar" ? "أدخل اسماً للبحث" : "Enter a search name"
      );
      return;
    }
    if (!Object.keys(filters).length) {
      toast.error(
        locale === "ar"
          ? "اختر معيار بحث واحداً على الأقل"
          : "Choose at least one search criterion"
      );
      return;
    }

    setSaving(true);
    const result = editingId
      ? await updateSavedSearch(editingId, {
          name,
          filters,
          notificationsEnabled: draft.notificationsEnabled,
        })
      : await createSavedSearch({
          name,
          filters,
          notificationsEnabled: draft.notificationsEnabled,
        });
    setSaving(false);

    if (!result) {
      toast.error(
        locale === "ar"
          ? "تعذر حفظ البحث"
          : "The search could not be saved"
      );
      return;
    }

    setDialogOpen(false);
    toast.success(t("savedSearch.searchSaved"));
  };

  const remove = async (id: string) => {
    if (await removeSavedSearch(id)) {
      toast.success(t("savedSearch.searchRemoved"));
    } else {
      toast.error(
        locale === "ar"
          ? "تعذر حذف البحث"
          : "The saved search could not be deleted"
      );
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {savedSearches.length} {t("savedSearch.title")}
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full">
              {isSynced ? (
                <Cloud className="h-3.5 w-3.5" />
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              {isSynced
                ? locale === "ar"
                  ? "متزامن مع حسابك"
                  : "Synced to your account"
                : locale === "ar"
                  ? "محفوظ على هذا الجهاز"
                  : "Saved on this device"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("savedSearch.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {user
              ? t("savedSearch.subtitle")
              : locale === "ar"
                ? "سجّل الدخول لمزامنة عمليات البحث بين أجهزتك. ستُنقل عمليات البحث الحالية تلقائياً."
                : "Sign in to synchronize searches across devices. Your current searches will migrate automatically."}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <BookmarkPlus className="h-4 w-4" />
          {t("savedSearch.saveSearch")}
        </Button>
      </div>

      <Card className="mb-6 rounded-2xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ps-9"
              placeholder={
                locale === "ar"
                  ? "البحث في عمليات البحث المحفوظة"
                  : "Search saved searches"
              }
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : visibleSearches.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleSearches.map((item) => (
            <Card key={item.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold">{item.name}</h2>
                      {item.notificationsEnabled ? (
                        <BellRing className="h-4 w-4 shrink-0 text-primary" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleDateString(
                        locale === "ar" ? "ar-IQ" : "en-US"
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Object.keys(item.filters).length}
                  </Badge>
                </div>

                <div className="mt-4 flex min-h-8 flex-wrap gap-2">
                  {Object.entries(item.filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="rounded-full">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => navigate("properties", item.filters)}
                  >
                    <Play className="h-4 w-4" />
                    {t("savedSearch.runSearch")}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(item)}
                    aria-label={t("savedSearch.editSearch")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void remove(item.id)}
                    aria-label={t("savedSearch.deleteSearch")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <BookmarkPlus className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold">
              {t("savedSearch.noSavedSearches")}
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              {t("savedSearch.noSavedSearchesDesc")}
            </p>
            <Button className="mt-6" onClick={openCreate}>
              {t("savedSearch.saveSearch")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t("savedSearch.editSearch")
                : t("savedSearch.saveSearch")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="saved-search-name">
                {t("savedSearch.nameYourSearch")}
              </Label>
              <Input
                id="saved-search-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saved-search-query">{t("common.search")}</Label>
              <Input
                id="saved-search-query"
                value={draft.query}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    query: event.target.value,
                  }))
                }
                placeholder={t("properties.searchPlaceholder")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("properties.propertyType")}</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, type: value }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t("properties.any")}</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`properties.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("savedSearch.filterStatus")}</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, status: value }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t("properties.any")}</SelectItem>
                    <SelectItem value="sale">{t("common.forSale")}</SelectItem>
                    <SelectItem value="rent">{t("common.forRent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="saved-search-bedrooms">
                  {t("properties.bedrooms")}
                </Label>
                <Input
                  id="saved-search-bedrooms"
                  type="number"
                  min={0}
                  value={draft.bedrooms}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      bedrooms: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saved-search-min-price">
                  {t("properties.minPrice")}
                </Label>
                <Input
                  id="saved-search-min-price"
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
                <Label htmlFor="saved-search-max-price">
                  {t("properties.maxPrice")}
                </Label>
                <Input
                  id="saved-search-max-price"
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

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label htmlFor="saved-search-alerts" className="flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  {t("savedSearch.notificationsEnabled")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {locale === "ar"
                    ? "احتفظ بتفضيل التنبيه مع هذا البحث."
                    : "Keep the alert preference with this search."}
                </p>
              </div>
              <Switch
                id="saved-search-alerts"
                checked={draft.notificationsEnabled}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    notificationsEnabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
