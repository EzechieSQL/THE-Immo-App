/**
 * Utility functions for real estate financial calculations.
 * These functions are pure and can be tested independently.
 */

/**
 * Parse a string or number to a valid number, handling commas as decimal separators.
 */
export function parseNumber(value: string | number | null): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(String(value).replace(',', '.')) || 0;
}

/**
 * Calculate monthly loan payment using the amortization formula.
 * @param principal - Total loan amount (price + fees)
 * @param annualRate - Annual interest rate as a percentage (e.g., 3.5 for 3.5%)
 * @param years - Loan duration in years
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;

  if (monthlyRate === 0) {
    return principal / n;
  }

  const payment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
  return payment;
}

/**
 * Calculate DSCR (Debt Service Coverage Ratio).
 * DSCR = Annual NOI / Annual Debt Service
 * @param monthlyRent - Monthly rental income
 * @param monthlyExpenses - Monthly operating expenses (excluding debt service)
 * @param monthlyDebtPayment - Monthly loan payment (principal + interest)
 * @returns DSCR value
 */
export function calculateDSCR(
  monthlyRent: number,
  monthlyExpenses: number,
  monthlyDebtPayment: number
): number {
  if (monthlyDebtPayment <= 0) return 0;

  const monthlyNOI = monthlyRent - monthlyExpenses;
  const annualNOI = monthlyNOI * 12;
  const annualDebt = monthlyDebtPayment * 12;

  return annualNOI / annualDebt;
}

/**
 * Get DSCR interpretation message.
 */
export function getDSCRMessage(dscr: number): string {
  if (dscr < 1) {
    return "DSCR < 1 : le projet ne couvre pas ses mensualités. C'est tendu, voire dangereux.";
  }
  if (dscr < 1.2) {
    return '1 ≤ DSCR < 1,2 : le projet passe, mais la marge de sécurité est faible.';
  }
  return 'DSCR ≥ 1,2 : le projet est plutôt confortable côté capacité de remboursement.';
}
