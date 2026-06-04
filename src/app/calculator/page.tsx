import type { Metadata } from "next";
import { CalculatorPage } from "@/components/real-estate/calculator-page";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Mortgage Calculator - EstatePro",
  description:
    "Calculate your monthly mortgage payments with our free mortgage calculator. Adjust loan amount, interest rate, and term to plan your home purchase budget.",
  openGraph: {
    title: "Mortgage Calculator - EstatePro",
    description:
      "Calculate your monthly mortgage payments with our free and easy-to-use mortgage calculator.",
  },
};

export default function CalculatorRoute() {
  return (
    <PageShell>
      <CalculatorPage />
    </PageShell>
  );
}
