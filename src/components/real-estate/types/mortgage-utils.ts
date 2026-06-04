/**
 * Shared mortgage calculation utilities.
 * Used by calculator-page and property-detail-page.
 */

/** Standard loan terms in years */
export const LOAN_TERMS = [5, 10, 15, 20, 25, 30] as const;

/**
 * Calculate EMI (Equated Monthly Installment)
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (percentage, e.g. 5.5)
 * @param termYears - Loan term in years
 * @returns Object with emi, totalPayment, totalInterest
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  termYears: number
): { emi: number; totalPayment: number; totalInterest: number } {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) {
    return { emi: 0, totalPayment: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRate / 12 / 100;
  const numPayments = termYears * 12;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalPayment = emi * numPayments;
  const totalInterest = totalPayment - principal;

  return { emi, totalPayment, totalInterest };
}

/**
 * Simple monthly payment calculation for property detail display
 * Uses default 20% down, 6.5% rate, 30-year term
 */
export function calculateMonthlyPayment(price: number): number {
  const downPayment = price * 0.2;
  const loanAmount = price - downPayment;
  const { emi } = calculateEMI(loanAmount, 6.5, 30);
  return emi;
}
