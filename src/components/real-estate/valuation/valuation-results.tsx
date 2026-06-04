"use client";

import { motion } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, ArrowDownRight, Download,
  RefreshCw, BarChart3, PieChart, Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/real-estate/types/animations";
import type { ValuationResult } from "./valuation-types";

interface ValuationResultsProps {
  result: ValuationResult;
  handleReset: () => void;
  t: (key: string) => string;
}

const formatPrice = (val: number) => `$${val.toLocaleString()}`;

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "appreciating": return <TrendingUp className="w-5 h-5 text-primary" />;
    case "depreciating": return <TrendingDown className="w-5 h-5 text-red-500" />;
    default: return <Minus className="w-5 h-5 text-amber-500" />;
  }
};

const getTrendLabel = (trend: string, t: (key: string) => string) => {
  switch (trend) {
    case "appreciating": return t("valuation.appreciating");
    case "depreciating": return t("valuation.depreciating");
    default: return t("valuation.stable");
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case "appreciating": return "text-primary bg-primary/10";
    case "depreciating": return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
    default: return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20";
  }
};

const getScoreColor = (score: number) => {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#14b8a6";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
};

export function ValuationResults({ result, handleReset, t }: ValuationResultsProps) {
  const confidenceRange = result.confidenceHigh - result.confidenceLow;
  const rangePosition = ((result.estimatedValue - result.confidenceLow) / confidenceRange) * 100;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
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
        <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
      </motion.div>

      {/* Estimated Value - Hero Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-8"
      >
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-primary p-8 md:p-10 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative z-10">
              <p className="text-primary-foreground/80 text-sm font-medium mb-2">{t("valuation.estimatedValue")}</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{formatPrice(result.estimatedValue)}</h2>

              {/* Confidence Range Bar */}
              <div className="max-w-md mx-auto">
                <p className="text-primary-foreground/80 text-xs mb-2">{t("valuation.confidenceRange")}</p>
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 bg-white/30 rounded-full" style={{ left: "5%", right: "5%" }} />
                  <div
                    className="absolute w-3 h-3 bg-white rounded-full shadow-md border-2 border-primary"
                    style={{ left: `calc(5% + ${rangePosition * 0.9}%)`, transform: "translateX(-50%)" }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-primary-foreground/80 mt-1">
                  <span>{formatPrice(result.confidenceLow)}</span>
                  <span>{formatPrice(result.confidenceHigh)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investment Score */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {t("valuation.investmentScore")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t("valuation.investmentScoreDesc")}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke={getScoreColor(result.investmentScore)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.investmentScore / 100) * 214} 214`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: getScoreColor(result.investmentScore) }}>
                    {result.investmentScore}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {Object.entries(result.scoreBreakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{t(`valuation.${key}`)}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getScoreColor(value) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Market Analysis */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {t("valuation.marketAnalysis")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Market Trend */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium">{t("valuation.marketTrend")}</span>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getTrendColor(result.marketTrend)}`}>
                  {getTrendIcon(result.marketTrend)}
                  {getTrendLabel(result.marketTrend, t)}
                </div>
              </div>

              {/* Comparison Averages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("valuation.neighborhoodAvg")}</span>
                  <span className="text-sm font-semibold">{formatPrice(result.neighborhoodAvg)}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (result.neighborhoodAvg / result.estimatedValue) * 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("valuation.cityAvg")}</span>
                  <span className="text-sm font-semibold">{formatPrice(result.cityAvg)}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (result.cityAvg / result.estimatedValue) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Neighborhood</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />City</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Factors */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                {t("valuation.keyFactors")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Positive Factors */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-primary flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {t("valuation.positiveFactors")}
                </h4>
                <div className="space-y-1.5">
                  {result.positiveFactors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Factors */}
              {result.negativeFactors && result.negativeFactors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {t("valuation.negativeFactors")}
                  </h4>
                  <div className="space-y-1.5">
                    {result.negativeFactors.map((factor, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Value Breakdown */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {t("valuation.valueBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stacked bar visualization */}
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {result.valueBreakdown.baseValue > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.valueBreakdown.baseValue / result.estimatedValue) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className="bg-primary h-full flex items-center justify-center"
                    >
                      <span className="text-[10px] text-primary-foreground font-medium truncate px-1">Base</span>
                    </motion.div>
                  )}
                  {result.valueBreakdown.featureBonus > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.valueBreakdown.featureBonus / result.estimatedValue) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="bg-primary h-full flex items-center justify-center"
                    >
                      <span className="text-[10px] text-primary-foreground font-medium truncate px-1">Features</span>
                    </motion.div>
                  )}
                  {result.valueBreakdown.locationAdjustment > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.valueBreakdown.locationAdjustment / result.estimatedValue) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="bg-cyan-500 h-full flex items-center justify-center"
                    >
                      <span className="text-[10px] text-primary-foreground font-medium truncate px-1">Location</span>
                    </motion.div>
                  )}
                  {result.valueBreakdown.marketAdjustment > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.valueBreakdown.marketAdjustment / result.estimatedValue) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="bg-amber-500 h-full flex items-center justify-center"
                    >
                      <span className="text-[10px] text-primary-foreground font-medium truncate px-1">Market</span>
                    </motion.div>
                  )}
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {[
                    { key: "baseValue", value: result.valueBreakdown.baseValue, color: "bg-primary" },
                    { key: "featureBonus", value: result.valueBreakdown.featureBonus, color: "bg-primary" },
                    { key: "locationAdjustment", value: result.valueBreakdown.locationAdjustment, color: "bg-cyan-500" },
                    { key: "marketAdjustment", value: result.valueBreakdown.marketAdjustment, color: "bg-amber-500" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-muted-foreground">{t(`valuation.${item.key}`)}</span>
                      </div>
                      <span className="font-medium">{formatPrice(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
      >
        <Button
          onClick={handleReset}
          size="lg"
          className="bg-primary hover:bg-primary/90 shadow-lg  gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("valuation.newValuation")}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            const report = `Property Valuation Report\n${"=".repeat(40)}\nEstimated Value: ${formatPrice(result.estimatedValue)}\nConfidence Range: ${formatPrice(result.confidenceLow)} - ${formatPrice(result.confidenceHigh)}\nMarket Trend: ${getTrendLabel(result.marketTrend, t)}\nInvestment Score: ${result.investmentScore}/100\n\nKey Positive Factors:\n${result.positiveFactors.map((f) => `- ${f}`).join("\n")}\n\nNegative Factors:\n${(result.negativeFactors || []).map((f) => `- ${f}`).join("\n")}`;
            const blob = new Blob([report], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "property-valuation-report.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {t("valuation.downloadReport")}
        </Button>
      </motion.div>
    </div>
  );
}
