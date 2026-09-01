import { calculateMortgagePayment } from './financing';
import { calculateCashFlow } from './returns';

/** Interest rate at which cash flow is approximately zero, given fixed NOI and loan. */
export function interestRateAtZeroCashFlow(
  noi: number,
  loan: number,
  amortYears: number,
): number | null {
  if (loan <= 0 || noi <= 0) return null;
  let low = 0;
  let high = 40;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const cf = calculateCashFlow(noi, calculateMortgagePayment(loan, mid, amortYears) * 12);
    if (cf > 0) low = mid;
    else high = mid;
  }
  return high;
}
