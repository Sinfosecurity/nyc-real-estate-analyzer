import { describe, expect, it } from 'vitest';
import { analyzeDeal } from '../calculations/analyze';
import { summarizeComps } from '../calculations/comps';
import { calculateAmortization, calculateMortgagePayment } from '../calculations/financing';
import {
  calculateExcludedUnitIncome,
  calculateGRI,
  isBaseCaseUnit,
} from '../calculations/income';
import {
  calculateBreakEvenOccupancy,
  calculateContributionBreakEvenOccupancy,
} from '../calculations/returns';
import { interestRateAtZeroCashFlow } from '../calculations/stress';
import { createDefaultDeal, createUnit } from '../constants/defaults';
import { migrateDeal, validateImportJson } from '../storage/migrate';

describe('legal-income gate', () => {
  it('excludes basement income unless verified', () => {
    const deal = createDefaultDeal();
    deal.units.push(
      createUnit({
        identifier: 'basement',
        spaceType: 'basement',
        legalOccupancyVerified: false,
        incomeStatus: 'unverified',
        underwrittenMonthlyRent: 2000,
        currentMonthlyRent: 2000,
        marketMonthlyRent: 2000,
      }),
    );
    expect(isBaseCaseUnit(deal.units[3])).toBe(false);
    expect(calculateGRI(deal.units, 'underwritten')).toBe(110_400);
    expect(calculateExcludedUnitIncome(deal.units, 'underwritten')).toBe(24_000);
    const analysis = analyzeDeal(deal);
    expect(analysis.gri).toBe(110_400);
    expect(analysis.noi).toBe(79_580);
    expect(analysis.excludedIncomeDetail?.some((row) => row.annual === 24_000)).toBe(true);
  });

  it('allows user-attested primary units in the base case', () => {
    const deal = createDefaultDeal();
    deal.units[0].legalOccupancyVerified = true;
    deal.units[0].incomeStatus = 'user_attested';
    expect(isBaseCaseUnit(deal.units[0])).toBe(true);
    expect(analyzeDeal(deal).gri).toBe(110_400);
  });

  it('keeps potentially non-conforming units out of GRI', () => {
    const deal = createDefaultDeal();
    deal.units[2].incomeStatus = 'potentially_non_conforming';
    deal.units[2].legalOccupancyVerified = false;
    expect(calculateGRI(deal.units, 'underwritten')).toBe((3200 + 3100) * 12);
  });
});

describe('break-even methodology', () => {
  it('matches the original simplified formula when all OpEx is fixed', () => {
    const analysis = analyzeDeal(createDefaultDeal());
    const simplified = calculateBreakEvenOccupancy(
      analysis.operatingExpenses,
      analysis.annualDebtService,
      analysis.gri,
      analysis.otherLegalIncome,
    );
    expect(analysis.simplifiedBreakEvenOccupancy).toBeCloseTo(simplified ?? 0);
    expect(analysis.breakEvenOccupancy).toBeCloseTo(simplified ?? 0);
    expect(analysis.variableOperatingExpenses).toBe(0);
  });

  it('uses contribution-margin BEO when variable expenses exist', () => {
    const deal = createDefaultDeal();
    const mgmt = deal.expenses.find((item) => item.key === 'management');
    if (mgmt) {
      mgmt.mode = 'percent_egi';
      mgmt.percentOfEgi = 6;
      mgmt.behavior = 'variable';
    }
    const analysis = analyzeDeal(deal);
    expect(analysis.variableOperatingExpenses ?? 0).toBeGreaterThan(0);
    const contribution = calculateContributionBreakEvenOccupancy(
      analysis.fixedOperatingExpenses ?? 0,
      analysis.annualDebtService,
      analysis.gri + analysis.otherLegalIncome,
      analysis.variableOperatingExpenses ?? 0,
    );
    expect(analysis.contributionBreakEvenOccupancy).toBeCloseTo(contribution ?? 0);
    expect(analysis.breakEvenOccupancy).toBeCloseTo(contribution ?? 0);
    expect(analysis.breakEvenMethodLabel?.toLowerCase()).toContain('contribution');
  });
});

describe('amortization extensions', () => {
  it('records beginning balance and year 5 / 10 balances', () => {
    const summary = calculateAmortization(900_000, 5.6, 30, 0, '2026-01-01');
    expect(summary.schedule[0].beginningBalance).toBe(900_000);
    expect(summary.schedule[0].date).toBe('2026-01-01');
    expect(summary.year5Balance).toBeGreaterThan(0);
    expect(summary.year10Balance).toBeGreaterThan(0);
    expect(summary.year10Balance ?? 0).toBeLessThan(summary.year5Balance ?? 0);
  });

  it('leaves a balloon when term is shorter than amortization', () => {
    const summary = calculateAmortization(200_000, 6, 30, 0, undefined, 5);
    expect(summary.schedule).toHaveLength(60);
    expect(summary.remainingBalance).toBeGreaterThan(150_000);
    expect(summary.remainingBalance).toBeLessThan(200_000);
  });
});

describe('max-offer independence', () => {
  it('exposes cap, DSCR, CoC, LTV, and a controlling constraint', () => {
    const { maxOffer } = analyzeDeal(createDefaultDeal());
    expect(maxOffer.byCapRate).toBeCloseTo(1_136_857.14, 1);
    expect(maxOffer.byDscr).not.toBeNull();
    expect(maxOffer.byCashOnCash).not.toBeNull();
    expect(maxOffer.byLtv).not.toBeNull();
    expect(maxOffer.conservative).not.toBeNull();
    expect(maxOffer.bindingConstraint).toBeTruthy();
    const values = [
      maxOffer.byCapRate,
      maxOffer.byDscr,
      maxOffer.byCashOnCash,
      maxOffer.byFinancing,
      maxOffer.byLtv,
      maxOffer.byAvailableCash,
    ].filter((value): value is number => value !== null && value !== undefined);
    expect(maxOffer.conservative).toBeCloseTo(Math.min(...values), 2);
  });
});

describe('scenario inheritance', () => {
  it('does not put unverified income into conservative or base', () => {
    const deal = createDefaultDeal();
    deal.unverifiedIncomeMonthly = 2000;
    deal.assumptions.includeUnverifiedInUpside = true;
    const analysis = analyzeDeal(deal);
    expect(analysis.scenarios.conservative.includesUnverifiedIncome).toBe(false);
    expect(analysis.scenarios.base.includesUnverifiedIncome).toBe(false);
    expect(analysis.scenarios.upside.includesUnverifiedIncome).toBe(true);
  });

  it('treats null overrides as inherited, including a true 0% vacancy override', () => {
    const inherited = createDefaultDeal();
    inherited.scenarios.base.vacancyPercentOverride = null;
    const zero = createDefaultDeal();
    zero.scenarios.base.vacancyPercentOverride = 0;
    expect(analyzeDeal(inherited).egi).toBe(104_880);
    expect(analyzeDeal(zero).vacancyLoss).toBe(0);
  });
});

describe('stress and comps', () => {
  it('finds an interest-rate break point for zero cash flow', () => {
    const analysis = analyzeDeal(createDefaultDeal());
    const rate = interestRateAtZeroCashFlow(analysis.noi, analysis.loanAmount, 30);
    expect(rate === null || Number.isFinite(rate)).toBe(true);
    expect((analysis.stressTests ?? []).length).toBeGreaterThan(0);
    expect((analysis.breakpoints ?? []).length).toBeGreaterThan(0);
  });

  it('summarizes only user-entered comps', () => {
    const summary = summarizeComps([
      {
        id: '1',
        address: 'Synthetic A',
        saleDate: '2026-01-01',
        salePrice: 1_100_000,
        propertyType: '3-family',
        legalUnits: 3,
        buildingSqft: 2200,
        lotSqft: 2500,
        distanceMiles: 0.2,
        condition: 'average',
        notes: '',
        source: 'Manual',
      },
      {
        id: '2',
        address: 'Synthetic B',
        saleDate: '2026-02-01',
        salePrice: 1_200_000,
        propertyType: '3-family',
        legalUnits: 3,
        buildingSqft: 2400,
        lotSqft: 2500,
        distanceMiles: 0.4,
        condition: 'average',
        notes: '',
        source: 'Manual',
      },
    ]);
    expect(summary.count).toBe(2);
    expect(summary.averagePrice).toBe(1_150_000);
    expect(summary.medianPrice).toBe(1_150_000);
  });
});

describe('import safety', () => {
  it('rejects prototype-polluting JSON', () => {
    expect(() => validateImportJson('{"__proto__":{"x":1}}')).toThrow();
  });

  it('migrates a v2-shaped deal without discarding units', () => {
    const raw = {
      id: 'old',
      name: 'Legacy',
      property: { address: '1 Example St' },
      units: createDefaultDeal().units.map((unit) => ({ ...unit, incomeStatus: undefined })),
      loan: { purchasePrice: 1_200_000, downPaymentPercent: 25, interestRate: 5.6, amortizationYears: 30 },
    };
    const migrated = migrateDeal(raw);
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.units).toHaveLength(3);
    expect(migrated.property.tax?.sourceUsed).toBe('underwritten');
  });
});

describe('source conflicts', () => {
  it('surfaces listing vs official unit-count disagreement', () => {
    const deal = createDefaultDeal();
    deal.property.observedUnitCount = 3;
    deal.property.officialUnitCount = 2;
    const analysis = analyzeDeal(deal);
    expect(analysis.sourceConflicts?.some((row) => row.field.toLowerCase().includes('unit'))).toBe(true);
    expect(analysis.health.criticalIssues?.join(' ')).toMatch(/conflict/i);
  });
});

describe('invalid numeric display safety', () => {
  it('never emits NaN or Infinity from the engine for awkward deals', () => {
    const deal = createDefaultDeal();
    deal.loan.purchasePrice = 0;
    deal.loan.downPaymentPercent = 100;
    deal.units.forEach((unit) => {
      unit.underwrittenMonthlyRent = 0;
      unit.currentMonthlyRent = 0;
      unit.marketMonthlyRent = 0;
    });
    const analysis = analyzeDeal(deal);
    const numbers = [
      analysis.gri,
      analysis.egi,
      analysis.noi,
      analysis.cashFlowAnnual,
      analysis.operatingExpenses,
    ];
    expect(numbers.every((value) => Number.isFinite(value))).toBe(true);
    expect(analysis.capRate).toBeNull();
    expect(calculateMortgagePayment(0, 5.6, 30)).toBe(0);
  });
});
