import type { CalculationTrace, MaxOfferBreakdown } from '../models';
import { calculateMortgagePayment, loanFromPayment } from './financing';
import { calculateCashOnCash, calculateMaxDebtService, calculateSupportedValue } from './returns';
import { finite } from './safe';

export function calculateSupportedLoan(
  noi: number,
  targetDscr: number,
  annualRatePercent: number,
  amortizationYears: number,
): number {
  const maxDebt = calculateMaxDebtService(noi, targetDscr);
  if (maxDebt === null) return 0;
  return loanFromPayment(maxDebt / 12, annualRatePercent, amortizationYears);
}

function binarySearchMaxPrice(
  evaluate: (price: number) => boolean,
  highBound: number,
): number | null {
  if (highBound <= 0) return null;
  let low = 0;
  let high = highBound;
  if (!evaluate(high)) {
    let probe = high;
    let found = false;
    for (let i = 0; i < 40; i += 1) {
      probe /= 2;
      if (evaluate(probe)) {
        high = probe;
        found = true;
        break;
      }
      if (probe < 1) break;
    }
    if (!found) return evaluate(0) ? 0 : null;
  } else {
    let raised = high;
    for (let i = 0; i < 8; i += 1) {
      const next = raised * 2;
      if (!evaluate(next)) break;
      raised = next;
    }
    high = raised;
  }

  for (let i = 0; i < 48; i += 1) {
    const mid = (low + high) / 2;
    if (evaluate(mid)) low = mid;
    else high = mid;
  }
  return low > 0 ? low : evaluate(0) ? 0 : null;
}

export interface MaxOfferInput {
  noi: number;
  targetCapRate: number;
  targetDscr: number;
  minCashOnCashPercent: number;
  maxLtvPercent: number;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  closingAndOtherCash: number;
  pointsPercent: number;
  lenderFees: number;
  maxCashToInvest: number | null;
  plannedLtv: number;
  renovationAndBasis?: number;
}

/**
 * Maximum offer by each constraint. Conservative offer is the most restrictive
 * applicable (lowest) value. NOI is treated as independent of purchase price,
 * matching the original underwriting model.
 */
export function calculateMaxOffer(input: MaxOfferInput): MaxOfferBreakdown {
  const traces: CalculationTrace[] = [];
  const targetCap = finite(input.targetCapRate);
  const byCapRate = calculateSupportedValue(input.noi, targetCap);

  traces.push({
    title: 'Maximum Offer by Cap Rate',
    lines: [
      { label: 'NOI', value: input.noi, operator: '÷' },
      { label: 'Target Cap Rate', value: targetCap, operator: '=', isPercent: true },
    ],
    resultLabel: 'Supported Value / Max Offer by Cap Rate',
    result: byCapRate,
    note: 'Price = NOI ÷ target cap rate. Independent of financing.',
  });

  const supportedLoan = calculateSupportedLoan(
    input.noi,
    input.targetDscr,
    input.interestRate,
    input.amortizationYears,
  );
  const plannedLtv = Math.min(1, Math.max(0, finite(input.plannedLtv)));
  const byDscr = plannedLtv > 0 ? supportedLoan / plannedLtv : null;

  traces.push({
    title: 'Maximum Offer by DSCR',
    lines: [
      { label: 'NOI', value: input.noi, operator: '÷' },
      { label: 'User DSCR target', value: input.targetDscr, operator: '=' },
      { label: 'Maximum annual debt service', value: calculateMaxDebtService(input.noi, input.targetDscr) },
      { label: 'DSCR-supported loan', value: supportedLoan, operator: '÷' },
      { label: 'Planned LTV', value: plannedLtv * 100, isPercent: true, operator: '=' },
    ],
    resultLabel: 'Max Offer by DSCR',
    result: byDscr,
    note: 'Price = DSCR-supported loan ÷ planned LTV (from down-payment structure).',
  });

  const maxLtv = Math.min(1, Math.max(0, finite(input.maxLtvPercent) / 100));
  const byFinancingLtv = maxLtv > 0 ? supportedLoan / maxLtv : null;
  let byFinancingCash: number | null = null;
  if (input.maxCashToInvest !== null && input.maxCashToInvest > 0 && plannedLtv < 1) {
    const downPct = 1 - plannedLtv;
    const cashForDown = Math.max(0, input.maxCashToInvest - input.closingAndOtherCash);
    byFinancingCash = downPct > 0 ? cashForDown / downPct : null;
  }
  const financingCandidates = [byFinancingLtv, byFinancingCash].filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  const byFinancing = financingCandidates.length > 0 ? Math.min(...financingCandidates) : byFinancingLtv;

  traces.push({
    title: 'Maximum Offer by Financing',
    lines: [
      { label: 'DSCR-supported loan', value: supportedLoan, operator: '÷' },
      { label: 'Maximum LTV (user assumption)', value: maxLtv * 100, isPercent: true, operator: '=' },
      { label: 'Price at max LTV', value: byFinancingLtv },
      { label: 'Cash-budget price cap', value: byFinancingCash },
    ],
    resultLabel: 'Max Offer by Financing',
    result: byFinancing,
    note: 'Uses the more restrictive of (supported loan ÷ max LTV) and any stated cash budget.',
  });

  const minCoc = finite(input.minCashOnCashPercent) / 100;
  const extraCash = finite(input.closingAndOtherCash) + finite(input.lenderFees);
  const highBound = Math.max(byCapRate ?? 0, byDscr ?? 0, input.noi * 50, 1);

  const byCashOnCash = binarySearchMaxPrice((price) => {
    if (price < 0) return false;
    const loan = price * plannedLtv;
    const payment = calculateMortgagePayment(loan, input.interestRate, input.amortizationYears);
    const debt = payment * 12;
    const cashFlow = input.noi - debt;
    const points = loan * (finite(input.pointsPercent) / 100);
    const cash = price * (1 - plannedLtv) + extraCash + points;
    const coc = calculateCashOnCash(cashFlow, cash);
    if (coc === null) return false;
    return coc + 1e-12 >= minCoc;
  }, highBound || 1);

  traces.push({
    title: 'Maximum Offer by Cash-on-Cash',
    lines: [
      { label: 'NOI', value: input.noi },
      { label: 'Minimum CoC (user target)', value: input.minCashOnCashPercent, isPercent: true },
      { label: 'Planned LTV', value: plannedLtv * 100, isPercent: true },
    ],
    resultLabel: 'Max Offer by CoC',
    result: byCashOnCash,
    note: 'Solved for the highest price where CoC still meets the user target, given planned leverage and cash to close.',
  });

  const byLtv = byFinancingLtv;
  const byAvailableCash = byFinancingCash;
  const byRenovationBasis =
    input.renovationAndBasis && input.renovationAndBasis > 0
      ? Math.max(0, (byCapRate ?? 0) - input.renovationAndBasis)
      : null;

  const applicable = [
    { name: 'Cap Rate', value: byCapRate },
    { name: 'DSCR', value: byDscr },
    { name: 'Cash-on-Cash', value: byCashOnCash },
    { name: 'LTV', value: byLtv },
    { name: 'Available Cash', value: byAvailableCash },
    { name: 'Renovation / Basis', value: byRenovationBasis },
    { name: 'Financing', value: byFinancing },
  ].filter((row) => row.value !== null && Number.isFinite(row.value) && (row.value as number) >= 0);

  let conservative: number | null = null;
  let bindingConstraint: string | null = null;
  for (const row of applicable) {
    const value = row.value as number;
    if (conservative === null || value < conservative) {
      conservative = value;
      bindingConstraint = row.name;
    }
  }

  traces.push({
    title: 'Conservative Maximum Offer',
    lines: applicable.map((row, index) => ({
      label: `Max by ${row.name}`,
      value: row.value,
      operator: index === applicable.length - 1 ? '=' : undefined,
    })),
    resultLabel: 'Most restrictive applicable constraint',
    result: conservative,
    note: bindingConstraint
      ? `Binding constraint: ${bindingConstraint}. This is a screening ceiling, not an offer recommendation.`
      : 'No applicable constraint produced a finite offer.',
  });

  return {
    byCapRate,
    byDscr,
    byCashOnCash,
    byFinancing,
    byLtv,
    byAvailableCash,
    byRenovationBasis,
    conservative,
    bindingConstraint,
    traces,
  };
}
