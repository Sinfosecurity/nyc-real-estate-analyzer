import type {
  CalculationTrace,
  Deal,
  DealAnalysis,
  ScenarioAdjustments,
  ScenarioName,
  ScenarioResult,
  SensitivityRow,
} from '../models';
import { calculateOperatingExpenses } from './expenses';
import {
  calculateAmortization,
  calculateBuyerClosingCosts,
  calculateDownPayment,
  calculateLTC,
  calculateLTV,
  calculatePointsCost,
  calculateTotalAcquisitionCost,
  calculateTotalCashInvested,
  resolveLoanAmount,
} from './financing';
import { calculateDealHealth } from './health';
import {
  calculateAnnualRentRoll,
  calculateEGI,
  calculateGRI,
  calculateGPR,
  calculateOtherLegalIncome,
  calculateUnverifiedIncomeAnnual,
  calculateVacancyAndCollection,
  isBaseCaseUnit,
  unitMonthlyRent,
} from './income';
import { salesComparisonValue } from './comps';
import { calculateCompletion } from './completion';
import { interestRateAtZeroCashFlow } from './stress';
import { calculateNOI, calculateOperatingExpenseRatio } from './expenses';
import {
  calculateBreakEvenOccupancy,
  calculateBreakEvenRevenue,
  calculateCapRate,
  calculateCashFlow,
  calculateCashOnCash,
  calculateContributionBreakEvenOccupancy,
  calculateDebtYield,
  calculateDSCR,
  calculateEquity,
  calculateGRM,
  calculateMaxDebtService,
  calculatePricePerSqft,
  calculatePricePerUnit,
  calculateSupportedValue,
} from './returns';
import { calculateImmediateCapex, calculateAnnualCapexReserves } from './expenses';
import { clampNonNegative, finite } from './safe';
import { calculateMaxOffer, calculateSupportedLoan } from './valuation';
import { calculateRefinance, calculateRenovationAnalysis } from './valueAdd';

function vacancyInputs(deal: Deal, adjustments: ScenarioAdjustments) {
  const combined =
    adjustments.vacancyPercentOverride !== null
      ? adjustments.vacancyPercentOverride
      : deal.assumptions.combinedVacancyPercent;
  const collection =
    adjustments.collectionLossOverride !== null
      ? adjustments.collectionLossOverride
      : deal.assumptions.collectionLossPercent;
  return {
    mode: deal.assumptions.vacancyMode,
    combinedPercent: combined,
    physicalPercent:
      adjustments.vacancyPercentOverride !== null && deal.assumptions.vacancyMode === 'detailed'
        ? adjustments.vacancyPercentOverride
        : deal.assumptions.physicalVacancyPercent,
    collectionPercent: collection,
  };
}

function buildTraces(parts: {
  gri: number;
  vacancyLoss: number;
  otherLegalIncome: number;
  egi: number;
  opex: number;
  noi: number;
  price: number;
  capRate: number | null;
  annualDebt: number;
  dscr: number | null;
  cashFlow: number;
  totalCash: number;
  coc: number | null;
  loan: number;
  debtYield: number | null;
  ltv: number | null;
  unitLines?: CalculationTrace['lines'];
}): Record<string, CalculationTrace> {
  return {
    gri: {
      title: 'GRI — Gross Rental Income',
      lines: parts.unitLines?.length
        ? parts.unitLines
        : [{ label: 'Scheduled legal rent × 12', value: parts.gri, operator: '=' }],
      resultLabel: 'GRI',
      result: parts.gri,
      note: 'Only verified or user-attested legal units. Questionable space is excluded unless verified.',
    },
    egi: {
      title: 'EGI — Effective Gross Income',
      lines: [
        { label: 'Gross Rental Income', value: parts.gri, operator: '−' },
        { label: 'Vacancy / Collection Loss', value: parts.vacancyLoss, operator: '+' },
        { label: 'Other Legal Income', value: parts.otherLegalIncome, operator: '=' },
      ],
      resultLabel: 'EGI',
      result: parts.egi,
    },
    noi: {
      title: 'NOI — Net Operating Income',
      lines: [
        { label: 'Effective Gross Income', value: parts.egi, operator: '−' },
        { label: 'Operating Expenses', value: parts.opex, operator: '=' },
      ],
      resultLabel: 'NOI',
      result: parts.noi,
      note: 'NOI is before mortgage payments, depreciation, income taxes, and financing costs.',
    },
    capRate: {
      title: 'Cap Rate — Capitalization Rate',
      lines: [
        { label: 'NOI', value: parts.noi, operator: '÷' },
        { label: 'Purchase Price', value: parts.price, operator: '=' },
      ],
      resultLabel: 'Cap Rate',
      result: parts.capRate === null ? null : parts.capRate * 100,
      resultIsPercent: true,
    },
    dscr: {
      title: 'DSCR — Debt Service Coverage Ratio',
      lines: [
        { label: 'NOI', value: parts.noi, operator: '÷' },
        { label: 'Annual Debt Service', value: parts.annualDebt, operator: '=' },
      ],
      resultLabel: 'DSCR',
      result: parts.dscr,
      note: parts.annualDebt === 0 ? 'No debt service — DSCR is not applicable.' : undefined,
    },
    cashFlow: {
      title: 'Cash Flow',
      lines: [
        { label: 'NOI', value: parts.noi, operator: '−' },
        { label: 'Annual Debt Service', value: parts.annualDebt, operator: '=' },
      ],
      resultLabel: 'Annual Cash Flow',
      result: parts.cashFlow,
    },
    coc: {
      title: 'CoC — Cash-on-Cash Return',
      lines: [
        { label: 'Annual Pre-Tax Cash Flow', value: parts.cashFlow, operator: '÷' },
        { label: 'Total Cash Invested', value: parts.totalCash, operator: '=' },
      ],
      resultLabel: 'Cash-on-Cash Return',
      result: parts.coc === null ? null : parts.coc * 100,
      resultIsPercent: true,
    },
    debtYield: {
      title: 'Debt Yield',
      lines: [
        { label: 'NOI', value: parts.noi, operator: '÷' },
        { label: 'Loan Amount', value: parts.loan, operator: '=' },
      ],
      resultLabel: 'Debt Yield',
      result: parts.debtYield === null ? null : parts.debtYield * 100,
      resultIsPercent: true,
    },
    ltv: {
      title: 'LTV — Loan-to-Value',
      lines: [
        { label: 'Loan Amount', value: parts.loan, operator: '÷' },
        { label: 'Purchase Price', value: parts.price, operator: '=' },
      ],
      resultLabel: 'LTV (denominator: purchase price)',
      result: parts.ltv === null ? null : parts.ltv * 100,
      resultIsPercent: true,
    },
  };
}

export function analyzeWithAdjustments(
  deal: Deal,
  adjustments: ScenarioAdjustments,
  options: { includeUnverified: boolean },
): Omit<
  DealAnalysis,
  | 'scenarios'
  | 'interestSensitivity'
  | 'rentSensitivity'
  | 'expenseSensitivity'
  | 'priceSensitivity'
  | 'renovation'
  | 'refinance'
  | 'equity'
  | 'maxOffer'
  | 'health'
  | 'traces'
  | 'amortization'
> & { amortization: DealAnalysis['amortization']; traces: DealAnalysis['traces']; health: DealAnalysis['health']; maxOffer: DealAnalysis['maxOffer']; equity: DealAnalysis['equity'] } {
  const rentRoll = calculateAnnualRentRoll(deal.units);
  const gri = calculateGRI(deal.units, deal.assumptions.rentScenario) * finite(adjustments.rentMultiplier);
  const gpr = calculateGPR(deal.units, 'market') * finite(adjustments.rentMultiplier);
  const vacancy = calculateVacancyAndCollection(gri, vacancyInputs(deal, adjustments));
  const otherLegal =
    calculateOtherLegalIncome(deal.otherIncome) * finite(adjustments.otherIncomeMultiplier);
  const unverified = calculateUnverifiedIncomeAnnual(deal.unverifiedIncomeMonthly);
  const unverifiedIncluded = options.includeUnverified ? unverified : 0;
  const egi = calculateEGI(gri, vacancy.totalLoss, otherLegal + unverifiedIncluded);

  const expenseResult = calculateOperatingExpenses(deal.expenses, egi);
  const operatingExpenses = expenseResult.total * finite(adjustments.expenseMultiplier);
  const noi = calculateNOI(egi, operatingExpenses);

  const price = clampNonNegative(deal.loan.purchasePrice);
  const loanAmount = resolveLoanAmount({ ...deal.loan, purchasePrice: price });
  const downPayment = calculateDownPayment(price, loanAmount);
  const rate =
    adjustments.interestRateOverride !== null
      ? adjustments.interestRateOverride
      : deal.loan.interestRate;
  const amortization = calculateAmortization(
    loanAmount,
    rate,
    deal.loan.amortizationYears,
    deal.loan.interestOnlyMonths,
    deal.loan.startDate,
    deal.loan.loanTermYears,
  );
  const annualDebtService = amortization.annualDebtService;
  const cashFlowAnnual = calculateCashFlow(noi, annualDebtService);
  const closing = calculateBuyerClosingCosts(deal.acquisition);
  const renovation =
    adjustments.renovationBudgetOverride !== null
      ? adjustments.renovationBudgetOverride
      : deal.acquisition.renovationBudget;
  const pointsCost = calculatePointsCost(loanAmount, deal.loan.points);
  const financingFees = pointsCost + clampNonNegative(deal.loan.lenderFees);
  const totalCashInvested = calculateTotalCashInvested({
    downPayment,
    buyerClosingCosts: closing,
    renovation,
    financingFees,
    initialReserves: deal.acquisition.initialReserves,
  });
  const totalAcquisitionCost = calculateTotalAcquisitionCost(price, { ...deal.acquisition, renovationBudget: renovation }, financingFees);
  const capRate = calculateCapRate(noi, price);
  const dscr = calculateDSCR(noi, annualDebtService);
  const ltv = calculateLTV(loanAmount, price);
  const ltc = calculateLTC(loanAmount, totalAcquisitionCost);
  const coc = calculateCashOnCash(cashFlowAnnual, totalCashInvested);
  const debtYield = calculateDebtYield(noi, loanAmount);
  const oer = calculateOperatingExpenseRatio(operatingExpenses, egi);
  const gpi = gri + otherLegal;
  const fixedOpex = (expenseResult.fixed ?? operatingExpenses) * finite(adjustments.expenseMultiplier);
  const variableOpex = (expenseResult.variable ?? 0) * finite(adjustments.expenseMultiplier);
  const simplifiedBreakEven = calculateBreakEvenOccupancy(
    operatingExpenses,
    annualDebtService,
    gri,
    otherLegal,
  );
  const contributionBreakEven = calculateContributionBreakEvenOccupancy(
    fixedOpex,
    annualDebtService,
    gpi,
    variableOpex,
  );
  const breakEvenOccupancy = contributionBreakEven ?? simplifiedBreakEven;
  const breakEvenRevenue = calculateBreakEvenRevenue(operatingExpenses, annualDebtService);
  const supportedValue = calculateSupportedValue(noi, deal.assumptions.targetCapRate);
  const askingVsValue = supportedValue === null ? null : supportedValue - price;
  const askingVsValuePct = supportedValue === null || price <= 0 ? null : (supportedValue - price) / price;
  const maxAnnualDebtService = calculateMaxDebtService(noi, deal.assumptions.targetDscr);
  const supportedLoan = calculateSupportedLoan(
    noi,
    deal.assumptions.targetDscr,
    rate,
    deal.loan.amortizationYears,
  );
  const plannedLtv = price > 0 ? loanAmount / price : 1 - deal.loan.downPaymentPercent / 100;
  const extraCash = closing + renovation + deal.acquisition.initialReserves + deal.loan.lenderFees;
  const maxOffer = calculateMaxOffer({
    noi,
    targetCapRate: deal.assumptions.targetCapRate,
    targetDscr: deal.assumptions.targetDscr,
    minCashOnCashPercent: deal.assumptions.minCashOnCash,
    maxLtvPercent: deal.assumptions.maxLtv,
    downPaymentPercent: deal.loan.downPaymentPercent,
    interestRate: rate,
    amortizationYears: deal.loan.amortizationYears,
    closingAndOtherCash: extraCash,
    pointsPercent: deal.loan.points,
    lenderFees: 0,
    maxCashToInvest: deal.assumptions.maxCashToInvest,
    plannedLtv,
  });
  const legalUnits = deal.property.legalUnitCount || deal.units.filter((u) => isBaseCaseUnit(u)).length;
  const unverifiedUnits = deal.units.filter((u) => !isBaseCaseUnit(u));
  const legalComplete =
    unverifiedUnits.length === 0 &&
    deal.units.every((u) => (u.incomeStatus ?? (u.legalOccupancyVerified ? 'verified' : 'unverified')) !== 'unverified');
  const criticalIssues: string[] = [];
  if (unverifiedUnits.length > 0) {
    criticalIssues.push(`${unverifiedUnits.length} unit(s) excluded from base-case income`);
  }
  if (
    deal.property.officialUnitCount != null &&
    deal.property.observedUnitCount != null &&
    deal.property.officialUnitCount !== deal.property.observedUnitCount
  ) {
    criticalIssues.push('Legal / observed unit count conflict');
  }
  const health = calculateDealHealth({
    noi,
    capRate,
    targetCapRate: deal.assumptions.targetCapRate,
    dscr,
    targetDscr: deal.assumptions.targetDscr,
    cashOnCash: coc,
    minCashOnCash: deal.assumptions.minCashOnCash,
    ltv,
    maxLtv: deal.assumptions.maxLtv,
    cashFlow: cashFlowAnnual,
    annualDebtService,
    legalComplete,
    criticalIssues,
  });
  const unitLines = deal.units.filter(isBaseCaseUnit).map((unit, index, list) => ({
    label: `Unit ${unit.identifier}: $${unitMonthlyRent(unit, deal.assumptions.rentScenario).toLocaleString('en-US')} × 12`,
    value: unitMonthlyRent(unit, deal.assumptions.rentScenario) * 12,
    operator: (index === list.length - 1 ? '=' : '+') as '+' | '=',
  }));
  const traces = buildTraces({
    gri,
    vacancyLoss: vacancy.totalLoss,
    otherLegalIncome: otherLegal + unverifiedIncluded,
    egi,
    opex: operatingExpenses,
    noi,
    price,
    capRate,
    annualDebt: annualDebtService,
    dscr,
    cashFlow: cashFlowAnnual,
    totalCash: totalCashInvested,
    coc,
    loan: loanAmount,
    debtYield,
    ltv,
    unitLines,
  });
  const equity = {
    acquisitionEquity: calculateEquity(price, loanAmount),
    postRenovationEquity: null as number | null,
    refinanceEquity: null as number | null,
    principalPaydownYear1: amortization.year1Principal,
    appreciatedValue:
      deal.assumptions.appreciationRate > 0
        ? price * (1 + deal.assumptions.appreciationRate / 100)
        : null,
    appreciationRate: deal.assumptions.appreciationRate,
  };

  return {
    gri,
    gpr,
    currentRentAnnual: rentRoll.current,
    marketRentAnnual: rentRoll.market,
    underwrittenRentAnnual: rentRoll.underwritten,
    vacancyLoss: vacancy.vacancyLoss,
    collectionLoss: vacancy.collectionLoss,
    vacancyAndCollectionLoss: vacancy.totalLoss,
    otherLegalIncome: otherLegal,
    unverifiedIncomeAnnual: unverified,
    egi,
    expenseDetails: expenseResult.details.map((row) => ({
      ...row,
      annualAmount: row.annualAmount * finite(adjustments.expenseMultiplier),
    })),
    operatingExpenses,
    monthlyOperatingExpenses: operatingExpenses / 12,
    operatingExpenseRatio: oer,
    replacementReservesInOpex:
      expenseResult.details.find((d) => d.key === 'reserve')?.annualAmount ?? 0,
    immediateCapex: calculateImmediateCapex(deal.capex),
    annualCapexReserves: calculateAnnualCapexReserves(deal.capex),
    noi,
    capRate,
    grm: calculateGRM(price, gri),
    purchasePrice: price,
    downPayment,
    loanAmount,
    ltv,
    ltvDenominator: 'Purchase Price',
    ltc,
    pointsCost,
    financingFees,
    buyerClosingCosts: closing,
    monthlyPI: amortization.monthlyPayment,
    annualDebtService,
    dscr,
    cashFlowAnnual,
    cashFlowMonthly: cashFlowAnnual / 12,
    totalAcquisitionCost,
    totalCashInvested,
    cashOnCash: coc,
    debtYield,
    breakEvenOccupancy,
    breakEvenRevenue,
    breakEvenMargin: egi - breakEvenRevenue,
    simplifiedBreakEvenOccupancy: simplifiedBreakEven,
    contributionBreakEvenOccupancy: contributionBreakEven,
    breakEvenMethodLabel:
      variableOpex > 0
        ? 'Contribution-margin break-even (variable expenses isolated)'
        : 'Simplified break-even occupancy (all OpEx treated as fixed; same identity as the original calculator)',
    fixedOperatingExpenses: fixedOpex,
    variableOperatingExpenses: variableOpex,
    variableExpenseRatio: gpi > 0 ? variableOpex / gpi : null,
    excludedIncomeDetail: [
      ...deal.units
        .filter((u) => !isBaseCaseUnit(u))
        .map((u) => ({
          label: `Unit ${u.identifier}`,
          annual: unitMonthlyRent(u, deal.assumptions.rentScenario) * 12,
        })),
      ...(deal.unverifiedIncomeMonthly > 0
        ? [{ label: 'Potential / unverified income', annual: unverified }]
        : []),
    ],
    supportedValue,
    askingVsValue,
    askingVsValuePct,
    maxAnnualDebtService,
    supportedLoan,
    maxOffer,
    equity,
    pricePerUnit: calculatePricePerUnit(price, legalUnits),
    pricePerSqft: calculatePricePerSqft(price, deal.property.squareFootage),
    amortization,
    health,
    traces,
  };
}

const SCENARIO_LABELS: Record<ScenarioName, string> = {
  conservative: 'Conservative',
  base: 'Base',
  upside: 'Upside',
};

function toScenarioResult(
  name: ScenarioName,
  analysis: ReturnType<typeof analyzeWithAdjustments>,
  includesUnverifiedIncome: boolean,
): ScenarioResult {
  return {
    name,
    label: SCENARIO_LABELS[name],
    gri: analysis.gri,
    egi: analysis.egi,
    noi: analysis.noi,
    capRate: analysis.capRate,
    dscr: analysis.dscr,
    cashFlow: analysis.cashFlowAnnual,
    cashOnCash: analysis.cashOnCash,
    debtYield: analysis.debtYield,
    supportedValue: analysis.supportedValue,
    maxOffer: analysis.maxOffer.conservative,
    includesUnverifiedIncome,
  };
}

function interestRow(deal: Deal, rate: number, label: string): SensitivityRow {
  const base = analyzeWithAdjustments(deal, { ...deal.scenarios.base, interestRateOverride: rate }, { includeUnverified: false });
  return {
    label,
    monthlyPI: base.monthlyPI,
    annualDebtService: base.annualDebtService,
    dscr: base.dscr,
    cashFlow: base.cashFlowAnnual,
    cashOnCash: base.cashOnCash,
    noi: base.noi,
    capRate: base.capRate,
  };
}

export function analyzeDeal(deal: Deal): DealAnalysis {
  const baseAdj = deal.scenarios.base;
  const base = analyzeWithAdjustments(deal, baseAdj, { includeUnverified: false });

  const conservative = analyzeWithAdjustments(deal, deal.scenarios.conservative, {
    includeUnverified: false,
  });
  const upsideIncludesUnverified = deal.assumptions.includeUnverifiedInUpside;
  const upside = analyzeWithAdjustments(deal, deal.scenarios.upside, {
    includeUnverified: upsideIncludesUnverified,
  });

  const rate = deal.loan.interestRate;
  const interestSensitivity = [
    interestRow(deal, rate, `Current ${rate.toFixed(2)}%`),
    interestRow(deal, rate + 0.5, '+0.50%'),
    interestRow(deal, rate + 1.0, '+1.00%'),
    interestRow(deal, rate + 1.5, '+1.50%'),
    interestRow(deal, rate + 2.0, '+2.00%'),
  ];

  const rentSensitivity: SensitivityRow[] = [-0.1, -0.05, 0, 0.05, 0.1].map((delta) => {
    const row = analyzeWithAdjustments(
      deal,
      { ...baseAdj, rentMultiplier: finite(baseAdj.rentMultiplier) * (1 + delta) },
      { includeUnverified: false },
    );
    const label = delta === 0 ? 'Base' : `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`;
    return {
      label,
      monthlyPI: row.monthlyPI,
      annualDebtService: row.annualDebtService,
      dscr: row.dscr,
      cashFlow: row.cashFlowAnnual,
      cashOnCash: row.cashOnCash,
      noi: row.noi,
      capRate: row.capRate,
    };
  });

  const expenseSensitivity: SensitivityRow[] = [0, 0.05, 0.1, 0.2].map((delta) => {
    const row = analyzeWithAdjustments(
      deal,
      { ...baseAdj, expenseMultiplier: finite(baseAdj.expenseMultiplier) * (1 + delta) },
      { includeUnverified: false },
    );
    const label = delta === 0 ? 'Base' : `+${(delta * 100).toFixed(0)}%`;
    return {
      label,
      monthlyPI: row.monthlyPI,
      annualDebtService: row.annualDebtService,
      dscr: row.dscr,
      cashFlow: row.cashFlowAnnual,
      cashOnCash: row.cashOnCash,
      noi: row.noi,
      capRate: row.capRate,
    };
  });

  const priceSensitivity: SensitivityRow[] = [0.9, 0.95, 1, 1.05, 1.1].map((mult) => {
    const priced: Deal = {
      ...deal,
      loan: { ...deal.loan, purchasePrice: deal.loan.purchasePrice * mult },
    };
    const row = analyzeWithAdjustments(priced, baseAdj, { includeUnverified: false });
    const label =
      mult === 1 ? 'Asking' : `${mult < 1 ? '' : '+'}${((mult - 1) * 100).toFixed(0)}%`;
    return {
      label,
      monthlyPI: row.monthlyPI,
      annualDebtService: row.annualDebtService,
      dscr: row.dscr,
      cashFlow: row.cashFlowAnnual,
      cashOnCash: row.cashOnCash,
      noi: row.noi,
      capRate: row.capRate,
    };
  });

  const projectedAnnualRent =
    deal.renovation.projectedMonthlyRent > 0
      ? deal.renovation.projectedMonthlyRent * 12
      : base.marketRentAnnual;
  const projectedExpenses =
    deal.renovation.projectedAnnualExpenses > 0
      ? deal.renovation.projectedAnnualExpenses
      : base.operatingExpenses;
  const renovation = calculateRenovationAnalysis({
    currentNoi: base.noi,
    projectedAnnualRent,
    projectedAnnualExpenses: projectedExpenses,
    renovationCost:
      deal.renovation.renovationCost > 0
        ? deal.renovation.renovationCost
        : deal.acquisition.renovationBudget,
    targetCapRate:
      deal.renovation.targetCapRate > 0
        ? deal.renovation.targetCapRate
        : deal.assumptions.targetCapRate,
    currentGri: base.gri,
    renovationMonths: deal.renovation.renovationMonths,
    vacancyDuringRenoPercent: deal.renovation.vacancyDuringRenoPercent,
  });

  const oldDebt =
    deal.refinance.currentLoanBalanceOverride !== null
      ? deal.refinance.currentLoanBalanceOverride
      : base.loanAmount;
  const postNoi =
    deal.refinance.postRenovationNoi !== null
      ? deal.refinance.postRenovationNoi
      : renovation.projectedNoi;
  const refinance = calculateRefinance({
    purchasePrice: base.purchasePrice,
    renovation:
      deal.renovation.renovationCost > 0
        ? deal.renovation.renovationCost
        : deal.acquisition.renovationBudget,
    additionalBasis: deal.refinance.additionalBasis,
    buyerClosingCosts: base.buyerClosingCosts,
    totalCashInvested: base.totalCashInvested,
    postRenovationNoi: postNoi,
    expectedArv:
      deal.refinance.expectedArv > 0
        ? deal.refinance.expectedArv
        : renovation.valueCreated !== null
          ? base.purchasePrice + renovation.valueCreated
          : base.supportedValue ?? base.purchasePrice,
    refinanceLtvPercent: deal.refinance.refinanceLtv,
    refinanceRate: deal.refinance.refinanceRate,
    refinanceAmortizationYears: deal.refinance.refinanceAmortizationYears,
    refinanceCosts: deal.refinance.refinanceCosts,
    oldDebtPayoff: oldDebt,
  });

  const arv =
    deal.refinance.expectedArv > 0
      ? deal.refinance.expectedArv
      : renovation.valueCreated !== null
        ? base.purchasePrice + renovation.valueCreated
        : base.purchasePrice;
  const equity = {
    ...base.equity,
    postRenovationEquity: calculateEquity(arv, base.loanAmount),
    refinanceEquity: calculateEquity(arv, refinance.requestedLoan),
  };

  const stressTests: SensitivityRow[] = [
    { label: 'Base', adj: {} },
    { label: 'Rent −5%', adj: { rentMultiplier: 0.95 } },
    { label: 'Rent −10%', adj: { rentMultiplier: 0.9 } },
    { label: 'Vacancy +5 pts', adj: { vacancyPercentOverride: deal.assumptions.combinedVacancyPercent + 5 } },
    { label: 'Vacancy +10 pts', adj: { vacancyPercentOverride: deal.assumptions.combinedVacancyPercent + 10 } },
    { label: 'Expenses +10%', adj: { expenseMultiplier: 1.1 } },
    { label: 'Expenses +20%', adj: { expenseMultiplier: 1.2 } },
    { label: 'Rate +0.50%', adj: { interestRateOverride: deal.loan.interestRate + 0.5 } },
    { label: 'Rate +1.00%', adj: { interestRateOverride: deal.loan.interestRate + 1 } },
    { label: 'Rate +2.00%', adj: { interestRateOverride: deal.loan.interestRate + 2 } },
  ].map((item) => {
    const row = analyzeWithAdjustments(deal, { ...baseAdj, ...item.adj }, { includeUnverified: false });
    return {
      label: item.label,
      monthlyPI: row.monthlyPI,
      annualDebtService: row.annualDebtService,
      dscr: row.dscr,
      cashFlow: row.cashFlowAnnual,
      cashOnCash: row.cashOnCash,
      noi: row.noi,
      capRate: row.capRate,
    };
  });

  const prices = deal.offerPrices ?? {
    asking: deal.loan.purchasePrice,
    target: Math.round(base.maxOffer.conservative ?? deal.loan.purchasePrice),
    aggressive: Math.round((base.maxOffer.conservative ?? deal.loan.purchasePrice) * 0.95),
    custom: deal.loan.purchasePrice,
  };
  const offerLabels: Record<string, string> = {
    asking: 'Asking price',
    target: 'Target offer',
    aggressive: 'Aggressive offer',
    custom: 'Custom offer',
  };
  const offerRows: SensitivityRow[] = Object.entries(prices)
    .filter(([, price]) => Number.isFinite(price) && price > 0)
    .map(([label, price]) => {
      const row = analyzeWithAdjustments(
        { ...deal, loan: { ...deal.loan, purchasePrice: price } },
        baseAdj,
        { includeUnverified: false },
      );
      return {
        label: offerLabels[label] ?? label,
        monthlyPI: row.monthlyPI,
        annualDebtService: row.annualDebtService,
        dscr: row.dscr,
        cashFlow: row.cashFlowAnnual,
        cashOnCash: row.cashOnCash,
        noi: row.noi,
        capRate: row.capRate,
      };
    });

  const financingCompare: SensitivityRow[] = (deal.financingAlternatives ?? []).map((alt) => {
    const row = analyzeWithAdjustments(
      {
        ...deal,
        loan: {
          ...deal.loan,
          loanType: alt.loanType,
          downPaymentPercent: alt.downPaymentPercent,
          interestRate: alt.interestRate,
          amortizationYears: alt.amortizationYears,
          interestOnlyMonths: alt.interestOnlyMonths,
          points: alt.points,
          lenderFees: alt.lenderFees,
          useManualLoanAmount: false,
        },
      },
      baseAdj,
      { includeUnverified: false },
    );
    return {
      label: alt.label,
      monthlyPI: row.monthlyPI,
      annualDebtService: row.annualDebtService,
      dscr: row.dscr,
      cashFlow: row.cashFlowAnnual,
      cashOnCash: row.cashOnCash,
      noi: row.noi,
      capRate: row.capRate,
    };
  });

  const subjectUnits = deal.property.legalUnitCount || deal.units.filter(isBaseCaseUnit).length;
  const sales = salesComparisonValue(deal.comps ?? [], subjectUnits, deal.property.squareFootage);
  const incomeApproach = base.supportedValue;
  const salesLow = sales.low;
  const salesHigh = sales.high;
  const mixed = [incomeApproach, salesLow, salesHigh].filter((v): v is number => v !== null);
  const valuationRange = {
    incomeApproach,
    salesLow,
    salesHigh,
    indicativeLow: mixed.length ? Math.min(...mixed) : null,
    indicativeHigh: mixed.length ? Math.max(...mixed) : null,
  };

  const sourceConflicts: { field: string; listing: string; official: string }[] = [];
  if (
    deal.property.officialUnitCount != null &&
    deal.property.observedUnitCount != null &&
    deal.property.officialUnitCount !== deal.property.observedUnitCount
  ) {
    sourceConflicts.push({
      field: 'Unit count',
      listing: String(deal.property.observedUnitCount),
      official: String(deal.property.officialUnitCount),
    });
  }

  const breakpoints = [
    {
      label: 'Interest rate where cash flow reaches $0',
      value: interestRateAtZeroCashFlow(base.noi, base.loanAmount, deal.loan.amortizationYears),
      unit: '%',
    },
  ];

  return {
    ...base,
    equity,
    renovation,
    refinance,
    scenarios: {
      conservative: toScenarioResult('conservative', conservative, false),
      base: toScenarioResult('base', base, false),
      upside: toScenarioResult('upside', upside, upsideIncludesUnverified && deal.unverifiedIncomeMonthly > 0),
    },
    interestSensitivity,
    rentSensitivity,
    expenseSensitivity,
    priceSensitivity,
    stressTests,
    breakpoints,
    offerRows,
    financingCompare,
    compSummary: sales.summary,
    valuationRange,
    sourceConflicts,
    completion: calculateCompletion(deal),
  };
}
