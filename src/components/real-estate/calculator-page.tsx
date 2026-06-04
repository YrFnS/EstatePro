"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Lightbulb,
  Gauge,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState, useCallback } from "react";
import { InvestmentCalculatorTab } from "@/components/real-estate/calc/investment-calculator-tab";
import { useTheme } from "next-themes";
import { calculateEMI, LOAN_TERMS } from "@/components/real-estate/types/mortgage-utils";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

interface ScenarioData {
  id: string;
  loanAmount: number;
  term: number;
  rate: number;
}

function generateAmortization(
  principal: number,
  annualRate: number,
  termYears: number
) {
  const monthlyRate = annualRate / 100 / 12;
  const { emi } = calculateEMI(principal, annualRate, termYears);
  const schedule = [];
  let balance = principal;

  for (let year = 1; year <= termYears; year++) {
    const openingBalance = balance;
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let month = 0; month < 12; month++) {
      if (balance <= 0) break;
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(emi - interestPayment, balance);
      yearPrincipal += principalPayment;
      yearInterest += interestPayment;
      balance -= principalPayment;
    }

    schedule.push({
      year,
      openingBalance: Math.round(openingBalance),
      emiPaid: Math.round(emi * 12),
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      closingBalance: Math.round(Math.max(balance, 0)),
    });
  }

  return schedule;
}

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

// ============ EMI Calculator Tab ============
function EMICalculatorTab() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);
  const [showSchedule, setShowSchedule] = useState(false);

  const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
  const loanAmount = propertyPrice - downPayment;

  const calculations = useMemo(
    () => calculateEMI(loanAmount, interestRate, loanTerm),
    [loanAmount, interestRate, loanTerm]
  );

  const amortization = useMemo(
    () => generateAmortization(loanAmount, interestRate, loanTerm),
    [loanAmount, interestRate, loanTerm]
  );

  const chartData = [
    { name: t("calc.principal"), value: loanAmount, color: "#059669" },
    { name: t("calc.interestPaid"), value: Math.round(calculations.totalInterest), color: "#14b8a6" },
  ].filter((d) => d.value > 0);

  const formatCurrency = useCallback((value: number) => `$${value.toLocaleString()}`, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Controls */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6 md:p-8 space-y-7">
            {/* Property Price */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {t("calc.propertyPrice")}
                </label>
                <Input
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value) || 0)}
                  className="w-36 text-end h-8"
                  min={0}
                  step={10000}
                />
              </div>
              <Slider
                value={[propertyPrice]}
                onValueChange={(v) => setPropertyPrice(v[0])}
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
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("calc.downPayment")}: {formatCurrency(downPayment)}
              </p>
            </div>

            {/* Loan Term - Visual Buttons */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                {t("calc.loanTerm")}
              </label>
              <div className="flex flex-wrap gap-2">
                {LOAN_TERMS.map((term) => (
                  <Button
                    key={term}
                    variant={loanTerm === term ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLoanTerm(term)}
                    className={
                      loanTerm === term
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "hover:bg-primary/10 dark:hover:bg-primary/10"
                    }
                  >
                    {term} {t("calc.years")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  {t("calc.interestRate")}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                    className="w-20 text-end h-8"
                    min={0}
                    max={30}
                    step={0.1}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={(v) => setInterestRate(v[0])}
                min={0}
                max={20}
                step={0.1}
                className="[&_[role=slider]]:bg-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>20%</span>
              </div>
              <p className="text-xs text-primary mt-1">
                💡 {t("calc.marketRateSuggestion")}: ~6.5%
              </p>
            </div>

            {/* Loan Amount Display */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">{t("calc.loanAmountDisplay")}</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(loanAmount)}
              </p>
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
        {/* Monthly EMI Card */}
        <Card className="rounded-2xl shadow-xl border-0 bg-primary text-primary-foreground">
          <CardContent className="p-6 md:p-8">
            <p className="text-primary-foreground/80 text-sm mb-2">{t("calc.monthlyEMI")}</p>
            <p className="text-3xl md:text-5xl font-bold mb-6">
              <AnimatedNumber value={Math.round(calculations.emi)} prefix="$" />
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-primary-foreground/80 text-xs">{t("calc.totalInterest")}</p>
                <p className="text-lg font-semibold">
                  <AnimatedNumber value={Math.round(calculations.totalInterest)} prefix="$" />
                </p>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-xs">{t("calc.totalPayable")}</p>
                <p className="text-lg font-semibold">
                  <AnimatedNumber value={Math.round(calculations.totalPayment)} prefix="$" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t("calc.principalVsInterest")}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#ffffff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      color: isDark ? "#f3f4f6" : "#111827",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Amortization Schedule */}
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center justify-between w-full text-start"
            >
              <h3 className="text-lg font-semibold">{t("calc.amortizationSchedule")}</h3>
              {showSchedule ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto custom-scrollbar mt-4">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="py-2 text-start text-muted-foreground font-medium">
                            {t("calc.year")}
                          </th>
                          <th className="py-2 text-end text-muted-foreground font-medium">
                            {t("calc.openingBalance")}
                          </th>
                          <th className="py-2 text-end text-muted-foreground font-medium">
                            {t("calc.emiPaid")}
                          </th>
                          <th className="py-2 text-end text-muted-foreground font-medium">
                            {t("calc.principalPaid")}
                          </th>
                          <th className="py-2 text-end text-muted-foreground font-medium">
                            {t("calc.closingBalance")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortization.map((row) => (
                          <tr key={row.year} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 text-start font-medium">{row.year}</td>
                            <td className="py-2 text-end">{formatCurrency(row.openingBalance)}</td>
                            <td className="py-2 text-end">{formatCurrency(row.emiPaid)}</td>
                            <td className="py-2 text-end text-primary">
                              {formatCurrency(row.principalPaid)}
                            </td>
                            <td className="py-2 text-end">{formatCurrency(row.closingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-primary-foreground font-semibold rounded-xl text-base">
          <Shield className="w-5 h-5 me-2" />
          {t("calc.applyPreApproval")}
        </Button>
      </motion.div>
    </div>
  );
}

// ============ Affordability Calculator Tab ============
function AffordabilityCalculatorTab() {
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
    const tipsList = [];
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

// ============ Comparison Tab ============
function ComparisonTab() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [scenarios, setScenarios] = useState<ScenarioData[]>([
    { id: "1", loanAmount: 400000, term: 30, rate: 6.5 },
    { id: "2", loanAmount: 400000, term: 15, rate: 6.0 },
    { id: "3", loanAmount: 500000, term: 30, rate: 7.0 },
  ]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const newId = String(Date.now());
    setScenarios([
      ...scenarios,
      { id: newId, loanAmount: 350000, term: 20, rate: 6.5 },
    ]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  const updateScenario = (id: string, field: keyof ScenarioData, value: number) => {
    setScenarios(scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const scenarioResults = useMemo(
    () =>
      scenarios.map((s) => ({
        ...s,
        ...calculateEMI(s.loanAmount, s.rate, s.term),
      })),
    [scenarios]
  );

  const chartData = useMemo(() => {
    return scenarioResults.map((s, i) => ({
      name: `${t("calc.scenarioLabel")} ${i + 1}`,
      emi: Math.round(s.emi),
      totalInterest: Math.round(s.totalInterest),
      totalCost: Math.round(s.totalPayment),
    }));
  }, [scenarioResults, t]);

  const formatCurrency = useCallback((value: number) => `$${value.toLocaleString()}`, []);

  const COLORS = ["#059669", "#14b8a6", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioResults.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="rounded-2xl shadow-xl border-0 h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {t("calc.scenarioLabel")} {index + 1}
                  </h3>
                  {scenarios.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScenario(scenario.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Loan Amount */}
                  <div>
                    <label className="text-xs text-muted-foreground">{t("calc.loanAmountDisplay")}</label>
                    <Input
                      type="number"
                      value={scenario.loanAmount}
                      onChange={(e) => updateScenario(scenario.id, "loanAmount", Number(e.target.value) || 0)}
                      className="h-8 text-end mt-1"
                      min={0}
                      step={10000}
                    />
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className="text-xs text-muted-foreground">{t("calc.loanTerm")}</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {LOAN_TERMS.map((term) => (
                        <Button
                          key={term}
                          variant={scenario.term === term ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateScenario(scenario.id, "term", term)}
                          className={
                            scenario.term === term
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground h-7 text-xs px-2"
                              : "h-7 text-xs px-2"
                          }
                        >
                          {term}y
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="text-xs text-muted-foreground">{t("calc.interestRate")}</label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={scenario.rate}
                        onChange={(e) => updateScenario(scenario.id, "rate", Number(e.target.value) || 0)}
                        className="h-8 text-end"
                        min={0}
                        max={20}
                        step={0.1}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Quick Results */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("calc.monthlyEMI")}</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(Math.round(scenario.emi))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("calc.totalInterest")}</span>
                      <span className="font-medium">
                        {formatCurrency(Math.round(scenario.totalInterest))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("calc.totalPayable")}</span>
                      <span className="font-medium">
                        {formatCurrency(Math.round(scenario.totalPayment))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Add Scenario Card */}
        {scenarios.length < 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button
              onClick={addScenario}
              className="w-full h-full min-h-[300px] rounded-2xl border-2 border-dashed border-primary/30 dark:border-primary/60 hover:border-primary dark:hover:border-primary flex flex-col items-center justify-center gap-3 text-primary hover:bg-primary/10/50 dark:hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium">{t("calc.addScenario")}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Comparison Chart */}
      <Card className="rounded-2xl shadow-xl border-0">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t("calc.comparisonChart")}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    color: isDark ? "#f3f4f6" : "#111827",
                  }}
                />
                <Legend />
                <Bar dataKey="emi" name={t("calc.compareEMI")} fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalInterest" name={t("calc.compareTotalInterest")} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCost" name={t("calc.compareTotalCost")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Side by side comparison table */}
      {scenarioResults.length >= 2 && (
        <Card className="rounded-2xl shadow-xl border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("calc.comparison")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-start text-muted-foreground font-medium">{t("calc.loanDetails")}</th>
                    {scenarioResults.map((s, i) => (
                      <th key={s.id} className="py-3 text-center font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {t("calc.scenarioLabel")} {i + 1}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-muted-foreground">{t("calc.loanAmountDisplay")}</td>
                    {scenarioResults.map((s) => (
                      <td key={s.id} className="py-3 text-center font-medium">
                        {formatCurrency(s.loanAmount)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-muted-foreground">{t("calc.loanTerm")}</td>
                    {scenarioResults.map((s) => (
                      <td key={s.id} className="py-3 text-center font-medium">
                        {s.term} {t("calc.years")}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-muted-foreground">{t("calc.interestRate")}</td>
                    {scenarioResults.map((s) => (
                      <td key={s.id} className="py-3 text-center font-medium">
                        {s.rate}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 bg-primary/5">
                    <td className="py-3 font-semibold text-primary">{t("calc.monthlyEMI")}</td>
                    {scenarioResults.map((s) => {
                      const isMin = Math.round(s.emi) === Math.min(...scenarioResults.map((r) => Math.round(r.emi)));
                      return (
                        <td key={s.id} className={`py-3 text-center font-bold ${isMin ? "text-primary" : ""}`}>
                          {formatCurrency(Math.round(s.emi))}
                          {isMin && scenarioResults.length > 1 && (
                            <Badge className="ms-2 bg-primary/10 text-primary text-[10px] px-1.5">
                              ✓
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-muted-foreground">{t("calc.totalInterest")}</td>
                    {scenarioResults.map((s) => {
                      const isMin = Math.round(s.totalInterest) === Math.min(...scenarioResults.map((r) => Math.round(r.totalInterest)));
                      return (
                        <td key={s.id} className={`py-3 text-center font-medium ${isMin ? "text-primary" : ""}`}>
                          {formatCurrency(Math.round(s.totalInterest))}
                          {isMin && scenarioResults.length > 1 && (
                            <Badge className="ms-2 bg-primary/10 text-primary text-[10px] px-1.5">
                              ✓
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">{t("calc.totalPayable")}</td>
                    {scenarioResults.map((s) => {
                      const isMin = Math.round(s.totalPayment) === Math.min(...scenarioResults.map((r) => Math.round(r.totalPayment)));
                      return (
                        <td key={s.id} className={`py-3 text-center font-medium ${isMin ? "text-primary" : ""}`}>
                          {formatCurrency(Math.round(s.totalPayment))}
                          {isMin && scenarioResults.length > 1 && (
                            <Badge className="ms-2 bg-primary/10 text-primary text-[10px] px-1.5">
                              ✓
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-primary-foreground font-semibold rounded-xl text-base">
        <Shield className="w-5 h-5 me-2" />
        {t("calc.applyPreApproval")}
      </Button>
    </div>
  );
}

// ============ Main Calculator Page ============
export function CalculatorPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("emi");

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Calculator className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("calculator.title")}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("calculator.subtitle")}</p>
        </motion.div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-8 h-12 rounded-xl bg-muted/50 p-1">
              <TabsTrigger
                value="emi"
                className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:dark:bg-primary/10 data-[state=active]:text-primary data-[state=active]:dark:text-primary data-[state=active]:shadow-sm font-medium text-sm"
              >
                <DollarSign className="w-4 h-4 me-2" />
                {t("calc.emiCalculator")}
              </TabsTrigger>
              <TabsTrigger
                value="affordability"
                className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:dark:bg-primary/10 data-[state=active]:text-primary data-[state=active]:dark:text-primary data-[state=active]:shadow-sm font-medium text-sm"
              >
                <Gauge className="w-4 h-4 me-2" />
                {t("calc.affordabilityCalculator")}
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:dark:bg-primary/10 data-[state=active]:text-primary data-[state=active]:dark:text-primary data-[state=active]:shadow-sm font-medium text-sm"
              >
                <TrendingUp className="w-4 h-4 me-2" />
                {t("calc.comparison")}
              </TabsTrigger>
              <TabsTrigger
                value="investment"
                className="rounded-lg data-[state=active]:bg-amber-500/10 data-[state=active]:dark:bg-amber-500/10 data-[state=active]:text-amber-600 data-[state=active]:dark:text-amber-400 data-[state=active]:shadow-sm font-medium text-sm"
              >
                <TrendingUp className="w-4 h-4 me-2" />
                {t("calc.investment.title")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emi">
              <EMICalculatorTab />
            </TabsContent>

            <TabsContent value="affordability">
              <AffordabilityCalculatorTab />
            </TabsContent>

            <TabsContent value="comparison">
              <ComparisonTab />
            </TabsContent>

            <TabsContent value="investment">
              <InvestmentCalculatorTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
