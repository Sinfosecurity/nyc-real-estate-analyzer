import { analyzeDeal } from '../calculations/analyze';
import type { Deal, DealAnalysis } from '../models';
import type { ReportBreakpoint } from './types';

function search(
  low: number,
  high: number,
  evaluate: (mid: number) => number,
  preferHigh: boolean,
): number | null {
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null;
  let lo = low;
  let hi = high;
  let found: number | null = null;
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    const metric = evaluate(mid);
    const ok = preferHigh ? metric >= 0 : metric <= 0;
    if (ok) {
      found = mid;
      if (preferHigh) lo = mid;
      else hi = mid;
    } else if (preferHigh) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return found;
}

export function reportBreakpoints(deal: Deal, analysis: DealAnalysis): ReportBreakpoint[] {
  const existingRate = analysis.breakpoints?.find((item) => item.unit === '%')?.value ?? null;
  const targetDscr = deal.assumptions.targetDscr;
  const targetCoc = deal.assumptions.minCashOnCash / 100;
  const asking = analysis.purchasePrice;

  const rentForDscr = search(0.4, 1.05, (multiplier) => {
    const next = analyzeDeal({
      ...deal,
      units: deal.units.map((unit) => ({
        ...unit,
        underwrittenMonthlyRent: unit.underwrittenMonthlyRent * multiplier,
        currentMonthlyRent: unit.currentMonthlyRent * multiplier,
        marketMonthlyRent: unit.marketMonthlyRent * multiplier,
      })),
    });
    return (next.dscr ?? 0) - targetDscr;
  }, true);

  const expenseForZeroCf = search(1, 4, (multiplier) => {
    const next = analyzeDeal({
      ...deal,
      expenses: deal.expenses.map((item) => ({
        ...item,
        annualAmount: item.annualAmount * multiplier,
        percentOfEgi: item.percentOfEgi * multiplier,
      })),
    });
    return next.cashFlowAnnual;
  }, true);

  const vacancyForDscr = search(0, 60, (vacancy) => {
    const next = analyzeDeal({
      ...deal,
      assumptions: { ...deal.assumptions, vacancyMode: 'combined', combinedVacancyPercent: vacancy },
    });
    return (next.dscr ?? 0) - targetDscr;
  }, true);

  const priceForCoc = asking > 0
    ? search(asking * 0.35, asking * 1.6, (price) => {
        const next = analyzeDeal({ ...deal, loan: { ...deal.loan, purchasePrice: price } });
        return (next.cashOnCash ?? -1) - targetCoc;
      }, true)
    : null;

  const priceForDscr = asking > 0
    ? search(asking * 0.35, asking * 1.6, (price) => {
        const next = analyzeDeal({ ...deal, loan: { ...deal.loan, purchasePrice: price } });
        return (next.dscr ?? 0) - targetDscr;
      }, true)
    : null;

  const rentForCf = search(0.5, 2.2, (multiplier) => {
    const next = analyzeDeal({
      ...deal,
      units: deal.units.map((unit) => ({
        ...unit,
        underwrittenMonthlyRent: unit.underwrittenMonthlyRent * multiplier,
        currentMonthlyRent: unit.currentMonthlyRent * multiplier,
        marketMonthlyRent: unit.marketMonthlyRent * multiplier,
      })),
    });
    return next.cashFlowMonthly;
  }, true);

  const currentMonthly = deal.units.reduce((sum, unit) => sum + unit.underwrittenMonthlyRent, 0);

  return [
    {
      kind: 'break',
      label: 'Interest rate where cash flow reaches $0',
      value: existingRate,
      unit: '%',
    },
    {
      kind: 'break',
      label: 'Rent level where DSCR falls to the user target',
      value: rentForDscr !== null ? rentForDscr * 100 : null,
      unit: '% of current underwritten rent',
    },
    {
      kind: 'break',
      label: 'Expense increase where cash flow reaches $0',
      value: expenseForZeroCf !== null ? (expenseForZeroCf - 1) * 100 : null,
      unit: '% above current expenses',
    },
    {
      kind: 'break',
      label: 'Maximum vacancy before DSCR falls to the user target',
      value: vacancyForDscr,
      unit: '%',
    },
    {
      kind: 'improve',
      label: 'Purchase price required for the target cash-on-cash',
      value: priceForCoc,
      unit: '$',
    },
    {
      kind: 'improve',
      label: 'Purchase price required for the target DSCR',
      value: priceForDscr,
      unit: '$',
    },
    {
      kind: 'improve',
      label: 'Monthly rent needed for break-even cash flow',
      value: rentForCf !== null ? currentMonthly * rentForCf : null,
      unit: '$/mo',
    },
  ];
}
