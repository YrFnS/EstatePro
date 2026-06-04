"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useState, useCallback } from "react";
import { Car, Train, Bike, Footprints, MapPin, Clock, Route, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CommuteResult {
  distance: number;
  distanceUnit: string;
  distanceMiles: number;
  estimatedTime: number;
  timeUnit: string;
  transportMode: string;
}

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

const PRESETS: { key: string; lat: number; lng: number }[] = [
  { key: "downtown", lat: 40.7580, lng: -73.9855 },
  { key: "airport", lat: 40.6413, lng: -73.7781 },
  { key: "university", lat: 40.7295, lng: -73.9965 },
  { key: "shoppingMall", lat: 40.7484, lng: -73.9857 },
  { key: "hospital", lat: 40.7831, lng: -73.9712 },
  { key: "centralStation", lat: 40.7527, lng: -73.9772 },
];

const TRANSPORT_MODES = [
  { mode: "driving", icon: Car },
  { mode: "transit", icon: Train },
  { mode: "cycling", icon: Bike },
  { mode: "walking", icon: Footprints },
];

function getTimeIndicator(minutes: number): { color: string; emoji: string; label: string } {
  if (minutes < 15) return { color: "bg-emerald-500", emoji: "🟢", label: "excellent" };
  if (minutes < 30) return { color: "bg-yellow-500", emoji: "🟡", label: "good" };
  if (minutes < 45) return { color: "bg-orange-500", emoji: "🟠", label: "moderate" };
  return { color: "bg-red-500", emoji: "🔴", label: "long" };
}

interface CommuteCalculatorProps {
  originLat?: number;
  originLng?: number;
  originName?: string;
  onSaveProfile?: (dest: Destination, mode: string) => void;
  compact?: boolean;
}

export function CommuteCalculator({
  originLat,
  originLng,
  originName,
  onSaveProfile,
  compact = false,
}: CommuteCalculatorProps) {
  const { t, locale } = useI18n();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [newDestName, setNewDestName] = useState("");
  const [newDestLat, setNewDestLat] = useState("");
  const [newDestLng, setNewDestLng] = useState("");
  const [selectedMode, setSelectedMode] = useState("driving");
  const [results, setResults] = useState<(CommuteResult & { destName: string })[]>([]);
  const [allModeResults, setAllModeResults] = useState<Record<string, CommuteResult[]>>({});
  const [calculating, setCalculating] = useState(false);

  const addDestination = useCallback(() => {
    if (!newDestName.trim()) {
      toast.error(t("commute.enterDestinationName"));
      return;
    }
    if (destinations.length >= 3) {
      toast.error(t("commute.maxDestinations"));
      return;
    }
    const lat = parseFloat(newDestLat);
    const lng = parseFloat(newDestLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error(t("commute.enterValidCoordinates"));
      return;
    }
    setDestinations((prev) => [...prev, { name: newDestName.trim(), lat, lng }]);
    setNewDestName("");
    setNewDestLat("");
    setNewDestLng("");
  }, [newDestName, newDestLat, newDestLng, destinations.length, locale]);

  const addPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      if (destinations.length >= 3) {
        toast.error(t("commute.maxDestinations"));
        return;
      }
      if (destinations.some((d) => d.name === t(`commute.${preset.key}`))) return;
      setDestinations((prev) => [
        ...prev,
        { name: t(`commute.${preset.key}`), lat: preset.lat, lng: preset.lng },
      ]);
    },
    [destinations, t]
  );

  const removeDestination = useCallback((idx: number) => {
    setDestinations((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const calculateCommute = useCallback(async () => {
    if (!originLat || !originLng) {
      toast.error(t("commute.setPropertyLocation"));
      return;
    }
    if (destinations.length === 0) {
      toast.error(t("commute.addOneDestination"));
      return;
    }
    setCalculating(true);
    try {
      const allResults: (CommuteResult & { destName: string })[] = [];
      const modeResults: Record<string, CommuteResult[]> = {};

      for (const dest of destinations) {
        // Calculate for selected mode
        const res = await fetch("/api/commute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originLat,
            originLng,
            destinationLat: dest.lat,
            destinationLng: dest.lng,
            transportMode: selectedMode,
          }),
        });
        const data = await res.json();
        allResults.push({ ...data, destName: dest.name });

        // Calculate for all modes for comparison
        const modes = ["driving", "transit", "cycling", "walking"];
        const modeRes: CommuteResult[] = [];
        for (const mode of modes) {
          const mRes = await fetch("/api/commute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originLat,
              originLng,
              destinationLat: dest.lat,
              destinationLng: dest.lng,
              transportMode: mode,
            }),
          });
          const mData = await mRes.json();
          modeRes.push(mData);
        }
        modeResults[dest.name] = modeRes;
      }

      setResults(allResults);
      setAllModeResults(modeResults);
    } catch {
      toast.error(t("commute.calculationFailed"));
    } finally {
      setCalculating(false);
    }
  }, [originLat, originLng, destinations, selectedMode, locale]);

  const handleSaveProfile = useCallback(
    (dest: Destination) => {
      if (onSaveProfile) {
        onSaveProfile(dest, selectedMode);
      }
    },
    [onSaveProfile, selectedMode]
  );

  return (
    <div className="space-y-4">
      {/* Transport Mode Selection */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("commute.transportMode")}
        </label>
        <div className="flex gap-2">
          {TRANSPORT_MODES.map(({ mode, icon: Icon }) => (
            <Button
              key={mode}
              variant={selectedMode === mode ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setSelectedMode(mode)}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(`commute.${mode}`)}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Destination Input */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("commute.destinationName")}
        </label>
        <div className="flex gap-2">
          <Input
            placeholder={t("commute.destinationPlaceholder")}
            value={newDestName}
            onChange={(e) => setNewDestName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Lat"
            value={newDestLat}
            onChange={(e) => setNewDestLat(e.target.value)}
            className="w-20"
            type="number"
            step="any"
          />
          <Input
            placeholder="Lng"
            value={newDestLng}
            onChange={(e) => setNewDestLng(e.target.value)}
            className="w-20"
            type="number"
            step="any"
          />
          <Button size="icon" onClick={addDestination} title={t("commute.addDestination")}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("commute.presets")}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => addPreset(preset)}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t(`commute.${preset.key}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Added Destinations */}
      {destinations.length > 0 && (
        <div className="space-y-2">
          {destinations.map((dest, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{dest.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({dest.lat.toFixed(4)}, {dest.lng.toFixed(4)})
                </span>
              </div>
              <div className="flex items-center gap-1">
                {onSaveProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSaveProfile(dest)}
                    title={t("commute.saveDestination")}
                  >
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeDestination(idx)}
                  title={t("commute.deleteDestination")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculate Button */}
      <Button
        className="w-full gap-2 btn-gold"
        onClick={calculateCommute}
        disabled={calculating || !originLat || !originLng || destinations.length === 0}
      >
        <Route className="w-4 h-4" />
        {calculating
          ? t("commute.calculating")
          : t("commute.calculate")}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("commute.commuteTimes")}</h3>
          {results.map((result, idx) => {
            const indicator = getTimeIndicator(result.estimatedTime);
            const modeResults = allModeResults[result.destName];

            return (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{indicator.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{result.destName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`commute.${indicator.label}`)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold text-primary">
                          {result.estimatedTime}
                        </span>
                        <span className="text-xs text-muted-foreground">{t("commute.minutes")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {result.distance} {t("commute.kilometers")} / {result.distanceMiles} {t("commute.miles")}
                      </p>
                    </div>
                  </div>

                  {/* Time indicator bar */}
                  <div className="w-full h-2 rounded-full bg-muted mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${indicator.color}`}
                      style={{ width: `${Math.min(100, (result.estimatedTime / 60) * 100)}%` }}
                    />
                  </div>

                  {/* Compare Transport Modes */}
                  {modeResults && !compact && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t("commute.compareModes")}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {modeResults.map((mr) => {
                          const modeIcon = TRANSPORT_MODES.find((m) => m.mode === mr.transportMode);
                          const modeIndicator = getTimeIndicator(mr.estimatedTime);
                          return (
                            <div
                              key={mr.transportMode}
                              className="text-center p-2 rounded-lg bg-muted/30 border border-border/30"
                            >
                              {modeIcon && <modeIcon.icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />}
                              <p className="text-sm font-bold">{mr.estimatedTime}</p>
                              <p className="text-[10px] text-muted-foreground">{t("commute.minutes")}</p>
                              <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${modeIndicator.color}`}
                                  style={{ width: `${Math.min(100, (mr.estimatedTime / 60) * 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No origin set warning */}
      {(!originLat || !originLng) && (
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border/30">
          <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("commute.setPropertyLocationDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
