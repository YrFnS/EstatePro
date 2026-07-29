"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Calculator,
  CalendarRange,
  CheckCircle2,
  DollarSign,
  Gauge,
  Home,
  Percent,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { calculateEMI, LOAN_TERMS } from "@/components/real-estate/types/mortgage-utils";
import { InvestmentCalculatorTab } from "@/components/real-estate/calc/investment-calculator-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AmortizationRow {
  year: number;
  openingBalance: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

function safeNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

function buildAmortization(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationRow[] {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateEMI(principal, annualRate, termYears).emi;
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let year = 1; year <= termYears && balance > 0.01; year += 1) {
    const openingBalance = balance;
    let principalPaid = 0;
    let interestPaid = 0;
    let payment = 0;

    for (let month = 0; month < 12 && balance > 0.01; month += 1) {
      const interest = balance * monthlyRate;
      const principalPart = Math.min(Math.max(0, monthlyPayment - interest), balance);
      const actualPayment = interest + principalPart;
      interestPaid += interest;
      principalPaid += principalPart;
      payment += actualPayment;
      balance = Math.max(0, balance - principalPart);
    }

    rows.push({
      year,
      openingBalance,
      payment,
      principalPaid,
      interestPaid,
      closingBalance: balance,
    });
  }

  return rows;
}

function reverseLoanAmount(
  monthlyPayment: number,
  annualRate: number,
  termYears: number
): number {
  if (monthlyPayment <= 0 || termYears <= 0) return 0;
  const paymentCount = termYears * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate <= 0) return monthlyPayment * paymentCount;
  return (
    monthlyPayment *
    ((Math.pow(1 + monthlyRate, paymentCount) - 1) /
      (monthlyRate * Math.pow(1 + monthlyRate, paymentCount)))
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MortgageTab() {
  const { t, locale } = useI18n();
  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const [propertyPrice, setPropertyPrice] = useState(500_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState<number>(30);

  const downPayment = propertyPrice * (downPaymentPercent / 100);
  const principal = Math.max(0, propertyPrice - downPayment);
  const results = useMemo(
    () => calculateEMI(principal, interestRate, termYears),
    [interestRate, principal, termYears]
  );
  const amortization = useMemo(
    () => buildAmortization(principal, interestRate, termYears),
    [interestRate, principal, termYears]
  );
  const principalShare = results.totalPayment
    ? Math.min(100, (principal / results.totalPayment) * 100)
    : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {label("calc.loanDetails", "Loan details")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="property-price">{label("calc.propertyPrice", "Property price")}</Label>
              <Input
                id="property-price"
                type="number"
                min={10_000}
                max={100_000_000}
                value={propertyPrice}
                onChange={(event) =>
                  setPropertyPrice(Math.max(0, safeNumber(event.target.value)))
                }
                className="w-40 text-end"
              />
            </div>
            <Slider
              value={[propertyPrice]}
              min={50_000}
              max={3_000_000}
              step={5_000}
              onValueChange={(value) => setPropertyPrice(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$50K</span><span>$3M</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="down-payment">{label("calc.downPayment", "Down payment")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="down-payment"
                  type="number"
                  min={0}
                  max={100}
                  value={downPaymentPercent}
                  onChange={(event) =>
                    setDownPaymentPercent(
                      Math.min(100, Math.max(0, safeNumber(event.target.value)))
                    )
                  }
                  className="w-24 text-end"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Slider
              value={[downPaymentPercent]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setDownPaymentPercent(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              {currency(downPayment, locale)} {label("calc.paidUpfront", "paid upfront")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="interest-rate">{label("calc.interestRate", "Interest rate")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="interest-rate"
                  type="number"
                  min={0.1}
                  max={30}
                  step={0.1}
                  value={interestRate}
                  onChange={(event) =>
                    setInterestRate(
                      Math.min(30, Math.max(0.1, safeNumber(event.target.value, 0.1)))
                    )
                  }
                  className="w-24 text-end"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Slider
              value={[interestRate]}
              min={0.1}
              max={20}
              step={0.1}
              onValueChange={(value) => setInterestRate(value[0])}
            />
          </div>

          <div className="space-y-3">
            <Label>{label("calc.loanTerm", "Loan term")}</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-3">
              {LOAN_TERMS.map((term) => (
                <Button
                  type="button"
                  key={term}
                  variant={termYears === term ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTermYears(term)}
                >
                  {term} {label("calc.yearsShort", "yr")}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label("calc.loanAmountDisplay", "Loan amount")}</span>
              <strong>{currency(principal, locale)}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="p-7 md:p-8">
            <p className="text-sm text-primary-foreground/75">
              {label("calc.monthlyEMI", "Estimated monthly payment")}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              {currency(results.emi, locale)}
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-primary-foreground/65">{label("calc.principal", "Principal")}</p>
                <p className="mt-1 font-semibold">{currency(principal, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/65">{label("calc.totalInterest", "Total interest")}</p>
                <p className="mt-1 font-semibold">{currency(results.totalInterest, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/65">{label("calc.totalPayable", "Total payable")}</p>
                <p className="mt-1 font-semibold">{currency(results.totalPayment, locale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{label("calc.principalVsInterest", "Principal vs interest")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {principalShare.toFixed(0)}% {label("calc.principalShare", "of total payments is principal")}
                </p>
              </div>
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <Progress value={principalShare} className="mt-5 h-3" />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{label("calc.principal", "Principal")}</span>
              <span>{label("calc.interestPaid", "Interest")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarRange className="h-5 w-5 text-primary" />
              {label("calc.amortizationSchedule", "Annual amortization")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[360px] overflow-auto rounded-xl border">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-muted-foreground">
                    <th className="p-3 text-start font-medium">{label("calc.year", "Year")}</th>
                    <th className="p-3 text-end font-medium">{label("calc.openingBalance", "Opening")}</th>
                    <th className="p-3 text-end font-medium">{label("calc.emiPaid", "Payments")}</th>
                    <th className="p-3 text-end font-medium">{label("calc.principalPaid", "Principal")}</th>
                    <th className="p-3 text-end font-medium">{label("calc.interestPaid", "Interest")}</th>
                    <th className="p-3 text-end font-medium">{label("calc.closingBalance", "Closing")}</th>
                  </tr>
                </thead>
                <tbody>
                  {amortization.map((row) => (
                    <tr key={row.year} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.year}</td>
                      <td className="p-3 text-end">{currency(row.openingBalance, locale)}</td>
                      <td className="p-3 text-end">{currency(row.payment, locale)}</td>
                      <td className="p-3 text-end text-primary">{currency(row.principalPaid, locale)}</td>
                      <td className="p-3 text-end">{currency(row.interestPaid, locale)}</td>
                      <td className="p-3 text-end">{currency(row.closingBalance, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AffordabilityTab() {
  const { t, locale } = useI18n();
  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const [monthlyIncome, setMonthlyIncome] = useState(12_000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3_000);
  const [existingDebt, setExistingDebt] = useState(500);
  const [downPayment, setDownPayment] = useState(100_000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState<number>(30);

  const result = useMemo(() => {
    const grossHousingBudget = monthlyIncome * 0.35;
    const availablePayment = Math.max(
      0,
      Math.min(grossHousingBudget, monthlyIncome - monthlyExpenses - existingDebt)
    );
    const loanAmount = reverseLoanAmount(availablePayment, interestRate, termYears);
    const propertyPrice = loanAmount + Math.max(0, downPayment);
    const debtRatio = monthlyIncome
      ? ((existingDebt + availablePayment) / monthlyIncome) * 100
      : 100;
    const score = Math.max(0, Math.min(100, 100 - Math.max(0, debtRatio - 28) * 2.5));
    return { availablePayment, loanAmount, propertyPrice, debtRatio, score };
  }, [downPayment, existingDebt, interestRate, monthlyExpenses, monthlyIncome, termYears]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            {label("calc.affordabilityInputs", "Your monthly finances")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {[
            {
              id: "monthly-income",
              label: label("calc.monthlyIncome", "Monthly income"),
              value: monthlyIncome,
              setValue: setMonthlyIncome,
            },
            {
              id: "monthly-expenses",
              label: label("calc.monthlyExpenses", "Monthly expenses"),
              value: monthlyExpenses,
              setValue: setMonthlyExpenses,
            },
            {
              id: "existing-debt",
              label: label("calc.existingEMIs", "Existing debt payments"),
              value: existingDebt,
              setValue: setExistingDebt,
            },
            {
              id: "available-down-payment",
              label: label("calc.downPaymentAvailable", "Available down payment"),
              value: downPayment,
              setValue: setDownPayment,
            },
          ].map((field) => (
            <div className="space-y-2" key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              <div className="relative">
                <DollarSign className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={field.id}
                  type="number"
                  min={0}
                  value={field.value}
                  onChange={(event) =>
                    field.setValue(Math.max(0, safeNumber(event.target.value)))
                  }
                  className="ps-9"
                />
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="affordability-rate">{label("calc.interestRate", "Interest rate")}</Label>
            <Input
              id="affordability-rate"
              type="number"
              min={0.1}
              max={30}
              step={0.1}
              value={interestRate}
              onChange={(event) =>
                setInterestRate(Math.max(0.1, safeNumber(event.target.value, 0.1)))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{label("calc.loanTerm", "Loan term")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 20, 30].map((term) => (
                <Button
                  type="button"
                  size="sm"
                  key={term}
                  variant={termYears === term ? "default" : "outline"}
                  onClick={() => setTermYears(term)}
                >
                  {term} yr
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={Home}
            label={label("calc.maxPropertyPrice", "Estimated property budget")}
            value={currency(result.propertyPrice, locale)}
          />
          <MetricCard
            icon={Banknote}
            label={label("calc.maxLoanAmount", "Estimated loan amount")}
            value={currency(result.loanAmount, locale)}
          />
          <MetricCard
            icon={DollarSign}
            label={label("calc.comfortableEMI", "Comfortable monthly payment")}
            value={currency(result.availablePayment, locale)}
          />
          <MetricCard
            icon={Percent}
            label={label("calc.debtRatio", "Estimated debt ratio")}
            value={`${result.debtRatio.toFixed(1)}%`}
          />
        </div>

        <Card className="rounded-3xl border-border/70 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{label("calc.affordabilityScore", "Affordability score")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.score >= 70
                    ? label("calc.comfortable", "Comfortable based on the entered budget")
                    : result.score >= 40
                      ? label("calc.stretch", "Possible, but the monthly budget is tight")
                      : label("calc.overBudget", "Consider a lower price or larger down payment")}
                </p>
              </div>
              <Badge variant={result.score >= 70 ? "default" : "secondary"} className="rounded-full">
                {Math.round(result.score)}/100
              </Badge>
            </div>
            <Progress value={result.score} className="mt-5 h-3" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{label("calc.budgetReminder", "Keep an emergency reserve outside the down payment.")}</span>
              </div>
              <div className="flex gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{label("calc.rateReminder", "Compare lender rates and closing costs before deciding.")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CalculatorPage() {
  const { t } = useI18n();
  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1">
          <Calculator className="me-1 h-3.5 w-3.5" />
          {label("calc.financialTools", "Property finance tools")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t("common.calculator")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {label(
            "calc.subtitle",
            "Estimate monthly payments, understand affordability, and evaluate property investments."
          )}
        </p>
      </div>

      <Tabs defaultValue="mortgage" className="space-y-8">
        <TabsList className="mx-auto grid h-auto w-full max-w-2xl grid-cols-3 rounded-2xl p-1">
          <TabsTrigger value="mortgage" className="gap-2 rounded-xl py-2.5">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{label("calc.mortgage", "Mortgage")}</span>
          </TabsTrigger>
          <TabsTrigger value="affordability" className="gap-2 rounded-xl py-2.5">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">{label("calc.affordability", "Affordability")}</span>
          </TabsTrigger>
          <TabsTrigger value="investment" className="gap-2 rounded-xl py-2.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{label("calc.investment", "Investment")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mortgage"><MortgageTab /></TabsContent>
        <TabsContent value="affordability"><AffordabilityTab /></TabsContent>
        <TabsContent value="investment"><InvestmentCalculatorTab /></TabsContent>
      </Tabs>

      <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
        {label(
          "calc.disclaimer",
          "These estimates are for planning only and do not constitute lending or financial advice."
        )}
      </p>
    </div>
  );
}
