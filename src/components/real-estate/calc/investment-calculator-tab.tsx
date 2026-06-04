"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useCallback } from "react";
import { DollarSign, Percent, TrendingUp, Shield, Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { calculateEMI } from "@/components/real-estate/types/mortgage-utils";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="tabular-nums"
    >
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

export function InvestmentCalculatorTab() {
  const { t } = useI18n();
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(3000);
  const [annualAppreciation, setAnnualAppreciation] = useState(3);
  const [holdingPeriod, setHoldingPeriod] = useState(10);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [expenseRatio, setExpenseRatio] = useState(30);

  const downPayment = Math.round(purchasePrice * (downPaymentPercent / 100));
  const loanAmount = purchasePrice - downPayment;

  const results = useMemo(() => {
    const { emi } = calculateEMI(loanAmount, 6.5, 30);
    const monthlyMortgage = emi;

    const effectiveRent = monthlyRent * (1 - vacancyRate / 100);
    const monthlyExpenses = effectiveRent * (expenseRatio / 100);
    const monthlyCashFlow = effectiveRent - monthlyExpenses - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    const futureValue = purchasePrice * Math.pow(1 + annualAppreciation / 100, holdingPeriod);
    const totalAppreciation = futureValue - purchasePrice;
    const totalCashFlow = annualCashFlow * holdingPeriod;
    const totalROI = downPayment > 0 ? ((totalAppreciation + totalCashFlow) / downPayment) * 100 : 0;
    const capRate = purchasePrice > 0 ? ((effectiveRent * 12 - monthlyExpenses * 12) / purchasePrice) * 100 : 0;
    const cocReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    return {
      monthlyCashFlow: Math.round(monthlyCashFlow),
      annualCashFlow: Math.round(annualCashFlow),
      totalAppreciation: Math.round(totalAppreciation),
      futureValue: Math.round(futureValue),
      totalROI: Math.round(totalROI * 10) / 10,
      capRate: Math.round(capRate * 10) / 10,
      cocReturn: Math.round(cocReturn * 10) / 10,
      monthlyMortgage: Math.round(monthlyMortgage),
      totalCashFlow: Math.round(totalCashFlow),
    };
  }, [purchasePrice, downPaymentPercent, monthlyRent, annualAppreciation, holdingPeriod, vacancyRate, expenseRatio, loanAmount]);

  const formatCurrency = useCallback((value: number) => `$${value.toLocaleString()}`, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Controls */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6 md:p-8 space-y-7">
            {/* Purchase Price */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {t("calc.propertyPrice")}
                </label>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={10000}
                />
              </div>
              <Slider
                value={[purchasePrice]}
                onValueChange={(v) => setPurchasePrice(v[0])}
                min={50000}
                max={3000000}
                step={5000}
                className="[&_[role=slider]]:bg-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>$50K</span>
                <span>$3M</span>
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  {t("calc.downPayment")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-20 text-end h-8"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={(v) => setDownPaymentPercent(v[0])}
                min={0}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t("calc.downPayment")}: {formatCurrency(downPayment)}
              </p>
            </div>

            {/* Monthly Rent */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {t("calc.monthlyRent") || "Monthly Rent"}
                </label>
                <Input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={100}
                />
              </div>
              <Slider
                value={[monthlyRent]}
                onValueChange={(v) => setMonthlyRent(v[0])}
                min={0}
                max={20000}
                step={100}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>

            {/* Annual Appreciation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t("calc.annualAppreciation") || "Annual Appreciation"}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={annualAppreciation}
                    onChange={(e) => setAnnualAppreciation(Number(e.target.value) || 0)}
                    className="w-20 text-end h-8"
                    min={-10}
                    max={20}
                    step={0.5}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[annualAppreciation]}
                onValueChange={(v) => setAnnualAppreciation(v[0])}
                min={-5}
                max={15}
                step={0.5}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>

            {/* Holding Period */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">{t("calc.holdingPeriod") || "Holding Period"}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={holdingPeriod}
                    onChange={(e) => setHoldingPeriod(Number(e.target.value) || 1)}
                    className="w-20 text-end h-8"
                    min={1}
                    max={30}
                  />
                  <span className="text-sm text-muted-foreground">{t("calc.years")}</span>
                </div>
              </div>
              <Slider
                value={[holdingPeriod]}
                onValueChange={(v) => setHoldingPeriod(v[0])}
                min={1}
                max={30}
                step={1}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>

            {/* Vacancy & Expenses */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">{t("calc.vacancyRate") || "Vacancy Rate"}</label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(Number(e.target.value) || 0)}
                    className="h-8 text-end"
                    min={0}
                    max={30}
                    step={1}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("calc.expenseRatio") || "Expense Ratio"}</label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    value={expenseRatio}
                    onChange={(e) => setExpenseRatio(Number(e.target.value) || 0)}
                    className="h-8 text-end"
                    min={0}
                    max={60}
                    step={5}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
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
        {/* Monthly Cash Flow */}
        <Card className={`rounded-2xl shadow-xl border-0 ${results.monthlyCashFlow >= 0 ? "bg-primary text-primary-foreground" : "bg-red-600 text-white"}`}>
          <CardContent className="p-6 md:p-8">
            <p className="text-primary-foreground/80 text-sm mb-2">{t("calc.monthlyCashFlow") || "Monthly Cash Flow"}</p>
            <p className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedNumber value={results.monthlyCashFlow} prefix="$" />
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-primary-foreground/80 text-xs">{t("calc.annualCashFlow") || "Annual Cash Flow"}</p>
                <p className="text-lg font-semibold">
                  <AnimatedNumber value={results.annualCashFlow} prefix="$" />
                </p>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs">{t("calc.totalCashFlow") || "Total Cash Flow"}</p>
                <p className="text-lg font-semibold">
                  <AnimatedNumber value={results.totalCashFlow} prefix="$" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl shadow-xl border-0 bg-primary/5">
            <CardContent className="p-5 text-center">
              <Calculator className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("calc.capRate") || "Cap Rate"}</p>
              <p className="text-2xl font-bold text-primary">{results.capRate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-xl border-0 bg-primary/5">
            <CardContent className="p-5 text-center">
              <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("calc.cocReturn") || "Cash on Cash"}</p>
              <p className="text-2xl font-bold text-primary">{results.cocReturn}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-xl border-0 bg-primary/5">
            <CardContent className="p-5 text-center">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("calc.totalROI") || "Total ROI"}</p>
              <p className="text-2xl font-bold text-primary">{results.totalROI}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Appreciation */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("calc.appreciationProjection") || "Appreciation Projection"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("calc.currentValue") || "Current Value"}</p>
                <p className="text-xl font-bold">{formatCurrency(purchasePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("calc.futureValue") || `Value in ${holdingPeriod} yrs`}</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(results.futureValue)}</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">
                {t("calc.totalAppreciation") || "Total Appreciation"}:{" "}
                <span className="font-semibold text-primary">{formatCurrency(results.totalAppreciation)}</span>
              </p>
            </div>
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
