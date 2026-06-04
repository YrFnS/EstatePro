"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import {
  DollarSign,
  Percent,
  Clock,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useCallback } from "react";
import { useTheme } from "next-themes";

import { fadeUp } from "@/components/real-estate/types/animations";
import { AnimatedNumber } from "./animated-number";

export function AffordabilityCalculatorTab() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [monthlyIncome, setMonthlyIncome] = useState(8000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2500);
  const [existingEMIs, setExistingEMIs] = useState(500);
  const [downPaymentAvail, setDownPaymentAvail] = useState(100000);
  const [affordRate, setAffordRate] = useState(6.5);
  const [affordTerm, setAffordTerm] = useState(30);

  const affordability = useMemo(() => {
    // 28% rule: max housing expense = 28% of gross monthly income
    const maxHousingExpense = monthlyIncome * 0.28;
    // 36% rule: total debt including housing <= 36% of gross monthly income
    const maxTotalDebt = monthlyIncome * 0.36;
    const availableForEMI = Math.min(
      maxHousingExpense,
      maxTotalDebt - existingEMIs
    );

    // Calculate max loan from EMI
    const monthlyRate = affordRate / 100 / 12;
    const totalPayments = affordTerm * 12;
    let maxLoan = 0;
    if (monthlyRate > 0 && totalPayments > 0) {
      maxLoan =
        (availableForEMI *
          (Math.pow(1 + monthlyRate, totalPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, totalPayments));
    } else if (totalPayments > 0) {
      maxLoan = availableForEMI * totalPayments;
    }

    const maxPropertyPrice = Math.round(maxLoan) + downPaymentAvail;
    const comfortableEMI = monthlyIncome * 0.25;
    const stretchEMI = monthlyIncome * 0.33;

    // Affordability score (0-100)
    const debtRatio = (existingEMIs + availableForEMI) / monthlyIncome;
    const savingsRatio = downPaymentAvail / (maxPropertyPrice || 1);
    const score = Math.min(
      100,
      Math.round(
        (1 - debtRatio) * 50 + savingsRatio * 30 + (availableForEMI > 0 ? 20 : 0)
      )
    );

    return {
      availableForEMI: Math.max(0, Math.round(availableForEMI)),
      maxLoanAmount: Math.round(maxLoan),
      maxPropertyPrice: Math.round(maxPropertyPrice),
      comfortableEMI: Math.round(comfortableEMI),
      stretchEMI: Math.round(stretchEMI),
      score: Math.max(0, score),
    };
  }, [monthlyIncome, monthlyExpenses, existingEMIs, downPaymentAvail, affordRate, affordTerm]);

  const formatCurrency = useCallback((value: number) => `$${value.toLocaleString()}`, []);

  // Score color and label
  const scoreColor =
    affordability.score >= 70
      ? "text-primary"
      : affordability.score >= 40
        ? "text-amber-500"
        : "text-red-500";
  const scoreLabel =
    affordability.score >= 70
      ? t("calc.comfortable")
      : affordability.score >= 40
        ? t("calc.stretch")
        : t("calc.overBudget");
  const scoreArcColor =
    affordability.score >= 70
      ? "#059669"
      : affordability.score >= 40
        ? "#f59e0b"
        : "#ef4444";

  // Gauge circle parameters
  const gaugeRadius = 80;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (affordability.score / 100) * gaugeCircumference;

  const tips = useMemo(() => {
    const tipsList: string[] = [];
    if (affordability.score >= 70) {
      tipsList.push(t("calc.basedOnIncome") + " " + formatCurrency(affordability.maxPropertyPrice));
    }
    if (affordability.score >= 40 && affordability.score < 70) {
      tipsList.push(t("calc.stretchAfford") + " " + formatCurrency(affordability.maxPropertyPrice));
    }
    if (affordability.score < 40) {
      tipsList.push(t("calc.overBudgetTip"));
    }
    if (downPaymentAvail < affordability.maxPropertyPrice * 0.2) {
      tipsList.push(t("calc.increaseDownPayment"));
    }
    if (affordTerm > 20) {
      tipsList.push(t("calc.reduceLoanTerm"));
    }
    return tipsList;
  }, [affordability, downPaymentAvail, affordTerm, t, formatCurrency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Controls */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6 md:p-8 space-y-7">
            {/* Monthly Income */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {t("calc.monthlyIncome")}
                </label>
                <Input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={500}
                />
              </div>
              <Slider
                value={[monthlyIncome]}
                onValueChange={(v) => setMonthlyIncome(v[0])}
                min={0}
                max={50000}
                step={500}
                className="[&_[role=slider]]:bg-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>$50K</span>
              </div>
            </div>

            {/* Monthly Expenses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  {t("calc.monthlyExpenses")}
                </label>
                <Input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={100}
                />
              </div>
              <Slider
                value={[monthlyExpenses]}
                onValueChange={(v) => setMonthlyExpenses(v[0])}
                min={0}
                max={20000}
                step={100}
                className="[&_[role=slider]]:bg-amber-500"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>$20K</span>
              </div>
            </div>

            {/* Existing EMIs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-500" />
                  {t("calc.existingEMIs")}
                </label>
                <Input
                  type="number"
                  value={existingEMIs}
                  onChange={(e) => setExistingEMIs(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={50}
                />
              </div>
              <Slider
                value={[existingEMIs]}
                onValueChange={(v) => setExistingEMIs(v[0])}
                min={0}
                max={10000}
                step={50}
                className="[&_[role=slider]]:bg-red-500"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>$10K</span>
              </div>
            </div>

            {/* Down Payment Available */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {t("calc.downPayment")}
                </label>
                <Input
                  type="number"
                  value={downPaymentAvail}
                  onChange={(e) => setDownPaymentAvail(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={5000}
                />
              </div>
              <Slider
                value={[downPaymentAvail]}
                onValueChange={(v) => setDownPaymentAvail(v[0])}
                min={0}
                max={1000000}
                step={5000}
                className="[&_[role=slider]]:bg-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span>$1M</span>
              </div>
            </div>

            {/* Interest Rate & Term */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4 text-primary" />
                  {t("calc.interestRate")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={affordRate}
                    onChange={(e) => setAffordRate(Number(e.target.value) || 0)}
                    className="w-full text-end h-8"
                    min={0}
                    max={20}
                    step={0.1}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-primary" />
                  {t("calc.loanTerm")}
                </label>
                <div className="flex flex-wrap gap-1">
                  {[15, 20, 25, 30].map((term) => (
                    <Button
                      key={term}
                      variant={affordTerm === term ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAffordTerm(term)}
                      className={
                        affordTerm === term
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs px-2"
                          : "h-7 text-xs px-2"
                      }
                    >
                      {term}y
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        {/* Affordability Score Gauge */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4">{t("calc.affordabilityScore")}</h3>
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={gaugeRadius}
                  fill="none"
                  stroke={isDark ? "#374151" : "#e5e7eb"}
                  strokeWidth="12"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r={gaugeRadius}
                  fill="none"
                  stroke={scoreArcColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCircumference}
                  initial={{ strokeDashoffset: gaugeCircumference }}
                  animate={{ strokeDashoffset: gaugeOffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor}`}>{affordability.score}</span>
                <span className="text-sm text-muted-foreground">{t("calc.affordabilityScore")}</span>
              </div>
            </div>
            <Badge
              className={`mt-3 text-sm ${
                affordability.score >= 70
                  ? "bg-primary/10 text-primary"
                  : affordability.score >= 40
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {scoreLabel}
            </Badge>
          </CardContent>
        </Card>

        {/* Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-xl border-0 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">{t("calc.maxLoanAmount")}</p>
              <p className="text-3xl font-bold text-primary">
                <AnimatedNumber value={affordability.maxLoanAmount} prefix="$" />
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-xl border-0 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">{t("calc.maxPropertyPrice")}</p>
              <p className="text-3xl font-bold text-primary">
                <AnimatedNumber value={affordability.maxPropertyPrice} prefix="$" />
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommended EMI Range */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("calc.recommendedEMI")}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-primary font-medium">
                    {t("calc.comfortable")}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(affordability.comfortableEMI)}/mo</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(affordability.comfortableEMI / (monthlyIncome || 1)) * 100 * 3}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    {t("calc.stretch")}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(affordability.stretchEMI)}/mo</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(affordability.stretchEMI / (monthlyIncome || 1)) * 100 * 3}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
              <div className="mt-2 p-3 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">
                  {t("calc.availableForEMI")}:{" "}
                  <span className="font-semibold text-primary">
                    {formatCurrency(affordability.availableForEMI)}/mo
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {t("calc.tips")}
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-primary-foreground font-semibold rounded-xl text-base">
          <Shield className="w-5 h-5 me-2" />
          {t("calc.applyPreApproval")}
        </Button>
      </motion.div>
    </div>
  );
}
