"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  Building2,
  Gem,
  Home,
  Key,
  Pencil,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
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

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

interface SearchTemplate {
  nameKey: string;
  icon: typeof Home;
  filters: Record<string, string>;
}

interface SearchDraft {
  name: string;
  search: string;
  type: string;
  status: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
}

const LEGACY_STORAGE_KEY = "estatepro-saved-searches";

const templates: SearchTemplate[] = [
  {
    nameKey: "savedSearch.villasForSale",
    icon: Building2,
    filters: { type: "villa", status: "sale" },
  },
  {
    nameKey: "savedSearch.apartmentsForRent",
    icon: Home,
    filters: { type: "apartment", status: "rent" },
  },
  {
    nameKey: "savedSearch.luxuryProperties",
    icon: Gem,
    filters: { type: "penthouse", minPrice: "1000000" },
  },
  {
    nameKey: "savedSearch.threePlusBedrooms",
    icon: Key,
    filters: { bedrooms: "3" },
  },
];

const emptyDraft: SearchDraft = {
  name: "",
  search: "",
  type: "",
  status: "",
  bedrooms: "",
  minPrice: "",
  maxPrice: "",
};

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readSavedSearches(storageKey: string): SavedSearch[] {
  if (typeof window === "undefined") return [];

  try {
    const scoped = localStorage.getItem(storageKey);
    if (scoped) {
      const parsed = JSON.parse(scoped) as unknown;
      return Array.isArray(parsed) ? (parsed as SavedSearch[]) : [];
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as unknown;
      const searches = Array.isArray(parsed) ? (parsed as SavedSearch[]) : [];
      localStorage.setItem(storageKey, JSON.stringify(searches));
      return searches;
    }
  } catch {
    return [];
  }

  return [];
}

function filterLabel(
  key: string,
  value: string,
  t: (translationKey: string) => string
): string {
  if (key === "status") {
    return value === "sale" ? t("common.forSale") : t("common.forRent");
  }
  if (key === "type") {
    const translationKey = `properties.${value}`;
    const translated = t(translationKey);
    return translated === translationKey
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : translated;
  }
  if (key === "bedrooms") return `${value}+ ${t("properties.bedrooms")}`;
  if (key === "minPrice") return `≥ $${Number(value).toLocaleString()}`;
  if (key === "maxPrice") return `≤ $${Number(value).toLocaleString()}`;
  if (key === "search") return `“${value}”`;
  return `${key}: ${value}`;
}

export function SavedSearchesPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { user } = useAuth();
  const storageKey = `estatepro-saved-searches:${user?.id || "guest"}`;
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SearchDraft>(emptyDraft);

  useEffect(() => {
    setSavedSearches(readSavedSearches(storageKey));
  }, [storageKey]);

  const persist = (next: SavedSearch[]) => {
    setSavedSearches(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return savedSearches;
    return savedSearches.filter((item) =>
      item.name.toLowerCase().includes(normalized)
    );
  }, [query, savedSearches]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  };

  const openEdit = (item: SavedSearch) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      search: item.filters.search || "",
      type: item.filters.type || "",
      status: item.filters.status || "",
      bedrooms: item.filters.bedrooms || "",
      minPrice: item.filters.minPrice || "",
      maxPrice: item.filters.maxPrice || "",
    });
    setDialogOpen(true);
  };

  const saveDraft = () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error(locale === "ar" ? "أدخل اسماً للبحث" : "Enter a name for this search");
      return;
    }

    const filters: Record<string, string> = {};
    if (draft.search.trim()) filters.search = draft.search.trim();
    if (draft.type) filters.type = draft.type;
    if (draft.status) filters.status = draft.status;
    if (draft.bedrooms) filters.bedrooms = draft.bedrooms;
    if (draft.minPrice) filters.minPrice = draft.minPrice;
    if (draft.maxPrice) filters.maxPrice = draft.maxPrice;

    if (Object.keys(filters).length === 0) {
      toast.error(
        locale === "ar"
          ? "اختر معيار بحث واحداً على الأقل"
          : "Choose at least one search criterion"
      );
      return;
    }

    const next = editingId
      ? savedSearches.map((item) =>
          item.id === editingId ? { ...item, name, filters } : item
        )
      : [
          {
            id: makeId(),
            name,
            filters,
            createdAt: new Date().toISOString(),
          },
          ...savedSearches,
        ];

    persist(next);
    setDialogOpen(false);
    toast.success(t("savedSearch.searchSaved"));
  };

  const saveTemplate = (template: SearchTemplate) => {
    const name = t(template.nameKey);
    persist([
      {
        id: makeId(),
        name,
        filters: { ...template.filters },
        createdAt: new Date().toISOString(),
      },
      ...savedSearches,
    ]);
    toast.success(t("savedSearch.searchSaved"));
  };

  const remove = (id: string) => {
    persist(savedSearches.filter((item) => item.id !== id));
    toast.success(
      locale === "ar" ? "تم حذف البحث المحفوظ" : "Saved search deleted"
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full">
            {savedSearches.length} {t("savedSearch.title")}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("savedSearch.title")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("savedSearch.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <BookmarkPlus className="h-4 w-4" />
          {t("savedSearch.saveSearch")}
        </Button>
      </div>

      <Card className="mb-8 rounded-2xl border-border/70">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ps-9"
              placeholder={
                locale === "ar" ? "بحث في عمليات البحث المحفوظة" : "Search saved searches"
              }
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} className="rounded-2xl border-border/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{item.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-IQ" : "en-US"
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {Object.keys(item.filters).length}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(item.filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="rounded-full">
                      {filterLabel(key, value, t)}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => navigate("properties", item.filters)}
                  >
                    <Play className="h-4 w-4" />
                    {locale === "ar" ? "عرض النتائج" : "View results"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(item)}
                    aria-label={locale === "ar" ? "تعديل" : "Edit"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => remove(item.id)}
                    className="text-destructive hover:text-destructive"
                    aria-label={locale === "ar" ? "حذف" : "Delete"}
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
          <CardContent className="flex flex-col items-center p-12 text-center">
            <BookmarkPlus className="mb-4 h-12 w-12 text-muted-foreground/35" />
            <h2 className="text-xl font-semibold">{t("savedSearch.noSavedSearches")}</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              {t("savedSearch.noSavedSearchesDesc")}
            </p>
            <Button className="mt-6" onClick={openCreate}>
              {t("savedSearch.saveSearch")}
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold">
          {locale === "ar" ? "اقتراحات سريعة" : "Quick suggestions"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "ar"
            ? "احفظ أحد هذه القوالب وخصصه لاحقاً."
            : "Save one of these templates and customize it later."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <button
              type="button"
              key={template.nameKey}
              onClick={() => saveTemplate(template)}
              className="rounded-2xl border bg-card p-5 text-start transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <template.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold">{t(template.nameKey)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("savedSearch.clickToSave")}
              </p>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? locale === "ar"
                  ? "تعديل البحث المحفوظ"
                  : "Edit saved search"
                : t("savedSearch.saveSearch")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="saved-search-name">
                {locale === "ar" ? "اسم البحث" : "Search name"}
              </Label>
              <Input
                id="saved-search-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{locale === "ar" ? "كلمات البحث" : "Keywords"}</Label>
              <Input
                value={draft.search}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, search: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("properties.propertyType")}</Label>
              <Select
                value={draft.type || "any"}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    type: value === "any" ? "" : value,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("properties.any")}</SelectItem>
                  {[
                    "apartment",
                    "villa",
                    "house",
                    "condo",
                    "townhouse",
                    "penthouse",
                  ].map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`properties.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.sale")}/{t("common.rent")}</Label>
              <Select
                value={draft.status || "any"}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    status: value === "any" ? "" : value,
                  }))
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
            <div className="space-y-2">
              <Label>{t("properties.bedrooms")}</Label>
              <Input
                type="number"
                min="0"
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
              <Label>{locale === "ar" ? "الحد الأدنى للسعر" : "Minimum price"}</Label>
              <Input
                type="number"
                min="0"
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
              <Label>{locale === "ar" ? "الحد الأعلى للسعر" : "Maximum price"}</Label>
              <Input
                type="number"
                min="0"
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveDraft}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
