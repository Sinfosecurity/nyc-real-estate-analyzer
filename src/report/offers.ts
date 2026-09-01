import { analyzeDeal } from '../calculations/analyze';
import type { Deal, DealAnalysis } from '../models';
import type { OfferScenarioRow } from './types';

export function populatedOfferScenarios(deal: Deal, analysis: DealAnalysis): OfferScenarioRow[] {
  const asking = deal.offerPrices?.asking && deal.offerPrices.asking > 0
    ? deal.offerPrices.asking
    : deal.loan.purchasePrice;
  const raw = [
    { key: 'asking', label: 'Asking price', price: asking },
    { key: 'target', label: 'Target offer', price: deal.offerPrices?.target ?? 0 },
    { key: 'conservative', label: 'Conservative max offer', price: analysis.maxOffer.conservative ?? 0 },
    { key: 'custom', label: 'Custom offer', price: deal.offerPrices?.custom ?? 0 },
  ];
  const seen = new Set<string>();
  const unique = raw.filter((row) => {
    if (!Number.isFinite(row.price) || row.price <= 0) return false;
    const token = `${row.key}:${Math.round(row.price)}`;
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });

  return unique.map((row) => {
    const scenario = analyzeDeal({
      ...deal,
      loan: { ...deal.loan, purchasePrice: row.price },
    });
    return {
      key: row.key,
      label: row.label,
      price: row.price,
      downPayment: scenario.downPayment,
      loan: scenario.loanAmount,
      cashRequired: scenario.totalCashInvested,
      noi: scenario.noi,
      capRate: scenario.capRate,
      dscr: scenario.dscr,
      cashFlowMonthly: scenario.cashFlowMonthly,
      cashOnCash: scenario.cashOnCash,
      vsAsking: asking > 0 ? row.price - asking : null,
    };
  });
}
