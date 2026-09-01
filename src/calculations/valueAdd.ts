import type { CalculationTrace, RefinanceAnalysis, RenovationAnalysis } from '../models';
import { calculateMortgagePayment } from './financing';
import { calculateCashFlow, calculateCashOnCash, calculateDSCR, calculateSupportedValue } from './returns';
import { clampNonNegative, clampPercent, finite, safeDivide } from './safe';

export function calculateValueCreated(noiIncrease: number, targetCapRatePercent: number): number | null {
  return calculateSupportedValue(noiIncrease, targetCapRatePercent);
}

export function calculateRenovationAnalysis(input: {
  currentNoi: number;
  projectedAnnualRent: number;
  projectedAnnualExpenses: number;
  renovationCost: number;
  targetCapRate: number;
  currentGri: number;
  renovationMonths: number;
  vacancyDuringRenoPercent: number;
}): RenovationAnalysis {
  const projectedNoi = finite(input.projectedAnnualRent) - finite(input.projectedAnnualExpenses);
  const noiIncrease = projectedNoi - finite(input.currentNoi);
  const valueCreated = calculateValueCreated(noiIncrease, input.targetCapRate);
  const cost = clampNonNegative(input.renovationCost);
  const valueVsCost = valueCreated === null ? null : valueCreated - cost;
  const returnOnRenovationCapital = safeDivide(valueVsCost ?? 0, cost);
  const holdingVacancyLoss =
    finite(input.currentGri) *
    (clampPercent(input.vacancyDuringRenoPercent) / 100) *
    (clampNonNegative(input.renovationMonths) / 12);

  const traces: CalculationTrace[] = [
    {
      title: 'Projected NOI',
      lines: [
        { label: 'Projected annual rent (legal)', value: input.projectedAnnualRent, operator: '−' },
        { label: 'Projected operating expenses', value: input.projectedAnnualExpenses, operator: '=' },
      ],
      resultLabel: 'Projected NOI',
      result: projectedNoi,
    },
    {
      title: 'NOI Increase',
      lines: [
        { label: 'Projected NOI', value: projectedNoi, operator: '−' },
        { label: 'Current NOI', value: input.currentNoi, operator: '=' },
      ],
      resultLabel: 'NOI Increase',
      result: noiIncrease,
    },
    {
      title: 'Value Created',
      lines: [
        { label: 'NOI Increase', value: noiIncrease, operator: '÷' },
        { label: 'Target Cap Rate', value: input.targetCapRate, isPercent: true, operator: '=' },
      ],
      resultLabel: 'Estimated Value Created',
      result: valueCreated,
      note: 'Value Created = NOI Increase ÷ Target Cap Rate. This is an estimate, not an appraisal.',
    },
    {
      title: 'Return on Renovation Capital',
      lines: [
        { label: 'Value Created − Renovation Cost', value: valueVsCost, operator: '÷' },
        { label: 'Renovation Cost', value: cost, operator: '=' },
      ],
      resultLabel: 'Return on Renovation Capital',
      result: returnOnRenovationCapital === null ? null : returnOnRenovationCapital * 100,
      resultIsPercent: true,
    },
  ];

  return {
    currentNoi: input.currentNoi,
    projectedNoi,
    noiIncrease,
    valueCreated,
    renovationCost: cost,
    valueVsCost,
    returnOnRenovationCapital,
    holdingVacancyLoss,
    traces,
  };
}

export function calculateRefinance(input: {
  purchasePrice: number;
  renovation: number;
  additionalBasis: number;
  buyerClosingCosts: number;
  totalCashInvested: number;
  postRenovationNoi: number;
  expectedArv: number;
  refinanceLtvPercent: number;
  refinanceRate: number;
  refinanceAmortizationYears: number;
  refinanceCosts: number;
  oldDebtPayoff: number;
  requestedLtvPercent?: number;
}): RefinanceAnalysis {
  const totalBasis =
    clampNonNegative(input.purchasePrice) +
    clampNonNegative(input.renovation) +
    clampNonNegative(input.additionalBasis) +
    clampNonNegative(input.buyerClosingCosts);
  const arv = clampNonNegative(input.expectedArv);
  const refiLtv = clampPercent(input.refinanceLtvPercent) / 100;
  const maxRefinanceLoan = arv * refiLtv;
  const requestedLoan = maxRefinanceLoan;
  const oldDebtPayoff = clampNonNegative(input.oldDebtPayoff);
  const cashFromRefinance = Math.max(
    0,
    requestedLoan - oldDebtPayoff - clampNonNegative(input.refinanceCosts),
  );
  const remainingEquity = arv - requestedLoan;
  const cashLeftInDeal = clampNonNegative(input.totalCashInvested) - cashFromRefinance;
  const monthly = calculateMortgagePayment(
    requestedLoan,
    input.refinanceRate,
    input.refinanceAmortizationYears,
  );
  const debtService = monthly * 12;
  const postRefiDscr = calculateDSCR(input.postRenovationNoi, debtService);
  const postRefiCashFlow = calculateCashFlow(input.postRenovationNoi, debtService);
  const postRefiCashOnCash = calculateCashOnCash(postRefiCashFlow, Math.max(0, cashLeftInDeal));
  const requestedLtv = input.requestedLtvPercent ?? input.refinanceLtvPercent;
  const exceedsConfiguredLtv = clampPercent(requestedLtv) > clampPercent(input.refinanceLtvPercent) + 1e-9
    ? true
    : arv > 0 && requestedLoan / arv - refiLtv > 1e-9;

  const traces: CalculationTrace[] = [
    {
      title: 'Total Basis',
      lines: [
        { label: 'Purchase Price', value: input.purchasePrice, operator: '+' },
        { label: 'Renovation', value: input.renovation, operator: '+' },
        { label: 'Buyer closing costs', value: input.buyerClosingCosts, operator: '+' },
        { label: 'Additional basis', value: input.additionalBasis, operator: '=' },
      ],
      resultLabel: 'Total Basis',
      result: totalBasis,
    },
    {
      title: 'Maximum Refinance Loan',
      lines: [
        { label: 'Expected ARV', value: arv, operator: '×' },
        { label: 'Refinance LTV', value: input.refinanceLtvPercent, isPercent: true, operator: '=' },
      ],
      resultLabel: 'Maximum Refinance Loan',
      result: maxRefinanceLoan,
    },
    {
      title: 'Cash Available From Refinance',
      lines: [
        { label: 'Refinance loan', value: requestedLoan, operator: '−' },
        { label: 'Old debt payoff', value: oldDebtPayoff, operator: '−' },
        { label: 'Refinance costs', value: input.refinanceCosts, operator: '=' },
      ],
      resultLabel: 'Cash Available From Refinance',
      result: cashFromRefinance,
    },
    {
      title: 'Cash Left in Deal',
      lines: [
        { label: 'Total cash invested', value: input.totalCashInvested, operator: '−' },
        { label: 'Cash from refinance', value: cashFromRefinance, operator: '=' },
      ],
      resultLabel: 'Cash Left in Deal',
      result: cashLeftInDeal,
    },
  ];

  return {
    totalBasis,
    maxRefinanceLoan,
    requestedLoan,
    oldDebtPayoff,
    cashFromRefinance,
    remainingEquity,
    cashLeftInDeal,
    postRefiMonthlyPayment: monthly,
    postRefiDebtService: debtService,
    postRefiDscr,
    postRefiCashFlow,
    postRefiCashOnCash,
    exceedsConfiguredLtv,
    traces,
  };
}
