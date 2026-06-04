/**
 * Calculator-specific utilities and types.
 * Shared across EMI, Affordability, and Comparison tab components.
 */

import { calculateEMI } from "@/components/real-estate/types/mortgage-utils";

/** Data for a single loan comparison scenario */
export interface ScenarioData {
  id: string;
  loanAmount: number;
  term: number;
  rate: number;
}

/**
 * Generate a yearly amortization schedule.
 * Aggregates monthly payment data into yearly summaries for table display.
 */
export function generateYearlyAmortization(
  principal: number,
  annualRate: number,
  termYears: number
) {
  const monthlyRate = annualRate / 100 / 12;
  const { emi } = calculateEMI(principal, annualRate, termYears);
  const schedule: Array<{
    year: number;
    openingBalance: number;
    emiPaid: number;
    principalPaid: number;
    interestPaid: number;
    closingBalance: number;
  }> = [];
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
