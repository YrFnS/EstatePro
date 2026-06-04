"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Save, Trash2, Route, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CommuteCalculator } from "@/components/real-estate/commute-calculator";
import { toast } from "sonner";

interface PropertyOption {
  id: string;
  titleEn: string;
  titleAr: string;
  addressEn: string;
  addressAr: string;
  lat: number | null;
  lng: number | null;
}

interface SavedProfile {
  id: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  transportMode: string;
}

const PRESETS = [
  { key: "downtown", lat: 40.758, lng: -73.9855 },
  { key: "airport", lat: 40.6413, lng: -73.7781 },
  { key: "university", lat: 40.7295, lng: -73.9965 },
  { key: "shoppingMall", lat: 40.7484, lng: -73.9857 },
  { key: "hospital", lat: 40.7831, lng: -73.9712 },
  { key: "centralStation", lat: 40.7527, lng: -73.9772 },
];

export function CommutePage() {
  const { t, locale, dir } = useI18n();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customName, setCustomName] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const originLat = selectedProperty?.lat ?? (customLat ? parseFloat(customLat) : undefined);
  const originLng = selectedProperty?.lng ?? (customLng ? parseFloat(customLng) : undefined);
  const originName = selectedProperty
    ? locale === "ar"
      ? selectedProperty.titleAr
      : selectedProperty.titleEn
    : customName || undefined;

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties?limit=20");
        const data = await res.json();
        const props: PropertyOption[] = (data.properties || [])
          .filter((p: PropertyOption) => p.lat && p.lng)
          .map((p: PropertyOption) => ({
            id: p.id,
            titleEn: p.titleEn,
            titleAr: p.titleAr,
            addressEn: p.addressEn,
            addressAr: p.addressAr,
            lat: p.lat,
            lng: p.lng,
          }));
        setProperties(props);
      } catch {
        // fallback: empty
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  // Fetch saved profiles (from localStorage for guest users)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("estatepro-commute-profiles");
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveProfileToStorage = useCallback(
    (dest: { name: string; lat: number; lng: number }, mode: string) => {
      setSaving(true);
      try {
        const newProfile: SavedProfile = {
          id: `local-${Date.now()}`,
          destinationName: dest.name,
          destinationLat: dest.lat,
          destinationLng: dest.lng,
          transportMode: mode,
        };
        const updated = [...savedProfiles, newProfile];
        setSavedProfiles(updated);
        localStorage.setItem("estatepro-commute-profiles", JSON.stringify(updated));
        toast.success(t("commute.destinationSaved"));
      } catch {
        toast.error(t("commute.failedSaveDestination"));
      } finally {
        setSaving(false);
      }
    },
    [savedProfiles, locale]
  );

  const deleteProfile = useCallback(
    (id: string) => {
      const updated = savedProfiles.filter((p) => p.id !== id);
      setSavedProfiles(updated);
      localStorage.setItem("estatepro-commute-profiles", JSON.stringify(updated));
      toast.success(t("commute.destinationDeleted"));
    },
    [savedProfiles, locale]
  );

  const selectProperty = useCallback(
    (prop: PropertyOption) => {
      setSelectedProperty(prop);
      setCustomLat("");
      setCustomLng("");
      setCustomName("");
    },
    []
  );

  const useCustomLocation = useCallback(() => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error(t("commute.enterValidCoordinates"));
      return;
    }
    setSelectedProperty(null);
  }, [customLat, customLng, locale]);

  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[500px] rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t("commute.title")}</h1>
              <p className="text-muted-foreground text-sm">{t("commute.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map / Location Panel */}
          <div className="space-y-4">
            {/* Property Selector */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold mb-3">{t("commute.selectProperty")}</h2>

                {/* Quick property selector */}
                <div className="space-y-2 mb-4">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {properties.slice(0, 10).map((prop) => {
                      const name = locale === "ar" ? prop.titleAr : prop.titleEn;
                      const address = locale === "ar" ? prop.addressAr : prop.addressEn;
                      const isSelected = selectedProperty?.id === prop.id;
                      return (
                        <button
                          key={prop.id}
                          onClick={() => selectProperty(prop)}
                          className={`w-full text-start p-2.5 rounded-lg border transition-colors text-sm ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{name}</p>
                              <p className="text-xs text-muted-foreground truncate">{address}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Custom Location */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t("commute.propertyPlaceholder")}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Lat"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-24"
                      type="number"
                      step="any"
                    />
                    <Input
                      placeholder="Lng"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="w-24"
                      type="number"
                      step="any"
                    />
                    <Button size="sm" onClick={useCustomLocation} className="shrink-0">
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Current Origin */}
                {(originLat && originLng) && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {originName || `${originLat.toFixed(4)}, ${originLng.toFixed(4)}`}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {originLat.toFixed(4)}, {originLng.toFixed(4)}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Destinations */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold mb-3">{t("commute.savedDestinations")}</h2>
                {savedProfiles.length === 0 ? (
                  <div className="text-center py-6">
                    <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{t("commute.noDestinations")}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {savedProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{profile.destinationName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {profile.destinationLat.toFixed(4)}, {profile.destinationLng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                          onClick={() => deleteProfile(profile.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Destination Presets */}
            <Card>
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold mb-3">{t("commute.presets")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESETS.map((preset) => (
                    <div
                      key={preset.key}
                      className="p-2.5 rounded-lg bg-muted/30 border border-border/30 text-center"
                    >
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs font-medium">{t(`commute.${preset.key}`)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {preset.lat.toFixed(2)}°, {preset.lng.toFixed(2)}°
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculator Panel */}
          <div>
            <Card>
              <CardContent className="p-4">
                <CommuteCalculator
                  originLat={originLat}
                  originLng={originLng}
                  originName={originName}
                  onSaveProfile={saveProfileToStorage}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
