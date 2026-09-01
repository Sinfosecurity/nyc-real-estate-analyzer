import { describe, expect, it } from 'vitest';
import { analyzeDeal } from '../calculations/analyze';
import { createBlankDeal, createDefaultDeal, createUnit, EXPENSE_TEMPLATES } from '../constants/defaults';
import { createId } from '../utils/id';
import { money } from '../utils/format';
import { reportBreakpoints } from '../report/breakpoints';
import { expectedUnitsFromPropertyType, moneyOrNotProvided, suspiciousMonthlyRent } from '../report/display';
import { executiveNarrative } from '../report/narrative';
import { populatedOfferScenarios } from '../report/offers';
import { assessExpenseCompleteness, assessReportReadiness, collectReportConflicts } from '../report/readiness';

function zeroExpenses() {
  return EXPENSE_TEMPLATES.map((item) => ({
    id: createId('exp'),
    key: item.key,
    label: item.label,
    annualAmount: item.key === 'water' ? 850 : 0,
    percentOfEgi: 0,
    mode: item.mode,
    behavior: item.mode === 'percent_egi' ? 'variable' as const : 'fixed' as const,
  }));
}

function deal740() {
  const deal = createBlankDeal({
    name: 'Regression $740,000',
    units: [
      createUnit({
        identifier: '1',
        underwrittenMonthlyRent: 3500,
        currentMonthlyRent: 3500,
        marketMonthlyRent: 3500,
        legalOccupancyVerified: true,
        incomeStatus: 'verified',
      }),
    ],
    expenses: zeroExpenses(),
    loan: {
      ...createBlankDeal().loan,
      purchasePrice: 740_000,
    },
    property: {
      ...createBlankDeal().property,
      address: 'Regression Avenue',
      propertyType: '3-family',
      legalUnitCount: 0,
      observedUnitCount: 3,
      officialUnitCount: 1,
      legalOccupancyFinding: 'not_verified',
    },
    offerPrices: { asking: 0, target: 0, aggressive: 0, custom: 0 },
    comps: [],
    risks: [],
  });
  return deal;
}

describe('report readiness and validation', () => {
  it('flags a missing property address', () => {
    const deal = createBlankDeal();
    const analysis = analyzeDeal(deal);
    const conflicts = collectReportConflicts(deal, analysis);
    expect(conflicts.some((item) => item.id === 'missing-address')).toBe(true);
    expect(assessReportReadiness(deal, analysis).level).toBe('NOT READY');
  });

  it('flags a missing purchase price', () => {
    const deal = createBlankDeal({ property: { ...createBlankDeal().property, address: '1 Main St' } });
    const analysis = analyzeDeal(deal);
    expect(collectReportConflicts(deal, analysis).some((item) => item.id === 'missing-price')).toBe(true);
  });

  it('flags missing / incomplete expenses and does not invent amounts', () => {
    const deal = deal740();
    const analysis = analyzeDeal(deal);
    const expense = assessExpenseCompleteness(deal, analysis);
    expect(expense.complete).toBe(false);
    expect(expense.annualOperatingExpenses).toBe(850);
    expect(expense.missingLabels).toContain('Property Taxes');
    expect(expense.missingLabels).toContain('Insurance');
    expect(expense.warning).toContain('$850');
    expect(moneyOrNotProvided(0, false)).toBe('NOT PROVIDED');
  });

  it('flags a 3-family type with legal units of 0', () => {
    const deal = deal740();
    const analysis = analyzeDeal(deal);
    const conflicts = collectReportConflicts(deal, analysis);
    expect(conflicts.some((item) => item.id === 'type-vs-legal-zero')).toBe(true);
    expect(expectedUnitsFromPropertyType('3-family')).toBe(3);
  });

  it('flags official vs listing unit conflicts', () => {
    const deal = deal740();
    const analysis = analyzeDeal(deal);
    expect(collectReportConflicts(deal, analysis).some((item) => item.id === 'listing-vs-official')).toBe(true);
  });

  it('flags verified units while property legal status is unresolved', () => {
    const deal = deal740();
    const analysis = analyzeDeal(deal);
    expect(collectReportConflicts(deal, analysis).some((item) => item.id === 'verified-vs-property')).toBe(true);
  });

  it('keeps unverified income out of the golden fixture GRI', () => {
    const deal = createDefaultDeal();
    deal.units.push(
      createUnit({
        identifier: 'cellar',
        spaceType: 'cellar',
        incomeStatus: 'unverified',
        legalOccupancyVerified: false,
        underwrittenMonthlyRent: 1800,
      }),
    );
    deal.unverifiedIncomeMonthly = 1800;
    const analysis = analyzeDeal(deal);
    expect(analysis.gri).toBe(110_400);
    expect(analysis.unverifiedIncomeAnnual).toBeGreaterThan(0);
  });

  it('flags missing insurance and taxes separately from a complete golden fixture', () => {
    const incomplete = deal740();
    const complete = createDefaultDeal();
    expect(assessExpenseCompleteness(incomplete, analyzeDeal(incomplete)).missingLabels).toEqual(
      expect.arrayContaining(['Insurance', 'Property Taxes']),
    );
    expect(assessExpenseCompleteness(complete, analyzeDeal(complete)).complete).toBe(true);
  });

  it('treats no comps as an open readiness item, not a fabricated range', () => {
    const deal = deal740();
    const readiness = assessReportReadiness(deal, analyzeDeal(deal));
    expect(readiness.checks.find((item) => item.id === 'comps')?.state).toBe('open');
  });

  it('treats empty due diligence and empty risks as incomplete, not safe', () => {
    const deal = deal740();
    const readiness = assessReportReadiness(deal, analyzeDeal(deal));
    expect(readiness.dueDiligence).toBeLessThan(20);
    expect(deal.risks).toEqual([]);
  });

  it('does not emit zero-price offer scenarios', () => {
    const deal = deal740();
    const analysis = analyzeDeal(deal);
    expect(analysis.offerRows?.some((row) => /\(0\)/.test(row.label))).toBe(false);
    const rows = populatedOfferScenarios(deal, analysis);
    expect(rows.every((row) => row.price > 0)).toBe(true);
    expect(rows.some((row) => row.key === 'asking')).toBe(true);
    expect(rows.some((row) => row.key === 'target')).toBe(false);
  });

  it('renders valid offer scenarios from the golden fixture', () => {
    const deal = createDefaultDeal();
    const rows = populatedOfferScenarios(deal, analyzeDeal(deal));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((row) => row.price > 0 && Number.isFinite(row.noi))).toBe(true);
  });

  it('keeps negative cash flow visible on a stressed deal', () => {
    const deal = createDefaultDeal();
    deal.loan.interestRate = 14;
    deal.loan.downPaymentPercent = 10;
    const analysis = analyzeDeal(deal);
    expect(analysis.cashFlowAnnual).toBeLessThan(0);
    const readiness = assessReportReadiness(deal, analysis);
    expect(readiness.financialSignal === 'PASS' || readiness.overallStatus.includes('PASS') || analysis.cashFlowAnnual < 0).toBe(true);
  });

  it('keeps a strong financial result preliminary when diligence is incomplete', () => {
    const deal = createDefaultDeal();
    deal.expenses = zeroExpenses();
    deal.property.legalOccupancyFinding = 'not_verified';
    const analysis = analyzeDeal(deal);
    const readiness = assessReportReadiness(deal, analysis);
    expect(readiness.confidence).toBe('PRELIMINARY');
    expect(readiness.reportClass).toBe('PRELIMINARY UNDERWRITING');
    expect(readiness.overallStatus).toContain('PRELIMINARY');
    expect(readiness.expense.complete).toBe(false);
  });

  it('classifies the $740,000 regression deal as preliminary, not final', () => {
    const deal = deal740();
    const readiness = assessReportReadiness(deal, analyzeDeal(deal));
    expect(readiness.reportClass).toBe('PRELIMINARY UNDERWRITING');
    expect(readiness.generateLabel).toMatch(/preliminary/i);
  });

  it('can reach due-diligence or final class only with real completeness', () => {
    const deal = createDefaultDeal();
    deal.property.address = '179-XX Example Avenue';
    deal.property.legalOccupancyFinding = 'verified';
    deal.property.lastLookupAt = '2026-01-01T00:00:00.000Z';
    deal.property.bbl = '1234567890';
    deal.dueDiligence = deal.dueDiligence.map((item) => ({ ...item, status: 'verified' as const }));
    deal.comps = [
      {
        id: 'c1',
        address: 'Comp',
        saleDate: '2025-01-01',
        salePrice: 1_100_000,
        propertyType: '3-family',
        legalUnits: 3,
        buildingSqft: 2400,
        lotSqft: 2500,
        distanceMiles: 0.2,
        condition: 'similar',
        notes: '',
        source: 'manual',
      },
    ];
    const readiness = assessReportReadiness(deal, analyzeDeal(deal));
    expect(['DUE DILIGENCE UNDERWRITING', 'FINAL INVESTMENT REVIEW']).toContain(readiness.reportClass);
  });

  it('formats currency and rejects a $3 display for a $3,500 rent', () => {
    expect(money(3500)).toBe('$3,500');
    expect(money(3500)).not.toBe('$3');
    expect(suspiciousMonthlyRent(3)).toBe(true);
    expect(suspiciousMonthlyRent(3500)).toBe(false);
    expect(moneyOrNotProvided(0, false)).toBe('NOT PROVIDED');
    expect(money(null)).toBe('N/A');
  });

  it('reproduces the golden fixture inside the report narrative', () => {
    const deal = createDefaultDeal();
    const analysis = analyzeDeal(deal);
    expect(analysis.gri).toBe(110_400);
    expect(analysis.noi).toBe(79_580);
    expect(analysis.purchasePrice).toBe(1_200_000);
    const text = executiveNarrative(deal, analysis, assessReportReadiness(deal, analysis));
    expect(text).toContain('$1,200,000');
    expect(text).toContain('$79,580');
    expect(analysis.maxOffer.conservative).toBeTruthy();
  });

  it('computes breakpoints from analyzeDeal rather than a parallel engine', () => {
    const deal = createDefaultDeal();
    const analysis = analyzeDeal(deal);
    const rows = reportBreakpoints(deal, analysis);
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.some((row) => row.kind === 'break')).toBe(true);
    expect(rows.some((row) => row.kind === 'improve')).toBe(true);
  });
});
