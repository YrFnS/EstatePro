"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useOpenRouterSettings } from "@/lib/openrouter-settings";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, DollarSign, Home, MapPin, Heart, ArrowRight,
  ArrowLeft, Sparkles, ChevronRight, Loader2, RefreshCw,
  Users, Shield, TreePine, Dog, Lock, Waves, Leaf,
  Building2, Bed, Bath, Maximize, AlertTriangle, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCard } from "@/components/real-estate/property-card";

import type { Property } from "@/components/real-estate/types/property";

interface Recommendation {
  property: Property;
  matchScore: number;
  reasoning: string;
}

const lifestyleOptions = [
  { key: "familyFriendly", icon: Users, color: "bg-primary/10 text-primary" },
  { key: "investment", icon: DollarSign, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { key: "luxury", icon: Sparkles, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { key: "urban", icon: Building2, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  { key: "quiet", icon: TreePine, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { key: "petFriendly", icon: Dog, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { key: "gated", icon: Lock, color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
  { key: "waterfront", icon: Waves, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { key: "ecoFriendly", icon: Leaf, color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const slideIn = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export function AIRecommendPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { settings: openRouterSettings } = useOpenRouterSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Step 1: Budget & Type
  const [budgetRange, setBudgetRange] = useState<[number, number]>([100000, 1500000]);
  const [propertyType, setPropertyType] = useState("any");

  // Step 2: Location & Size
  const [preferredArea, setPreferredArea] = useState("any");
  const [minBedrooms, setMinBedrooms] = useState("any");
  const [minBathrooms, setMinBathrooms] = useState("any");

  // Step 3: Lifestyle
  const [selectedLifestyles, setSelectedLifestyles] = useState<string[]>([]);

  // Step 4: Notes
  const [additionalNotes, setAdditionalNotes] = useState("");

  const totalSteps = 4;

  const toggleLifestyle = (key: string) => {
    setSelectedLifestyles((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setProgressMessage(0);
    setRecommendations([]);

    const messages = [
      t("aiRecommend.analysisProgress1"),
      t("aiRecommend.analysisProgress2"),
      t("aiRecommend.analysisProgress3"),
      t("aiRecommend.analysisProgress4"),
    ];

    // Show progress messages
    for (let i = 0; i < messages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setProgressMessage(i + 1);
    }

    try {
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-key": openRouterSettings.apiKey || "",
          "x-openrouter-model": openRouterSettings.model || "google/gemini-2.0-flash-001",
        },
        body: JSON.stringify({
          minBudget: budgetRange[0],
          maxBudget: budgetRange[1],
          propertyType,
          preferredArea,
          minBedrooms: minBedrooms !== "any" ? minBedrooms : undefined,
          minBathrooms: minBathrooms !== "any" ? minBathrooms : undefined,
          lifestylePreferences: selectedLifestyles,
          additionalNotes,
        }),
      });

      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setRecommendations([]);
    setBudgetRange([100000, 1500000]);
    setPropertyType("any");
    setPreferredArea("any");
    setMinBedrooms("any");
    setMinBathrooms("any");
    setSelectedLifestyles([]);
    setAdditionalNotes("");
  };

  const canGoNext = () => {
    return true; // All steps can be skipped with defaults
  };

  const formatPrice = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  // Loading/Analyzing state
  if (isAnalyzing) {
    const messages = [
      t("aiRecommend.analysisProgress1"),
      t("aiRecommend.analysisProgress2"),
      t("aiRecommend.analysisProgress3"),
      t("aiRecommend.analysisProgress4"),
    ];
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-xl "
          >
            <Brain className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">{t("aiRecommend.analyzing")}</h3>
          <div className="space-y-3 mt-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: progressMessage > i ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-3 text-sm"
              >
                {progressMessage > i ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : progressMessage === i ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                )}
                <span className={progressMessage > i ? "text-foreground" : "text-muted-foreground"}>
                  {msg}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Results state
  if (recommendations.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
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
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("aiRecommend.resultsTitle")}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("aiRecommend.resultsSubtitle")}</p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
        </motion.div>

        {recommendations.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("aiRecommend.noResults")}</h3>
            <p className="text-muted-foreground mb-6">{t("aiRecommend.noResultsDesc")}</p>
            <Button onClick={handleReset} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <RefreshCw className="w-4 h-4 me-2" />
              {t("aiRecommend.getNewRecommendations")}
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-6 max-w-5xl mx-auto">
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={rec.property.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="flex flex-col lg:flex-row">
                      {/* Property Card */}
                      <div className="lg:w-80 shrink-0">
                        <PropertyCard property={rec.property} />
                      </div>
                      {/* AI Analysis */}
                      <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between">
                        <div>
                          {/* Match Score */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="relative w-16 h-16">
                              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle
                                  cx="32" cy="32" r="28"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  className="text-muted/20"
                                />
                                <circle
                                  cx="32" cy="32" r="28"
                                  fill="none"
                                  stroke={rec.matchScore >= 80 ? "#10b981" : rec.matchScore >= 60 ? "#14b8a6" : "#f59e0b"}
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(rec.matchScore / 100) * 176} 176`}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                                {rec.matchScore}%
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">{t("aiRecommend.matchScore")}</div>
                              <div className="text-lg font-bold">
                                {rec.matchScore >= 80 ? "Excellent Match" : rec.matchScore >= 60 ? "Good Match" : "Partial Match"}
                              </div>
                            </div>
                          </div>

                          {/* Why this matches */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-primary" />
                              {t("aiRecommend.whyMatches")}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{rec.reasoning}</p>
                          </div>
                        </div>

                        {/* View details button */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Bed className="w-3.5 h-3.5" /> {rec.property.bedrooms} {t("common.beds")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Bath className="w-3.5 h-3.5" /> {rec.property.bathrooms} {t("common.baths")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Maximize className="w-3.5 h-3.5" /> {rec.property.area} {t("common.sqft")}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("property-detail", { id: rec.property.id })}
                            className="text-primary border-primary/20 hover:bg-primary/10 dark:text-primary dark:border-primary/40 dark:hover:bg-primary/10"
                          >
                            {t("common.viewDetails")}
                            <ArrowRight className="w-3.5 h-3.5 ms-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Get New Recommendations */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-center mt-10"
            >
              <Button
                onClick={handleReset}
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-lg "
              >
                <RefreshCw className="w-4 h-4 me-2" />
                {t("aiRecommend.getNewRecommendations")}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    );
  }

  // Wizard state
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* API Key Warning */}
      {!openRouterSettings.isConfigured && (
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
              onClick={() => navigate("settings")}
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
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("aiRecommend.title")}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("aiRecommend.subtitle")}</p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: currentStep === i + 1 ? 1.1 : 1,
                backgroundColor: currentStep >= i + 1 ? "#10b981" : undefined,
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= i + 1
                  ? "bg-primary shadow-md "
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > i + 1 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </motion.div>
            {i < totalSteps - 1 && (
              <div className={`w-8 md:w-16 h-0.5 rounded-full transition-colors ${
                currentStep > i + 1 ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={slideIn}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {t("aiRecommend.step")} {currentStep} {t("aiRecommend.of")} {totalSteps}
              </div>
              <CardTitle className="text-xl">
                {t(`aiRecommend.step${currentStep}Title`)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(`aiRecommend.step${currentStep}Desc`)}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Step 1: Budget & Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Budget Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">{t("aiRecommend.budgetRange")}</label>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <Slider
                        value={budgetRange}
                        onValueChange={(val) => setBudgetRange(val as [number, number])}
                        min={50000}
                        max={5000000}
                        step={50000}
                        className="mb-3"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-primary">{formatPrice(budgetRange[0])}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="font-semibold text-primary">{formatPrice(budgetRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("aiRecommend.propertyType")}</label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("aiRecommend.anyType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("aiRecommend.anyType")}</SelectItem>
                        <SelectItem value="apartment">{t("properties.apartment")}</SelectItem>
                        <SelectItem value="villa">{t("properties.villa")}</SelectItem>
                        <SelectItem value="house">{t("properties.house")}</SelectItem>
                        <SelectItem value="condo">{t("properties.condo")}</SelectItem>
                        <SelectItem value="townhouse">{t("properties.townhouse")}</SelectItem>
                        <SelectItem value="penthouse">{t("properties.penthouse")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Size */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Preferred Area */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("aiRecommend.preferredArea")}</label>
                    <Select value={preferredArea} onValueChange={setPreferredArea}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("aiRecommend.anyArea")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("aiRecommend.anyArea")}</SelectItem>
                        <SelectItem value="Downtown">{t("neighborhoods.downtown")}</SelectItem>
                        <SelectItem value="Waterfront">{t("neighborhoods.waterfront")}</SelectItem>
                        <SelectItem value="Suburbs">{t("neighborhoods.suburbs")}</SelectItem>
                        <SelectItem value="Midtown">{t("neighborhoods.midtown")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Bedrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("aiRecommend.minBedrooms")}</label>
                    <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("properties.any")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("properties.any")}</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Bathrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("aiRecommend.minBathrooms")}</label>
                    <Select value={minBathrooms} onValueChange={setMinBathrooms}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("properties.any")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t("properties.any")}</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Lifestyle Preferences */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <label className="text-sm font-medium mb-2 block">{t("aiRecommend.lifestylePreferences")}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {lifestyleOptions.map((opt) => {
                      const isSelected = selectedLifestyles.includes(opt.key);
                      const Icon = opt.icon;
                      return (
                        <motion.button
                          key={opt.key}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleLifestyle(opt.key)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-start ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-muted hover:border-primary/30 dark:hover:border-primary/60"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${opt.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{t(`aiRecommend.${opt.key}`)}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Additional Notes */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("aiRecommend.additionalNotes")}</label>
                    <Textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder={t("aiRecommend.notesPlaceholder")}
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("aiRecommend.prevStep")}
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
            disabled={!canGoNext()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {t("aiRecommend.nextStep")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleAnalyze}
            size="lg"
            className="bg-primary hover:bg-primary/90 shadow-lg  gap-2"
          >
            <Brain className="w-4 h-4" />
            {t("aiRecommend.analyzePreferences")}
          </Button>
        )}
      </div>
    </div>
  );
}
