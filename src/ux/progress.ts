import { isBaseCaseUnit } from '../calculations/income';
import type { Deal, DealAnalysis } from '../models';

export const GUIDE_STEPS = [
  { id: 'property', path: '/guide/property', label: 'Property', short: 'Property' },
  { id: 'records', path: '/guide/records', label: 'Records', short: 'Records' },
  { id: 'income', path: '/guide/income', label: 'Rent', short: 'Rent' },
  { id: 'expenses', path: '/guide/expenses', label: 'Expenses', short: 'Expenses' },
  { id: 'financing', path: '/guide/financing', label: 'Financing', short: 'Financing' },
  { id: 'analysis', path: '/guide/analysis', label: 'Analysis', short: 'Analysis' },
  { id: 'diligence', path: '/guide/diligence', label: 'Due Diligence', short: 'Diligence' },
  { id: 'report', path: '/guide/report', label: 'Report', short: 'Report' },
] as const;

export type GuideStepId = (typeof GUIDE_STEPS)[number]['id'];

export interface GuidedProgress {
  property: number;
  records: number;
  income: number;
  expenses: number;
  financing: number;
  diligence: number;
  overall: number;
  readyToAnalyze: boolean;
  missingCritical: string[];
}

export function calculateGuidedProgress(deal: Deal, analysis: DealAnalysis): GuidedProgress {
  const p = deal.property;
  const propertyScore = [
    p.address,
    deal.loan.purchasePrice > 0,
    p.propertyType,
  ].filter(Boolean).length;
  const property = Math.round((propertyScore / 3) * 100);

  const recordsBits = [
    Boolean(p.bbl || (p.block && p.lot)),
    Boolean(p.lastLookupAt),
    p.legalOccupancyFinding && p.legalOccupancyFinding !== 'not_verified',
    !analysis.sourceConflicts?.length,
  ];
  const records = Math.round((recordsBits.filter(Boolean).length / recordsBits.length) * 100);

  const hasRent = deal.units.some((u) => u.underwrittenMonthlyRent > 0 || u.currentMonthlyRent > 0);
  const hasVerified = deal.units.some((u) => isBaseCaseUnit(u));
  const income = Math.round(((Number(hasRent) + Number(hasVerified) + Number(deal.units.length > 0)) / 3) * 100);

  const filled = deal.expenses.filter((e) => e.annualAmount > 0 || e.percentOfEgi > 0).length;
  const expenses = Math.round((filled / Math.max(4, Math.min(deal.expenses.length, 8))) * 100);

  const financing =
    deal.loan.purchasePrice > 0
      ? deal.loan.downPaymentPercent >= 100 || deal.loan.interestRate >= 0
        ? 100
        : 60
      : 0;

  const dd = deal.dueDiligence;
  const ddDone = dd.filter((item) =>
    ['verified', 'not_applicable', 'resolved', 'issue_found'].includes(item.status),
  ).length;
  const diligence = dd.length === 0 ? 0 : Math.round((ddDone / dd.length) * 100);

  const legalIncomplete = !hasVerified && hasRent;
  const overall = Math.round(
    (property * 0.18 +
      records * 0.14 +
      income * 0.2 +
      expenses * 0.16 +
      financing * 0.16 +
      diligence * 0.16) /
      1,
  );

  const missingCritical: string[] = [];
  if (!p.address) missingCritical.push('Property address');
  if (deal.loan.purchasePrice <= 0) missingCritical.push('Asking / purchase price');
  if (!hasRent) missingCritical.push('At least one rent amount');
  if (legalIncomplete) missingCritical.push('Verified or user-attested base-case rent');

  return {
    property: Math.min(100, property),
    records: Math.min(100, records),
    income: Math.min(100, income),
    expenses: Math.min(100, expenses),
    financing: Math.min(100, financing),
    diligence: Math.min(100, diligence),
    overall: Math.min(100, overall),
    readyToAnalyze: missingCritical.length === 0,
    missingCritical,
  };
}

export function firstIncompleteStep(progress: GuidedProgress): GuideStepId {
  if (progress.property < 80) return 'property';
  if (progress.records < 40) return 'records';
  if (progress.income < 70) return 'income';
  if (progress.expenses < 40) return 'expenses';
  if (progress.financing < 80) return 'financing';
  if (!progress.readyToAnalyze) return 'analysis';
  if (progress.diligence < 20) return 'diligence';
  return 'analysis';
}

export function stepStatus(
  id: GuideStepId,
  progress: GuidedProgress,
  analysis: DealAnalysis,
): 'done' | 'warn' | 'todo' {
  if (id === 'property') return progress.property >= 80 ? 'done' : 'todo';
  if (id === 'records') {
    if ((analysis.sourceConflicts ?? []).length > 0) return 'warn';
    return progress.records >= 50 ? 'done' : 'todo';
  }
  if (id === 'income') return progress.income >= 70 ? 'done' : progress.income > 0 ? 'warn' : 'todo';
  if (id === 'expenses') return progress.expenses >= 50 ? 'done' : 'todo';
  if (id === 'financing') return progress.financing >= 80 ? 'done' : 'todo';
  if (id === 'analysis') return progress.readyToAnalyze ? 'done' : 'todo';
  if (id === 'diligence') return progress.diligence >= 25 ? 'done' : 'todo';
  return 'todo';
}
