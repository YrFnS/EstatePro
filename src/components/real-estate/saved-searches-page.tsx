"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Save,
  Trash2,
  Play,
  BookmarkPlus,
  Filter,
  Calendar,
  Hash,
  X,
  Plus,
  Sparkles,
  Home,
  Building2,
  Key,
  Gem,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

const STORAGE_KEY = "estatepro-saved-searches";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const filterLabelMap: Record<string, string> = {
  status: "savedSearch.filterStatus",
  type: "savedSearch.filterType",
  bedrooms: "savedSearch.filterBedrooms",
  bathrooms: "savedSearch.filterBathrooms",
  minPrice: "savedSearch.filterMinPrice",
  maxPrice: "savedSearch.filterMaxPrice",
  minArea: "savedSearch.filterMinArea",
  maxArea: "savedSearch.filterMaxArea",
  search: "savedSearch.filterSearch",
  featured: "savedSearch.filterFeatured",
};

const statusValues: Record<string, string> = {
  sale: "common.forSale",
  rent: "common.forRent",
};

const typeValues: Record<string, string> = {
  apartment: "properties.apartment",
  villa: "properties.villa",
  house: "properties.house",
  condo: "properties.condo",
  townhouse: "properties.townhouse",
  penthouse: "properties.penthouse",
};

function getFilterBadgeValue(key: string, value: string, locale: string, t: (key: string) => string): string {
  if (key === "status" && statusValues[value]) {
    return t(statusValues[value]);
  }
  if (key === "type" && typeValues[value]) {
    return t(typeValues[value]);
  }
  if (key === "featured" && value === "true") {
    return t("savedSearch.featuredOnly");
  }
  if (key === "bedrooms") {
    return `${value}+ ${t("savedSearch.beds")}`;
  }
  if (key === "bathrooms") {
    return `${value}+ ${t("savedSearch.baths")}`;
  }
  if (key === "minPrice" || key === "maxPrice") {
    return `$${parseInt(value).toLocaleString()}`;
  }
  if (key === "minArea" || key === "maxArea") {
    return `${parseInt(value).toLocaleString()} ${t("savedSearch.sqft")}`;
  }
  return value;
}

export function SavedSearchesPage() {
  const { t, locale, dir } = useI18n();
  const { navigate, params } = useRouter();

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [resultsCounts, setResultsCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch {
      setSavedSearches([]);
    }
  }, []);

  // If there are filter params from the URL/router, pre-populate
  useEffect(() => {
    if (params && Object.keys(params).some((k) => k !== "id")) {
      // We have some filter context coming from the properties page
      const hasFilters = Object.keys(params).some(
        (k) => k !== "id" && params[k]
      );
      if (hasFilters) {
        setShowSaveForm(true);
      }
    }
  }, [params]);

  // Fetch results count for each saved search
  useEffect(() => {
    const fetchCounts = async () => {
      for (const search of savedSearches) {
        if (resultsCounts[search.id] !== undefined) continue;
        setLoadingCounts((prev) => ({ ...prev, [search.id]: true }));
        try {
          const queryParams = new URLSearchParams();
          Object.entries(search.filters).forEach(([key, value]) => {
            if (value && value !== "all" && value !== "") {
              queryParams.set(key, value);
            }
          });
          queryParams.set("limit", "1");
          const res = await fetch(`/api/properties?${queryParams.toString()}`);
          const data = await res.json();
          setResultsCounts((prev) => ({
            ...prev,
            [search.id]: data.total || 0,
          }));
        } catch {
          setResultsCounts((prev) => ({ ...prev, [search.id]: 0 }));
        } finally {
          setLoadingCounts((prev) => ({ ...prev, [search.id]: false }));
        }
      }
    };
    if (savedSearches.length > 0) {
      fetchCounts();
    }
  }, [savedSearches]);

  const saveToStorage = useCallback((searches: SavedSearch[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    setSavedSearches(searches);
  }, []);

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error(t("savedSearch.pleaseNameYourSearch"));
      return;
    }

    // Collect filters from params or create demo filters
    const filters: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && key !== "id") {
          filters[key] = value;
        }
      });
    }

    // If no filters from params, add the name as search filter
    if (Object.keys(filters).length === 0) {
      filters.search = searchName;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name: searchName.trim(),
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSearch, ...savedSearches];
    saveToStorage(updated);
    setSearchName("");
    setShowSaveForm(false);
    toast.success(t("savedSearch.searchSaved"));
  };

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    saveToStorage(updated);
    setResultsCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success(t("savedSearch.searchRemoved"));
  };

  const handleRunSearch = (search: SavedSearch) => {
    navigate("properties", search.filters);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFilterEntries = (filters: Record<string, string>) => {
    return Object.entries(filters).filter(
      ([key, value]) => value && value !== "all" && value !== "" && key !== "id"
    );
  };

  return (
    <div className="py-8 md:py-12" dir={dir}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3 px-4 py-1.5 text-xs uppercase tracking-widest">
                <BookmarkPlus className="w-3.5 h-3.5 me-1.5" />
                {t("savedSearch.title")}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {t("savedSearch.title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {t("savedSearch.subtitle")}
              </p>
            </div>
            <Button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="bg-primary  border-0 shadow-md  gap-2 shrink-0"
            >
              {showSaveForm ? (
                <>
                  <X className="w-4 h-4" />
                  {t("common.cancel")}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("savedSearch.saveSearch")}
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Save Search Form */}
        <AnimatePresence>
          {showSaveForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <Card className="border-primary/20 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Save className="w-5 h-5 text-primary" />
                    {t("savedSearch.saveSearch")}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder={t("savedSearch.nameYourSearch")}
                      className="flex-1 h-11"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveSearch();
                      }}
                    />
                    <Button
                      onClick={handleSaveSearch}
                      className="bg-primary  border-0 shadow-md  gap-2 h-11 px-6 shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      {t("common.save")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("savedSearch.saveSearchDesc")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Search Cards */}
        {savedSearches.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {savedSearches.map((search) => {
                const filterEntries = getFilterEntries(search.filters);
                return (
                  <motion.div
                    key={search.id}
                    variants={fadeUp}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:border-primary/20 h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                            <Search className="w-4 h-4 text-primary shrink-0" />
                            {search.name}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteSearch(search.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        {/* Filter Summary Badges */}
                        {filterEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {filterEntries.slice(0, 5).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-[11px] px-2 py-0.5 bg-primary/5 border-primary/20"
                              >
                                {getFilterBadgeValue(key, value, locale, t)}
                              </Badge>
                            ))}
                            {filterEntries.length > 5 && (
                              <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                                +{filterEntries.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Meta info */}
                        <div className="mt-auto space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(search.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              <Hash className="w-3.5 h-3.5" />
                              {loadingCounts[search.id] ? (
                                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                              ) : (
                                <>
                                  {resultsCounts[search.id] ?? 0}{" "}
                                  {t("savedSearch.resultsCount")}
                                </>
                              )}
                            </span>
                          </div>

                          <Separator />

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-primary  border-0 shadow-sm  gap-1.5 h-9"
                              onClick={() => handleRunSearch(search)}
                            >
                              <Play className="w-3.5 h-3.5" />
                              {t("savedSearch.runSearch")}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 shrink-0 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
                              onClick={() => handleDeleteSearch(search.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-20 text-center">
                <div className="max-w-sm mx-auto">
                  {/* Illustration */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookmarkPlus className="w-14 h-14 text-primary/60" />
                    </div>
                    {/* Floating search icons */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute -top-1 -end-1 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                      <Search className="w-4 h-4 text-primary" />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-1 -start-1 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                      <Filter className="w-4 h-4 text-primary" />
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">
                    {t("savedSearch.noSavedSearches")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("savedSearch.noSavedSearchesDesc")}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      onClick={() => navigate("properties")}
                      className="bg-primary  border-0 shadow-md  gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {t("savedSearch.browseProperties")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveForm(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("savedSearch.saveSearch")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Demo - Save some example searches */}
        {savedSearches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-center text-muted-foreground">
              {t("savedSearch.exampleSavedSearches")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: t("savedSearch.villasForSale"),
                  icon: Building2,
                  filters: { type: "villa", status: "sale" },
                  color: "text-primary",
                  bgColor: "bg-primary/10",
                },
                {
                  name: t("savedSearch.apartmentsForRent"),
                  icon: Home,
                  filters: { type: "apartment", status: "rent" },
                  color: "text-primary",
                  bgColor: "bg-primary/10",
                },
                {
                  name: t("savedSearch.luxuryProperties"),
                  icon: Gem,
                  filters: { type: "penthouse", minPrice: "1000000" },
                  color: "text-violet-500",
                  bgColor: "bg-violet-500/10",
                },
                {
                  name: t("savedSearch.threePlusBedrooms"),
                  icon: Key,
                  filters: { bedrooms: "3" },
                  color: "text-amber-500",
                  bgColor: "bg-amber-500/10",
                },
              ].map((example) => (
                <Card
                  key={example.name}
                  className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                  onClick={() => {
                    const newSearch: SavedSearch = {
                      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
                      name: example.name,
                      filters: example.filters,
                      createdAt: new Date().toISOString(),
                    };
                    const updated = [newSearch, ...savedSearches];
                    saveToStorage(updated);
                    toast.success(t("savedSearch.searchSaved"));
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${example.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <example.icon className={`w-5 h-5 ${example.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-1">{example.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("savedSearch.clickToSave")}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200 shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
