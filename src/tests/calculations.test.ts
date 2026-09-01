import { describe, expect, it } from 'vitest';
import { analyzeDeal, analyzeWithAdjustments } from '../calculations/analyze';
import {
  calculateAmortization,
  calculateLTV,
  calculateLTC,
  calculateMortgagePayment,
  loanFromPayment,
} from '../calculations/financing';
import {
  calculateEGI,
  calculateGRI,
  calculateOtherLegalIncome,
  calculateVacancyAndCollection,
} from '../calculations/income';
import { calculateNOI } from '../calculations/expenses';
import {
  calculateBreakEvenOccupancy,
  calculateCapRate,
  calculateCashFlow,
  calculateCashOnCash,
  calculateDSCR,
  calculateDebtYield,
  calculateMaxDebtService,
  calculateSupportedValue,
} from '../calculations/returns';
import { calculateSupportedLoan, calculateMaxOffer } from '../calculations/valuation';
import { calculateRefinance, calculateValueCreated } from '../calculations/valueAdd';
import { createDefaultDeal, IDENTITY_ADJUSTMENT } from '../constants/defaults';
import type { Deal, OtherIncomeItem } from '../models';

/** Official baseline fixture from the product specification and original calculator. */
const FIXTURE = {
  purchasePrice: 1_200_000,
  monthlyLegalRent: 9_200,
  annualGri: 110_400,
  vacancy: 0.05,
  egi: 104_880,
  operatingExpenses: 25_300,
  noi: 79_580,
  downPaymentPercent: 0.25,
  loan: 900_000,
  interest: 5.6,
  amortizationYears: 30,
  closing: 30_000,
  initialReserve: 10_000,
  targetCap: 7,
  targetDscr: 1.25,
};

function fixtureDeal(): Deal {
  return createDefaultDeal();
}

describe('baseline fixture (original calculator)', () => {
  it('matches the specified GRI, EGI, and NOI', () => {
    const deal = fixtureDeal();
    const gri = calculateGRI(deal.units, 'underwritten');
    expect(gri).toBe(FIXTURE.annualGri);
    expect(gri).toBe(FIXTURE.monthlyLegalRent * 12);

    const vacancy = calculateVacancyAndCollection(gri, {
      mode: 'combined',
      combinedPercent: 5,
      physicalPercent: 0,
      collectionPercent: 0,
    });
    expect(vacancy.totalLoss).toBe(FIXTURE.annualGri * FIXTURE.vacancy);

    const egi = calculateEGI(gri, vacancy.totalLoss, 0);
    expect(egi).toBe(FIXTURE.egi);

    const analysis = analyzeDeal(deal);
    expect(analysis.operatingExpenses).toBe(FIXTURE.operatingExpenses);
    expect(analysis.noi).toBe(FIXTURE.noi);
    expect(analysis.loanAmount).toBe(FIXTURE.loan);
    expect(analysis.downPayment).toBe(300_000);
    expect(analysis.totalCashInvested).toBe(340_000);
    expect(analysis.buyerClosingCosts).toBe(30_000);
  });

  it('never includes unverified income in the base case', () => {
    const deal = fixtureDeal();
    deal.unverifiedIncomeMonthly = 2000;
    const analysis = analyzeDeal(deal);
    expect(analysis.unverifiedIncomeAnnual).toBe(24_000);
    expect(analysis.egi).toBe(FIXTURE.egi);
    expect(analysis.noi).toBe(FIXTURE.noi);
    expect(analysis.scenarios.base.includesUnverifiedIncome).toBe(false);
    expect(analysis.scenarios.upside.includesUnverifiedIncome).toBe(false);
  });

  it('includes unverified income in upside only after explicit opt-in', () => {
    const deal = fixtureDeal();
    deal.unverifiedIncomeMonthly = 2000;
    deal.assumptions.includeUnverifiedInUpside = true;
    const analysis = analyzeDeal(deal);
    expect(analysis.scenarios.base.egi).toBe(FIXTURE.egi);
    expect(analysis.scenarios.upside.includesUnverifiedIncome).toBe(true);
    expect(analysis.scenarios.upside.egi).toBeGreaterThan(analysis.scenarios.base.egi);
  });

  it('excludes unverified other-income line items from base EGI', () => {
    const items: OtherIncomeItem[] = [
      {
        id: 'a',
        description: 'Laundry',
        category: 'laundry',
        monthlyAmount: 100,
        verified: true,
        includeInBaseCase: true,
      },
      {
        id: 'b',
        description: 'Cellar',
        category: 'other',
        monthlyAmount: 1500,
        verified: false,
        includeInBaseCase: true,
      },
    ];
    expect(calculateOtherLegalIncome(items)).toBe(1200);
  });
});

describe('income and vacancy', () => {
  it('treats 0% vacancy as zero loss', () => {
    const loss = calculateVacancyAndCollection(110_400, {
      mode: 'combined',
      combinedPercent: 0,
      physicalPercent: 0,
      collectionPercent: 0,
    });
    expect(loss.totalLoss).toBe(0);
    expect(calculateEGI(110_400, 0, 0)).toBe(110_400);
  });

  it('treats 100% vacancy as full GRI loss', () => {
    const loss = calculateVacancyAndCollection(110_400, {
      mode: 'combined',
      combinedPercent: 100,
      physicalPercent: 0,
      collectionPercent: 0,
    });
    expect(loss.totalLoss).toBe(110_400);
    expect(calculateEGI(110_400, loss.totalLoss, 0)).toBe(0);
  });

  it('applies detailed vacancy then collection on remaining rent', () => {
    const loss = calculateVacancyAndCollection(100_000, {
      mode: 'detailed',
      combinedPercent: 0,
      physicalPercent: 10,
      collectionPercent: 5,
    });
    expect(loss.vacancyLoss).toBe(10_000);
    expect(loss.collectionLoss).toBe(4_500);
    expect(loss.totalLoss).toBe(14_500);
  });

  it('ignores units that are not legally verified', () => {
    const deal = fixtureDeal();
    deal.units[0].legalOccupancyVerified = false;
    const gri = calculateGRI(deal.units, 'underwritten');
    expect(gri).toBe((3100 + 2900) * 12);
  });
});

describe('mortgage and amortization', () => {
  it('handles zero interest as straight-line principal', () => {
    expect(calculateMortgagePayment(120_000, 0, 10)).toBe(1000);
  });

  it('returns 0 payment for zero debt', () => {
    expect(calculateMortgagePayment(0, 5.6, 30)).toBe(0);
  });

  it('inverts payment back to principal', () => {
    const payment = calculateMortgagePayment(900_000, 5.6, 30);
    const recovered = loanFromPayment(payment, 5.6, 30);
    expect(recovered).toBeCloseTo(900_000, 4);
  });

  it('matches the known 5.6% / 30-year payment on a $900,000 loan', () => {
    const monthly = calculateMortgagePayment(900_000, 5.6, 30);
    expect(monthly).toBeGreaterThan(5100);
    expect(monthly).toBeLessThan(5200);
    const annual = monthly * 12;
    const deal = analyzeDeal(fixtureDeal());
    expect(deal.monthlyPI).toBeCloseTo(monthly, 6);
    expect(deal.annualDebtService).toBeCloseTo(annual, 4);
  });

  it('amortization schedule pays off the loan', () => {
    const schedule = calculateAmortization(120_000, 6, 10);
    expect(schedule.schedule).toHaveLength(120);
    expect(schedule.remainingBalance).toBeLessThan(0.01);
    expect(schedule.totalPrincipal).toBeCloseTo(120_000, 2);
    expect(schedule.year1Principal + schedule.year1Interest).toBeCloseTo(
      schedule.monthlyPayment * 12,
      2,
    );
  });

  it('interest-only period does not reduce principal', () => {
    const schedule = calculateAmortization(200_000, 6, 30, 12);
    expect(schedule.schedule[0].interestOnly).toBe(true);
    expect(schedule.schedule[0].principal).toBe(0);
    expect(schedule.schedule[11].balance).toBeCloseTo(200_000, 2);
    expect(schedule.schedule[12].interestOnly).toBe(false);
  });
});

describe('returns and coverage', () => {
  it('computes GRM from purchase price and GRI', () => {
    const analysis = analyzeDeal(fixtureDeal());
    expect(analysis.grm).toBeCloseTo(1_200_000 / 110_400);
  });

  it('computes fixture cap rate, debt yield, DSCR, CoC, and cash flow', () => {
    const analysis = analyzeDeal(fixtureDeal());
    expect(calculateCapRate(FIXTURE.noi, FIXTURE.purchasePrice)).toBeCloseTo(79_580 / 1_200_000);
    expect(analysis.capRate).toBeCloseTo(79_580 / 1_200_000);
    expect(analysis.debtYield).toBeCloseTo(79_580 / 900_000);
    expect(analysis.dscr).toBeCloseTo(FIXTURE.noi / analysis.annualDebtService);
    expect(analysis.cashFlowAnnual).toBeCloseTo(FIXTURE.noi - analysis.annualDebtService);
    expect(analysis.cashOnCash).toBeCloseTo(analysis.cashFlowAnnual / 340_000);
    expect(analysis.ltv).toBeCloseTo(0.75);
  });

  it('returns null (not Infinity) for cap rate at zero price', () => {
    expect(calculateCapRate(79_580, 0)).toBeNull();
  });

  it('returns null DSCR when debt service is zero', () => {
    expect(calculateDSCR(79_580, 0)).toBeNull();
    const deal = fixtureDeal();
    deal.loan.downPaymentPercent = 100;
    const analysis = analyzeDeal(deal);
    expect(analysis.loanAmount).toBe(0);
    expect(analysis.annualDebtService).toBe(0);
    expect(analysis.dscr).toBeNull();
    expect(analysis.cashFlowAnnual).toBe(analysis.noi);
  });

  it('supports a 100% cash purchase', () => {
    const deal = fixtureDeal();
    deal.loan.downPaymentPercent = 100;
    const analysis = analyzeDeal(deal);
    expect(analysis.totalCashInvested).toBe(1_200_000 + 30_000 + 10_000);
    expect(analysis.cashOnCash).toBeCloseTo(analysis.noi / analysis.totalCashInvested);
    expect(analysis.debtYield).toBeNull();
  });

  it('handles negative NOI without producing NaN', () => {
    expect(calculateNOI(10_000, 25_000)).toBe(-15_000);
    expect(calculateDSCR(-15_000, 50_000)).toBeCloseTo(-0.3);
    expect(calculateCapRate(-15_000, 1_200_000)).toBeCloseTo(-15_000 / 1_200_000);
    expect(Number.isFinite(calculateCashFlow(-15_000, 10_000))).toBe(true);
  });

  it('handles a high interest rate', () => {
    const monthly = calculateMortgagePayment(900_000, 18, 30);
    expect(Number.isFinite(monthly)).toBe(true);
    expect(monthly).toBeGreaterThan(13_000);
  });

  it('computes LTV and LTC', () => {
    expect(calculateLTV(900_000, 1_200_000)).toBeCloseTo(0.75);
    expect(calculateLTC(900_000, 1_230_000)).toBeCloseTo(900_000 / 1_230_000);
    expect(calculateLTV(900_000, 0)).toBeNull();
  });

  it('computes cash-on-cash and debt yield helpers', () => {
    expect(calculateCashOnCash(20_000, 340_000)).toBeCloseTo(20_000 / 340_000);
    expect(calculateCashOnCash(20_000, 0)).toBeNull();
    expect(calculateDebtYield(79_580, 900_000)).toBeCloseTo(79_580 / 900_000);
    expect(calculateDebtYield(79_580, 0)).toBeNull();
  });
});

describe('valuation and max loan', () => {
  it('values the fixture at the 7% target cap', () => {
    const value = calculateSupportedValue(79_580, 7);
    expect(value).toBeCloseTo(1_136_857.1428, 3);
    expect(calculateSupportedValue(79_580, 0)).toBeNull();
  });

  it('computes DSCR-supported max debt and loan', () => {
    const maxDebt = calculateMaxDebtService(79_580, 1.25);
    expect(maxDebt).toBeCloseTo(63_664);
    const loan = calculateSupportedLoan(79_580, 1.25, 5.6, 30);
    const impliedDebt = calculateMortgagePayment(loan, 5.6, 30) * 12;
    expect(impliedDebt).toBeCloseTo(63_664, 2);
  });

  it('produces a conservative max offer equal to the tightest constraint', () => {
    const analysis = analyzeDeal(fixtureDeal());
    const { maxOffer } = analysis;
    const values = [maxOffer.byCapRate, maxOffer.byDscr, maxOffer.byCashOnCash, maxOffer.byFinancing]
      .filter((v): v is number => v !== null);
    expect(maxOffer.conservative).toBeCloseTo(Math.min(...values), 4);
    expect(maxOffer.byCapRate).toBeCloseTo(1_136_857.14, 1);
  });

  it('max-offer helper stays finite at awkward inputs', () => {
    const result = calculateMaxOffer({
      noi: 0,
      targetCapRate: 7,
      targetDscr: 1.25,
      minCashOnCashPercent: 6,
      maxLtvPercent: 75,
      downPaymentPercent: 25,
      interestRate: 5.6,
      amortizationYears: 30,
      closingAndOtherCash: 40_000,
      pointsPercent: 0,
      lenderFees: 0,
      maxCashToInvest: null,
      plannedLtv: 0.75,
    });
    expect(result.byCapRate).toBe(0);
    expect(result.conservative === null || Number.isFinite(result.conservative)).toBe(true);
  });
});

describe('break-even', () => {
  it('uses the original (OpEx + Debt) / (GRI + other) formula', () => {
    const analysis = analyzeDeal(fixtureDeal());
    const expected = calculateBreakEvenOccupancy(
      analysis.operatingExpenses,
      analysis.annualDebtService,
      analysis.gri,
      analysis.otherLegalIncome,
    );
    expect(analysis.breakEvenOccupancy).toBeCloseTo(expected ?? 0);
    expect(analysis.breakEvenRevenue).toBeCloseTo(
      analysis.operatingExpenses + analysis.annualDebtService,
    );
  });
});

describe('refinance and value-add', () => {
  it('computes cash left in deal and warns when over LTV', () => {
    const result = calculateRefinance({
      purchasePrice: 1_200_000,
      renovation: 80_000,
      additionalBasis: 0,
      buyerClosingCosts: 30_000,
      totalCashInvested: 420_000,
      postRenovationNoi: 95_000,
      expectedArv: 1_500_000,
      refinanceLtvPercent: 75,
      refinanceRate: 6,
      refinanceAmortizationYears: 30,
      refinanceCosts: 10_000,
      oldDebtPayoff: 900_000,
    });
    expect(result.maxRefinanceLoan).toBe(1_125_000);
    expect(result.cashFromRefinance).toBe(215_000);
    expect(result.cashLeftInDeal).toBe(205_000);
    expect(result.remainingEquity).toBe(375_000);
    expect(result.postRefiDscr).not.toBeNull();
    expect(result.exceedsConfiguredLtv).toBe(false);
  });

  it('value created is NOI increase divided by target cap', () => {
    expect(calculateValueCreated(14_000, 7)).toBeCloseTo(200_000);
    expect(calculateValueCreated(14_000, 0)).toBeNull();
  });
});

describe('deal health labels', () => {
  it('does not emit an unconditional BUY recommendation', () => {
    const analysis = analyzeDeal(fixtureDeal());
    expect(analysis.health.signal).not.toContain('BUY');
    expect(['STRONG REVIEW', 'INVESTIGATE', 'PASS']).toContain(analysis.health.signal);
    expect(analysis.health.tests.length).toBe(6);
  });

  it('marks PASS when NOI is deeply negative', () => {
    const deal = fixtureDeal();
    deal.units.forEach((unit) => {
      unit.currentMonthlyRent = 100;
      unit.marketMonthlyRent = 100;
      unit.underwrittenMonthlyRent = 100;
    });
    const analysis = analyzeDeal(deal);
    expect(analysis.noi).toBeLessThan(0);
    expect(analysis.health.signal).toBe('PASS');
  });
});

describe('scenario engine', () => {
  it('keeps base adjustments as identity so fixture math is unchanged', () => {
    const deal = fixtureDeal();
    const base = analyzeWithAdjustments(deal, IDENTITY_ADJUSTMENT, { includeUnverified: false });
    expect(base.noi).toBe(FIXTURE.noi);
    expect(base.gri).toBe(FIXTURE.annualGri);
  });
});
