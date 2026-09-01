import type { Deal, DealAnalysis } from '../models';
import { money, pct } from '../utils/format';
import { formatDscr } from './display';
import type { PricePosition, ReportReadiness, SupportItem } from './types';

export function executiveNarrative(_deal: Deal, analysis: DealAnalysis, readiness: ReportReadiness): string {
  const asking = analysis.purchasePrice;
  const maxOffer = analysis.maxOffer.conservative;
  const binding = analysis.maxOffer.bindingConstraint ?? 'the most restrictive underwriting constraint';
  const reasons = readiness.conflicts
    .filter((item) => item.severity === 'critical' || item.id === 'incomplete-opex')
    .map((item) => item.explanation.replace(/\.$/, ''))
    .slice(0, 2);
  const qualifier =
    readiness.reportClass === 'PRELIMINARY UNDERWRITING'
      ? `However, this analysis remains preliminary${reasons.length ? ` because ${reasons.join('; ').toLowerCase()}` : '.'}`
      : readiness.reportClass === 'DUE DILIGENCE UNDERWRITING'
        ? 'This analysis is suitable for due-diligence review, but official records, inspection, and remaining open items still need independent confirmation.'
        : 'Material financial inputs are complete enough for a final investment review, subject to independent verification of NYC records, title, and physical condition.';

  const priceClause =
    asking > 0
      ? `At the current ${money(asking)} asking price`
      : 'With no asking price entered';

  return `${priceClause}, the base-case underwriting produces approximately ${money(analysis.noi)} of NOI, ${money(analysis.cashFlowMonthly)} of monthly pre-tax cash flow, a ${formatDscr(analysis.dscr)} DSCR and a ${pct(analysis.cashOnCash)} cash-on-cash return. The conservative maximum offer is ${maxOffer !== null ? `approximately ${money(maxOffer)}` : 'not supportable on the current inputs'}, with ${binding.toLowerCase()} currently acting as the binding acquisition constraint. ${qualifier}`;
}

export function pricePosition(_deal: Deal, analysis: DealAnalysis): PricePosition {
  const asking = analysis.purchasePrice;
  const conservativeMax = analysis.maxOffer.conservative;
  const incomeValue = analysis.supportedValue;
  const difference = conservativeMax !== null && asking > 0 ? conservativeMax - asking : null;
  const differencePct = difference !== null && asking > 0 ? difference / asking : null;
  let insideRange: boolean | null = null;
  let explanation = 'An asking price has not been entered, so price position cannot be assessed.';
  if (asking > 0 && conservativeMax !== null) {
    insideRange = asking <= conservativeMax + 1;
    explanation = insideRange
      ? `The asking price sits ${money(Math.abs(difference ?? 0))} inside the conservative maximum offer. The current ask is within the investor's underwriting range.`
      : `The asking price is ${money(Math.abs(difference ?? 0))} above the conservative maximum offer. The current ask is outside the investor's underwriting range.`;
  }
  return { asking, conservativeMax, incomeValue, difference, differencePct, insideRange, explanation };
}

export function supportAndBreakItems(deal: Deal, analysis: DealAnalysis, readiness: ReportReadiness): SupportItem[] {
  const items: SupportItem[] = [];
  if (analysis.cashFlowAnnual > 0) items.push({ tone: 'support', text: 'Positive base-case cash flow' });
  if (analysis.dscr !== null && analysis.dscr >= deal.assumptions.targetDscr) {
    items.push({ tone: 'support', text: 'DSCR at or above the user target' });
  }
  if (analysis.supportedValue !== null && analysis.purchasePrice > 0 && analysis.supportedValue >= analysis.purchasePrice) {
    items.push({ tone: 'support', text: 'Asking price at or below income-approach value' });
  }
  if (analysis.cashOnCash !== null && analysis.cashOnCash * 100 >= deal.assumptions.minCashOnCash) {
    items.push({ tone: 'support', text: 'Cash-on-cash at or above the user target' });
  }
  if (analysis.maxOffer.conservative !== null && analysis.purchasePrice > 0 && analysis.purchasePrice <= analysis.maxOffer.conservative) {
    items.push({ tone: 'support', text: 'Asking price inside the conservative maximum offer' });
  }

  if (deal.property.legalUnitCount === 0 || deal.property.legalOccupancyFinding !== 'verified') {
    items.push({ tone: 'break', text: 'Legal unit count requires verification' });
  }
  if (!readiness.expense.complete) {
    items.push({ tone: 'break', text: 'Expense assumptions incomplete' });
  }
  if ((deal.comps?.length ?? 0) === 0) {
    items.push({ tone: 'break', text: 'Comparable sales not completed' });
  }
  const inspectionOpen = !deal.dueDiligence.some(
    (item) => /inspection/i.test(item.label) && ['verified', 'resolved'].includes(item.status),
  );
  if (inspectionOpen) items.push({ tone: 'break', text: 'Inspection not completed' });
  readiness.conflicts
    .filter((item) => item.severity === 'critical' && item.id !== 'incomplete-opex')
    .slice(0, 3)
    .forEach((item) => items.push({ tone: 'break', text: item.explanation }));
  if (analysis.cashFlowAnnual <= 0) items.push({ tone: 'break', text: 'Base-case cash flow is not positive' });

  const supports = items.filter((item) => item.tone === 'support').slice(0, 5);
  const breaks = items.filter((item) => item.tone === 'break').slice(0, 6);
  return [...supports, ...breaks];
}
