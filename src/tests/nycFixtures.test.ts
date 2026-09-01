import { describe, expect, it } from 'vitest';
import { analyzeDeal } from '../calculations/analyze';
import { calculateRefinance } from '../calculations/valueAdd';
import { createDefaultDeal, createUnit } from '../constants/defaults';
import type { Deal } from '../models';

function twoFamily(): Deal {
  const deal = createDefaultDeal({ name: 'Synthetic NYC two-family' });
  deal.property.propertyType = '2-family';
  deal.property.legalUnitCount = 2;
  deal.units = [
    createUnit({
      identifier: '1',
      underwrittenMonthlyRent: 2800,
      currentMonthlyRent: 2800,
      marketMonthlyRent: 2800,
    }),
    createUnit({
      identifier: '2',
      underwrittenMonthlyRent: 2600,
      currentMonthlyRent: 2600,
      marketMonthlyRent: 2600,
    }),
  ];
  deal.loan.purchasePrice = 850_000;
  return deal;
}

function fourFamily(): Deal {
  const deal = createDefaultDeal({ name: 'Synthetic NYC four-family' });
  deal.property.propertyType = '4-family';
  deal.property.legalUnitCount = 4;
  deal.units = [
    createUnit({ identifier: '1', underwrittenMonthlyRent: 2400, currentMonthlyRent: 2400, marketMonthlyRent: 2400 }),
    createUnit({ identifier: '2', underwrittenMonthlyRent: 2300, currentMonthlyRent: 2300, marketMonthlyRent: 2300 }),
    createUnit({ identifier: '3', underwrittenMonthlyRent: 2200, currentMonthlyRent: 2200, marketMonthlyRent: 2200 }),
    createUnit({ identifier: '4', underwrittenMonthlyRent: 2100, currentMonthlyRent: 2100, marketMonthlyRent: 2100 }),
  ];
  deal.loan.purchasePrice = 1_400_000;
  return deal;
}

function smallMultifamily(): Deal {
  const deal = fourFamily();
  deal.name = 'Synthetic small multifamily';
  deal.property.propertyType = 'Small multifamily (5–12)';
  deal.property.legalUnitCount = 6;
  deal.units.push(
    createUnit({ identifier: '5', underwrittenMonthlyRent: 2000, currentMonthlyRent: 2000, marketMonthlyRent: 2000 }),
    createUnit({ identifier: '6', underwrittenMonthlyRent: 1900, currentMonthlyRent: 1900, marketMonthlyRent: 1900 }),
  );
  deal.loan.purchasePrice = 1_800_000;
  return deal;
}

describe('synthetic NYC fixtures', () => {
  it('underwrites a two-family without inventing a third unit', () => {
    const analysis = analyzeDeal(twoFamily());
    expect(analysis.gri).toBe(5400 * 12);
    expect(analysis.health.signal).not.toContain('BUY');
  });

  it('underwrites the golden three-family fixture unchanged', () => {
    const analysis = analyzeDeal(createDefaultDeal());
    expect(analysis.gri).toBe(110_400);
    expect(analysis.noi).toBe(79_580);
  });

  it('underwrites a four-family', () => {
    const analysis = analyzeDeal(fourFamily());
    expect(analysis.gri).toBe(9000 * 12);
    expect(Number.isFinite(analysis.noi)).toBe(true);
  });

  it('underwrites a small multifamily', () => {
    const analysis = analyzeDeal(smallMultifamily());
    expect(analysis.gri).toBe(12_900 * 12);
  });

  it('models a negative cash-flow property', () => {
    const deal = createDefaultDeal({ name: 'Synthetic negative cash-flow' });
    deal.loan.interestRate = 12;
    deal.loan.downPaymentPercent = 15;
    const analysis = analyzeDeal(deal);
    expect(analysis.cashFlowAnnual).toBeLessThan(0);
    expect(analysis.health.signal).not.toBe('STRONG REVIEW');
  });

  it('models a high cash-flow property', () => {
    const deal = createDefaultDeal({ name: 'Synthetic high cash-flow' });
    deal.loan.downPaymentPercent = 50;
    deal.loan.interestRate = 4;
    deal.units.forEach((unit) => {
      unit.underwrittenMonthlyRent *= 1.4;
      unit.currentMonthlyRent = unit.underwrittenMonthlyRent;
      unit.marketMonthlyRent = unit.underwrittenMonthlyRent;
    });
    const analysis = analyzeDeal(deal);
    expect(analysis.cashFlowAnnual).toBeGreaterThan(20_000);
    expect(analysis.dscr ?? 0).toBeGreaterThan(1.4);
  });

  it('models a renovation deal with income-approach value creation', () => {
    const deal = createDefaultDeal({ name: 'Synthetic renovation' });
    deal.renovation.enabled = true;
    deal.renovation.projectedMonthlyRent = 12_000;
    deal.renovation.renovationCost = 80_000;
    deal.renovation.projectedAnnualExpenses = 28_000;
    deal.renovation.targetCapRate = 7;
    const analysis = analyzeDeal(deal);
    expect(analysis.renovation.projectedNoi).toBe(12_000 * 12 - 28_000);
    expect(analysis.renovation.valueCreated).toBeCloseTo(analysis.renovation.noiIncrease / 0.07);
  });

  it('models a BRRRR refinance without fabricating ARV', () => {
    const result = calculateRefinance({
      purchasePrice: 700_000,
      renovation: 120_000,
      additionalBasis: 0,
      buyerClosingCosts: 25_000,
      totalCashInvested: 320_000,
      postRenovationNoi: 90_000,
      expectedArv: 1_100_000,
      refinanceLtvPercent: 75,
      refinanceRate: 6.25,
      refinanceAmortizationYears: 30,
      refinanceCosts: 10_000,
      oldDebtPayoff: 525_000,
    });
    expect(result.maxRefinanceLoan).toBe(825_000);
    expect(result.cashFromRefinance).toBe(290_000);
    expect(result.cashLeftInDeal).toBe(30_000);
    expect(result.postRefiDscr).not.toBeNull();
  });

  it('keeps unverified basement income out of a mixed occupancy deal', () => {
    const deal = createDefaultDeal({ name: 'Synthetic unverified basement' });
    deal.units.push(
      createUnit({
        identifier: 'cellar',
        spaceType: 'cellar',
        incomeStatus: 'unverified',
        legalOccupancyVerified: false,
        underwrittenMonthlyRent: 1800,
        currentMonthlyRent: 1800,
        marketMonthlyRent: 1800,
      }),
    );
    deal.unverifiedIncomeMonthly = 1800;
    const analysis = analyzeDeal(deal);
    expect(analysis.gri).toBe(110_400);
    expect(analysis.unverifiedIncomeAnnual).toBeGreaterThanOrEqual(21_600);
    expect(analysis.scenarios.base.includesUnverifiedIncome).toBe(false);
  });
});
