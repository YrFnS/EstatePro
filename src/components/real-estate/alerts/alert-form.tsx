"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_TYPES, FREQUENCY_ICONS } from "./alerts-types";

export interface AlertFormState {
  alertName: string;
  propertyType: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
  location: string;
  frequency: "instant" | "daily" | "weekly";
}

export interface AlertFormProps {
  showForm: boolean;
  formState: AlertFormState;
  onFormChange: <K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) => void;
  onCreateAlert: () => void;
  onResetForm: () => void;
  onToggleForm: () => void;
}

export function AlertForm({
  showForm,
  formState,
  onFormChange,
  onCreateAlert,
  onResetForm,
  onToggleForm,
}: AlertFormProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Create Alert Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Button
          onClick={onToggleForm}
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
                  {t("alerts.createAlert") || "Create Alert"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alert Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("alerts.alertName") || "Alert Name"}</label>
                  <Input
                    placeholder={t("alerts.alertNamePlaceholder") || "e.g., Downtown Apartments Under $500K"}
                    value={formState.alertName}
                    onChange={(e) => onFormChange("alertName", e.target.value)}
                    className="h-10"
                  />
                </div>

                {/* Property Type */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("properties.propertyType") || "Property Type"}</label>
                  <Select value={formState.propertyType} onValueChange={(v) => onFormChange("propertyType", v)}>
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
                  <Select value={formState.status} onValueChange={(v) => onFormChange("status", v)}>
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
                      value={formState.minPrice}
                      onChange={(e) => onFormChange("minPrice", e.target.value)}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      placeholder={t("properties.maxPrice") || "Max Price"}
                      value={formState.maxPrice}
                      onChange={(e) => onFormChange("maxPrice", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("properties.bedrooms") || "Bedrooms"}</label>
                    <Select value={formState.bedrooms} onValueChange={(v) => onFormChange("bedrooms", v)}>
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
                    <Select value={formState.bathrooms} onValueChange={(v) => onFormChange("bathrooms", v)}>
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
                      value={formState.minArea}
                      onChange={(e) => onFormChange("minArea", e.target.value)}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      placeholder={t("properties.maxArea") || "Max"}
                      value={formState.maxArea}
                      onChange={(e) => onFormChange("maxArea", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("hero.location") || "Location"}</label>
                  <Input
                    placeholder={t("hero.searchPlaceholder") || "City, neighborhood..."}
                    value={formState.location}
                    onChange={(e) => onFormChange("location", e.target.value)}
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
                          onClick={() => onFormChange("frequency", freq)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                            formState.frequency === freq
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
                    onClick={onCreateAlert}
                    disabled={!formState.alertName.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <BellRing className="w-4 h-4 me-2" />
                    {t("alerts.createAlert") || "Create Alert"}
                  </Button>
                  <Button variant="outline" onClick={() => { onResetForm(); }}>
                    {t("common.cancel") || "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
