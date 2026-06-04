"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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
import { useTheme } from "next-themes";

import { calculateEMI, LOAN_TERMS } from "@/components/real-estate/types/mortgage-utils";
import { type ScenarioData } from "./calc-utils";

export function ComparisonTab() {
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
      scenarios.map((s) => {
        const result = calculateEMI(s.loanAmount, s.rate, s.term);
        return {
          ...s,
          emi: result.emi,
          totalInterest: result.totalInterest,
          totalPayable: result.totalPayment,
        };
      }),
    [scenarios]
  );

  const chartData = useMemo(() => {
    return scenarioResults.map((s, i) => ({
      name: `${t("calc.scenarioLabel")} ${i + 1}`,
      emi: Math.round(s.emi),
      totalInterest: Math.round(s.totalInterest),
      totalCost: Math.round(s.totalPayable),
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
                    <div
                      className="w-3 h-3 rounded-full"
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
                        {formatCurrency(Math.round(scenario.totalPayable))}
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
                      const isMin = Math.round(s.totalPayable) === Math.min(...scenarioResults.map((r) => Math.round(r.totalPayable)));
                      return (
                        <td key={s.id} className={`py-3 text-center font-medium ${isMin ? "text-primary" : ""}`}>
                          {formatCurrency(Math.round(s.totalPayable))}
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
