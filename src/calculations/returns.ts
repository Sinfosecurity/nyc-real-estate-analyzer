import { finite, safeDivide } from './safe';

/** Cap Rate = NOI ÷ Purchase Price */
export function calculateCapRate(noi: number, purchasePrice: number): number | null {
  return safeDivide(noi, purchasePrice);
}

/** GRM = Purchase Price ÷ GRI */
export function calculateGRM(purchasePrice: number, gri: number): number | null {
  return safeDivide(purchasePrice, gri);
}

/** Cash Flow = NOI − Debt Service */
export function calculateCashFlow(noi: number, annualDebtService: number): number {
  return finite(noi) - finite(annualDebtService);
}

/** CoC = Annual Pre-Tax Cash Flow ÷ Total Cash Invested */
export function calculateCashOnCash(cashFlow: number, totalCashInvested: number): number | null {
  return safeDivide(cashFlow, totalCashInvested);
}

/** DSCR = NOI ÷ Annual Debt Service. Null when there is no debt service. */
export function calculateDSCR(noi: number, annualDebtService: number): number | null {
  return safeDivide(noi, annualDebtService);
}

/** Debt Yield = NOI ÷ Loan Amount */
export function calculateDebtYield(noi: number, loanAmount: number): number | null {
  return safeDivide(noi, loanAmount);
}

/**
 * SIMPLIFIED break-even occupancy (original calculator).
 * (Operating Expenses + Annual Debt Service) ÷ (GRI + Other Legal Income)
 * Treats all operating expenses as occupancy-independent. Labeled as simplified
 * because percent-of-EGI and other variable costs are not isolated.
 */
export function calculateBreakEvenOccupancy(
  operatingExpenses: number,
  annualDebtService: number,
  gri: number,
  otherLegalIncome: number,
): number | null {
  const potential = finite(gri) + finite(otherLegalIncome);
  return safeDivide(finite(operatingExpenses) + finite(annualDebtService), potential);
}

/**
 * Contribution-margin break-even occupancy.
 * Fixed Costs ÷ (Gross Potential Income × (1 − Variable Expense Ratio))
 * Fixed costs = fixed operating expenses + required debt service.
 * Variable expense ratio = variable operating expenses ÷ GPI.
 */
export function calculateContributionBreakEvenOccupancy(
  fixedOperatingExpenses: number,
  annualDebtService: number,
  grossPotentialIncome: number,
  variableOperatingExpenses: number,
): number | null {
  const gpi = finite(grossPotentialIncome);
  if (gpi <= 0) return null;
  const variableRatio = finite(variableOperatingExpenses) / gpi;
  const denominator = gpi * (1 - variableRatio);
  return safeDivide(finite(fixedOperatingExpenses) + finite(annualDebtService), denominator);
}

export function calculateBreakEvenRevenue(
  operatingExpenses: number,
  annualDebtService: number,
): number {
  return finite(operatingExpenses) + finite(annualDebtService);
}

/** Equity = Property Value − Outstanding Debt */
export function calculateEquity(propertyValue: number, outstandingDebt: number): number {
  return finite(propertyValue) - finite(outstandingDebt);
}

export function calculatePricePerUnit(
  purchasePrice: number,
  unitCount: number,
): number | null {
  return safeDivide(purchasePrice, unitCount);
}

export function calculatePricePerSqft(
  purchasePrice: number,
  squareFootage: number,
): number | null {
  return safeDivide(purchasePrice, squareFootage);
}

export function calculateSupportedValue(noi: number, targetCapRatePercent: number): number | null {
  const rate = finite(targetCapRatePercent);
  if (rate <= 0) return null;
  return safeDivide(noi, rate / 100);
}

export function calculateMaxDebtService(noi: number, targetDscr: number): number | null {
  const dscr = finite(targetDscr);
  if (dscr <= 0) return null;
  return Math.max(0, finite(noi) / dscr);
}

export function percentOf(part: number, whole: number): number | null {
  const ratio = safeDivide(part, whole);
  return ratio === null ? null : ratio * 100;
}
