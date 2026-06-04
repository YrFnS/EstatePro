"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Percent,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState, useCallback } from "react";
import { useTheme } from "next-themes";

import { fadeUp } from "@/components/real-estate/types/animations";
import { calculateEMI, LOAN_TERMS } from "@/components/real-estate/types/mortgage-utils";
import { generateYearlyAmortization } from "./calc-utils";
import { AnimatedNumber } from "./animated-number";

export function EMICalculatorTab() {
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
    () => generateYearlyAmortization(loanAmount, interestRate, loanTerm),
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
