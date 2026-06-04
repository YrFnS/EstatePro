"use client";

import { DollarSign, Home, MapPin, Brain, AlertTriangle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fadeUp } from "@/components/real-estate/types/animations";
import { featureOptions } from "./valuation-types";

interface ValuationFormProps {
  address: string;
  setAddress: (v: string) => void;
  propertyType: string;
  setPropertyType: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  bathrooms: string;
  setBathrooms: (v: string) => void;
  yearBuilt: string;
  setYearBuilt: (v: string) => void;
  selectedFeatures: string[];
  toggleFeature: (key: string) => void;
  handleSubmit: () => void;
  isConfigured: boolean;
  onNavigateSettings: () => void;
  t: (key: string) => string;
}

export function ValuationForm({
  address,
  setAddress,
  propertyType,
  setPropertyType,
  size,
  setSize,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  yearBuilt,
  setYearBuilt,
  selectedFeatures,
  toggleFeature,
  handleSubmit,
  isConfigured,
  onNavigateSettings,
  t,
}: ValuationFormProps) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      {/* API Key Warning */}
      {!isConfigured && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-6"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{t("settings.configurePrompt")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateSettings}
              className="ms-auto shrink-0 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
            >
              <Settings className="w-3.5 h-3.5 me-1" />
              {t("settings.title")}
            </Button>
          </div>
        </motion.div>
      )}
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Powered</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("valuation.title")}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("valuation.subtitle")}</p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
      </motion.div>

      {/* Form */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              {t("valuation.propertyDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Address */}
            <div>
              <Label className="mb-1.5 block">{t("valuation.address")}</Label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("valuation.addressPlaceholder")}
                  className="ps-9"
                />
              </div>
            </div>

            {/* Property Type & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("valuation.propertyType")} *</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("valuation.propertyType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">{t("properties.apartment")}</SelectItem>
                    <SelectItem value="villa">{t("properties.villa")}</SelectItem>
                    <SelectItem value="house">{t("properties.house")}</SelectItem>
                    <SelectItem value="condo">{t("properties.condo")}</SelectItem>
                    <SelectItem value="townhouse">{t("properties.townhouse")}</SelectItem>
                    <SelectItem value="penthouse">{t("properties.penthouse")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("valuation.size")} *</Label>
                <Input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., 1500"
                  min="100"
                />
              </div>
            </div>

            {/* Bedrooms, Bathrooms, Year Built */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("valuation.bedrooms")} *</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("valuation.bedrooms")} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("valuation.bathrooms")} *</Label>
                <Select value={bathrooms} onValueChange={setBathrooms}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("valuation.bathrooms")} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("valuation.yearBuilt")}</Label>
                <Input
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g., 2015"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <Label className="mb-2 block">{t("valuation.features")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {featureOptions.map((feat) => {
                  const isSelected = selectedFeatures.includes(feat.key);
                  const Icon = feat.icon;
                  return (
                    <motion.button
                      key={feat.key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => toggleFeature(feat.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-start text-sm ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/30 dark:hover:border-primary/60"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : feat.color}`} />
                      <span className="truncate text-xs">{t(`valuation.${feat.key}`)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              size="lg"
              disabled={!propertyType || !size || !bedrooms || !bathrooms}
              className="w-full bg-primary hover:bg-primary/90 shadow-lg  gap-2 mt-2"
            >
              <DollarSign className="w-4 h-4" />
              {t("valuation.calculateValue")}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
