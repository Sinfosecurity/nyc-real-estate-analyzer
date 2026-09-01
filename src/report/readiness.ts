import { isBaseCaseUnit } from '../calculations/income';
import type { Deal, DealAnalysis } from '../models';
import { expectedUnitsFromPropertyType, suspiciousMonthlyRent } from './display';
import type {
  ConfidenceLevel,
  ExpenseCompleteness,
  ReadinessCheck,
  ReadinessLevel,
  ReportClass,
  ReportConflict,
  ReportReadiness,
} from './types';

const MAJOR_EXPENSE_GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: 'taxes', label: 'Property Taxes', keys: ['taxes'] },
  { id: 'insurance', label: 'Insurance', keys: ['insurance'] },
  { id: 'water', label: 'Water/Sewer', keys: ['water'] },
  { id: 'repairs', label: 'Repairs/Maintenance', keys: ['repairs', 'maintenance'] },
  { id: 'utilities', label: 'Utilities', keys: ['electric', 'gas'] },
  { id: 'management', label: 'Management', keys: ['management'] },
  { id: 'reserves', label: 'Reserves / CapEx', keys: ['reserve'] },
];

function expenseProvided(deal: Deal, keys: string[]): boolean {
  return deal.expenses.some(
    (item) => keys.includes(item.key) && (item.annualAmount > 0 || item.percentOfEgi > 0),
  );
}

export function assessExpenseCompleteness(deal: Deal, analysis: DealAnalysis): ExpenseCompleteness {
  const providedLabels = MAJOR_EXPENSE_GROUPS.filter((group) => expenseProvided(deal, group.keys)).map(
    (group) => group.label,
  );
  const missingLabels = MAJOR_EXPENSE_GROUPS.filter((group) => !expenseProvided(deal, group.keys)).map(
    (group) => group.label,
  );
  const taxesOk = expenseProvided(deal, ['taxes']);
  const insuranceOk = expenseProvided(deal, ['insurance']);
  const oer = analysis.operatingExpenseRatio;
  const thinOer = analysis.egi > 0 && oer !== null && oer < 0.15;
  const complete = taxesOk && insuranceOk && providedLabels.length >= 5 && !thinOer;
  let warning: string | null = null;
  if (!complete) {
    warning = `The current NOI is based on only ${analysis.operatingExpenses.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    })} of annual operating expenses. ${missingLabels.slice(0, 4).join(', ') || 'Common expense categories'} ${
      missingLabels.length ? 'have not all been confirmed' : 'appear unusually low relative to income'
    }. NOI, cap rate, DSCR and cash-flow results may therefore be materially overstated.`;
  }
  return {
    complete,
    providedLabels,
    missingLabels,
    annualOperatingExpenses: analysis.operatingExpenses,
    warning,
  };
}

export function collectReportConflicts(deal: Deal, analysis: DealAnalysis): ReportConflict[] {
  const conflicts: ReportConflict[] = [];
  const expected = expectedUnitsFromPropertyType(deal.property.propertyType);
  const legal = deal.property.legalUnitCount;
  const official = deal.property.officialUnitCount;
  const listing = deal.property.observedUnitCount;
  const verifiedUnits = deal.units.filter((unit) => isBaseCaseUnit(unit));
  const finding = deal.property.legalOccupancyFinding;

  if (!deal.property.address.trim()) {
    conflicts.push({
      id: 'missing-address',
      severity: 'critical',
      title: 'VERIFICATION REQUIRED',
      explanation: 'No property address has been entered.',
    });
  }
  if (deal.loan.purchasePrice <= 0) {
    conflicts.push({
      id: 'missing-price',
      severity: 'critical',
      title: 'VERIFICATION REQUIRED',
      explanation: 'Purchase / asking price is missing. Decision metrics that depend on price are not reliable.',
    });
  }
  if (expected !== null && legal === 0) {
    conflicts.push({
      id: 'type-vs-legal-zero',
      severity: 'critical',
      title: 'DATA CONFLICT',
      explanation: `Property type is ${deal.property.propertyType} but legal unit count is 0. Do not treat the type label as a verified unit count.`,
    });
  } else if (expected !== null && legal > 0 && expected !== legal) {
    conflicts.push({
      id: 'type-vs-legal',
      severity: 'warning',
      title: 'DATA CONFLICT',
      explanation: `Property type is ${deal.property.propertyType} but the underwritten legal unit count is ${legal}.`,
    });
  }
  if (official != null && legal > 0 && official !== legal) {
    conflicts.push({
      id: 'official-vs-underwritten',
      severity: 'critical',
      title: 'DATA CONFLICT',
      explanation: `Official-record units (${official}) conflict with the underwritten legal unit count (${legal}).`,
    });
  }
  if (official != null && listing != null && listing > 0 && official !== listing) {
    conflicts.push({
      id: 'listing-vs-official',
      severity: 'critical',
      title: 'DATA CONFLICT',
      explanation: `Listing / observed unit count (${listing}) conflicts with official records (${official}).`,
    });
  }
  if (
    verifiedUnits.length > 0 &&
    (legal === 0 || finding === 'not_verified' || finding === 'records_require_review' || finding === 'potential_conflict')
  ) {
    conflicts.push({
      id: 'verified-vs-property',
      severity: 'critical',
      title: 'DATA CONFLICT',
      explanation:
        'One or more rent-roll units are marked verified while property-level legal occupancy remains unresolved. Verified rent is not the same as a confirmed legal unit count.',
    });
  }
  if (analysis.gri > 0 && (finding === 'not_verified' || finding === 'records_require_review' || legal === 0)) {
    const hasBaseRent = deal.units.some((unit) => isBaseCaseUnit(unit) && (unit.underwrittenMonthlyRent > 0 || unit.currentMonthlyRent > 0));
    if (hasBaseRent) {
      conflicts.push({
        id: 'rent-while-unresolved',
        severity: 'warning',
        title: 'VERIFICATION REQUIRED',
        explanation: 'Base-case rent is included while property-level legal occupancy remains unresolved.',
      });
    }
  }
  deal.units.forEach((unit) => {
    const rent = unit.underwrittenMonthlyRent || unit.currentMonthlyRent;
    if (suspiciousMonthlyRent(rent)) {
      conflicts.push({
        id: `rent-suspicious-${unit.id}`,
        severity: 'warning',
        title: 'VERIFICATION REQUIRED',
        explanation: `Unit ${unit.identifier} shows ${rent.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        })} monthly rent. Confirm this is not a truncated thousands figure.`,
      });
    }
  });
  if (deal.loan.purchasePrice > 0 && analysis.ltv !== null && analysis.ltv > 1) {
    conflicts.push({
      id: 'ltv-over-100',
      severity: 'warning',
      title: 'DATA CONFLICT',
      explanation: `LTV is ${(analysis.ltv * 100).toFixed(2)}% because the loan exceeds the purchase price. Check loan amount versus asking price before relying on leverage metrics.`,
    });
  }
  (analysis.sourceConflicts ?? []).forEach((item, index) => {
    conflicts.push({
      id: `source-${index}`,
      severity: 'warning',
      title: 'DATA CONFLICT',
      explanation: `${item.field}: listing ${item.listing} versus official ${item.official}.`,
    });
  });
  return conflicts;
}

function scoreFinancial(deal: Deal, analysis: DealAnalysis, expense: ExpenseCompleteness): number {
  const bits = [
    deal.loan.purchasePrice > 0,
    deal.units.some((unit) => (unit.underwrittenMonthlyRent || unit.currentMonthlyRent) > 0),
    deal.units.some((unit) => isBaseCaseUnit(unit)),
    expense.providedLabels.includes('Property Taxes'),
    expense.providedLabels.includes('Insurance'),
    expense.providedLabels.length >= 4,
    deal.loan.interestRate > 0,
    analysis.totalCashInvested > 0,
  ];
  return Math.round((bits.filter(Boolean).length / bits.length) * 100);
}

function scoreRecords(deal: Deal, conflicts: ReportConflict[]): number {
  const bits = [
    Boolean(deal.property.address),
    Boolean(deal.property.borough),
    Boolean(deal.property.bbl || (deal.property.block && deal.property.lot)),
    Boolean(deal.property.lastLookupAt),
    deal.property.legalUnitCount > 0,
    deal.property.officialUnitCount != null,
    !conflicts.some((item) => item.id.includes('official') || item.id.includes('listing-vs')),
    deal.property.legalOccupancyFinding === 'verified',
  ];
  return Math.round((bits.filter(Boolean).length / bits.length) * 100);
}

function scoreDiligence(deal: Deal): number {
  const items = deal.dueDiligence;
  if (!items.length) return 0;
  const done = items.filter((item) =>
    ['verified', 'resolved', 'not_applicable', 'issue_found'].includes(item.status),
  ).length;
  return Math.round((done / items.length) * 100);
}

export function assessBusinessReportClass(
  financial: number,
  records: number,
  diligence: number,
  expense: ExpenseCompleteness,
  criticalCount: number,
  compsCount: number,
): ReportClass {
  if (criticalCount > 0 || !expense.complete) {
    return 'PRELIMINARY UNDERWRITING';
  }
  if (financial >= 85 && records >= 70 && diligence >= 50 && compsCount > 0) {
    return 'FINAL INVESTMENT REVIEW';
  }
  if (financial >= 70 && (records >= 40 || diligence >= 20)) {
    return 'DUE DILIGENCE UNDERWRITING';
  }
  return 'PRELIMINARY UNDERWRITING';
}

function confidenceFor(overall: number, criticalCount: number, expenseComplete: boolean): ConfidenceLevel {
  if (criticalCount > 0 || !expenseComplete) return 'PRELIMINARY';
  if (overall >= 80) return 'HIGH';
  if (overall >= 55) return 'MODERATE';
  return 'PRELIMINARY';
}

function overallStatus(financial: DealAnalysis['health'], confidence: ConfidenceLevel): string {
  const result = financial.financialSignal ?? financial.signal;
  if (confidence === 'PRELIMINARY') {
    return result === 'PASS' ? 'PASS / PRELIMINARY REVIEW' : 'INVESTIGATE / PRELIMINARY REVIEW';
  }
  if (confidence === 'MODERATE' && result === 'STRONG REVIEW') return 'INVESTIGATE / MODERATE CONFIDENCE';
  return result;
}

export function assessReportReadiness(deal: Deal, analysis: DealAnalysis): ReportReadiness {
  const expense = assessExpenseCompleteness(deal, analysis);
  const conflicts = collectReportConflicts(deal, analysis);
  if (!expense.complete) {
    conflicts.unshift({
      id: 'incomplete-opex',
      severity: 'critical',
      title: 'OPERATING EXPENSE ASSUMPTIONS INCOMPLETE',
      explanation: expense.warning ?? 'Major operating-expense categories have not been confirmed.',
    });
  }
  const financialCompleteness = scoreFinancial(deal, analysis, expense);
  const recordVerification = scoreRecords(deal, conflicts);
  const dueDiligence = scoreDiligence(deal);
  const overallCompleteness = Math.round(
    financialCompleteness * 0.45 + recordVerification * 0.3 + dueDiligence * 0.25,
  );
  const criticalCount = conflicts.filter((item) => item.severity === 'critical').length;
  const warningCount = conflicts.filter((item) => item.severity === 'warning').length;
  const reportClass = assessBusinessReportClass(
    financialCompleteness,
    recordVerification,
    dueDiligence,
    expense,
    criticalCount,
    deal.comps?.length ?? 0,
  );
  const confidence = confidenceFor(overallCompleteness, criticalCount, expense.complete);
  const hasAddress = Boolean(deal.property.address.trim());
  const hasPrice = deal.loan.purchasePrice > 0;
  const hasRent = deal.units.some((unit) => (unit.underwrittenMonthlyRent || unit.currentMonthlyRent) > 0);
  let level: ReadinessLevel = 'READY';
  if (!hasAddress || !hasPrice || !hasRent) level = 'NOT READY';
  else if (criticalCount > 0 || warningCount > 0) level = 'READY WITH WARNINGS';

  const checks: ReadinessCheck[] = [
    { id: 'price', label: 'Purchase price entered', state: hasPrice ? 'pass' : 'open' },
    { id: 'financing', label: 'Financing entered', state: deal.loan.interestRate > 0 && hasPrice ? 'pass' : 'open' },
    {
      id: 'rent',
      label: 'Rent roll entered',
      state: hasRent ? 'pass' : 'open',
    },
    {
      id: 'legal',
      label: 'Legal unit count requires verification',
      state: deal.property.legalUnitCount > 0 && deal.property.legalOccupancyFinding === 'verified' ? 'pass' : 'warn',
    },
    {
      id: 'opex',
      label: expense.complete ? 'Operating expenses confirmed' : 'Operating expenses appear incomplete',
      state: expense.complete ? 'pass' : 'warn',
    },
    {
      id: 'comps',
      label: 'Comparable sales not completed',
      state: (deal.comps?.length ?? 0) > 0 ? 'pass' : 'open',
    },
    {
      id: 'inspection',
      label: 'Property inspection not completed',
      state: deal.dueDiligence.some((item) => /inspection/i.test(item.label) && ['verified', 'resolved'].includes(item.status))
        ? 'pass'
        : 'open',
    },
  ];

  return {
    level,
    reportClass,
    confidence,
    financialSignal: analysis.health.financialSignal ?? analysis.health.signal,
    overallStatus: overallStatus(analysis.health, confidence),
    financialCompleteness,
    recordVerification,
    dueDiligence,
    overallCompleteness,
    checks,
    conflicts,
    criticalCount,
    warningCount,
    expense,
    generateLabel: level === 'READY' ? 'Generate report' : 'Generate preliminary report',
  };
}
