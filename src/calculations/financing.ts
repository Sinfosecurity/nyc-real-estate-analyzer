import type { AcquisitionCosts, AmortizationRow, AmortizationSummary, Loan } from '../models';
import { clampNonNegative, clampPercent, finite, safeDivide } from './safe';

/**
 * Standard fully-amortizing monthly principal and interest.
 * Zero interest: payment = principal / months.
 * Preserves the starter calculator formula.
 */
export function calculateMortgagePayment(
  principal: number,
  annualRatePercent: number,
  years: number,
): number {
  const amount = clampNonNegative(principal);
  if (amount <= 0) return 0;
  const termYears = finite(years);
  if (termYears <= 0) return 0;
  const months = Math.max(1, Math.round(termYears * 12));
  const monthlyRate = finite(annualRatePercent) / 100 / 12;
  if (monthlyRate === 0) return amount / months;
  const factor = (1 + monthlyRate) ** months;
  const payment = (amount * (monthlyRate * factor)) / (factor - 1);
  return finite(payment);
}

/** Present value of an amortizing loan given a target monthly payment. */
export function loanFromPayment(
  monthlyPayment: number,
  annualRatePercent: number,
  years: number,
): number {
  const payment = clampNonNegative(monthlyPayment);
  if (payment <= 0) return 0;
  const termYears = finite(years);
  if (termYears <= 0) return 0;
  const months = Math.max(1, Math.round(termYears * 12));
  const monthlyRate = finite(annualRatePercent) / 100 / 12;
  if (monthlyRate === 0) return payment * months;
  const factor = (1 + monthlyRate) ** months;
  return finite((payment * (factor - 1)) / (monthlyRate * factor));
}

export function calculateMonthlyPaymentWithIO(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number,
  interestOnlyMonths: number,
): number {
  const amount = clampNonNegative(principal);
  if (amount <= 0) return 0;
  const ioMonths = Math.max(0, Math.floor(finite(interestOnlyMonths)));
  const amortMonths = Math.max(1, Math.round(finite(amortizationYears) * 12));
  const monthlyRate = finite(annualRatePercent) / 100 / 12;

  if (ioMonths > 0 && ioMonths < amortMonths) {
    return monthlyRate === 0 ? 0 : amount * monthlyRate;
  }
  if (ioMonths >= amortMonths) {
    return monthlyRate === 0 ? 0 : amount * monthlyRate;
  }
  return calculateMortgagePayment(amount, annualRatePercent, amortizationYears);
}

function addMonths(isoDate: string, months: number): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function calculateAmortization(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number,
  interestOnlyMonths = 0,
  startDate?: string,
  termYears?: number,
): AmortizationSummary {
  const amount = clampNonNegative(principal);
  const amortMonths = Math.max(0, Math.round(finite(amortizationYears) * 12));
  const termMonths = termYears
    ? Math.max(1, Math.round(finite(termYears) * 12))
    : amortMonths;
  const scheduledMonths = Math.min(amortMonths, termMonths);
  const balloon = termMonths < amortMonths;
  const ioMonths = Math.min(Math.max(0, Math.floor(finite(interestOnlyMonths))), scheduledMonths);
  const monthlyRate = finite(annualRatePercent) / 100 / 12;
  const remainingAmortMonths = Math.max(1, amortMonths - ioMonths);
  const amortizingPayment =
    monthlyRate === 0
      ? amount / remainingAmortMonths
      : calculateMortgagePayment(amount, annualRatePercent, remainingAmortMonths / 12);

  const schedule: AmortizationRow[] = [];
  let balance = amount;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let year1Principal = 0;
  let year1Interest = 0;

  for (let period = 1; period <= scheduledMonths && balance > 0.0001; period += 1) {
    const beginningBalance = balance;
    const inIo = period <= ioMonths;
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let principalPaid: number;
    let payment: number;

    if (inIo) {
      payment = interest;
      principalPaid = 0;
    } else if (period === amortMonths && !balloon) {
      principalPaid = balance;
      payment = balance + interest;
    } else {
      payment = amortizingPayment;
      principalPaid = Math.min(balance, Math.max(0, payment - interest));
    }

    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    totalPrincipal += principalPaid;
    if (period <= 12) {
      year1Principal += principalPaid;
      year1Interest += interest;
    }

    schedule.push({
      period,
      payment,
      principal: principalPaid,
      interest,
      balance,
      interestOnly: inIo,
      beginningBalance,
      date: startDate ? addMonths(startDate, period - 1) : undefined,
    });
  }

  const currentMonthly = schedule[0]?.payment ?? 0;

  return {
    monthlyPayment: currentMonthly,
    annualDebtService: currentMonthly * 12,
    totalInterest,
    totalPrincipal,
    remainingBalance: balance,
    year1Principal,
    year1Interest,
    year5Balance: schedule[Math.min(60, schedule.length) - 1]?.balance,
    year10Balance: schedule[Math.min(120, schedule.length) - 1]?.balance,
    schedule,
  };
}

export function remainingBalanceAfterPayments(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number,
  paymentsMade: number,
  interestOnlyMonths = 0,
): number {
  const summary = calculateAmortization(
    principal,
    annualRatePercent,
    amortizationYears,
    interestOnlyMonths,
  );
  if (paymentsMade <= 0) return clampNonNegative(principal);
  const row = summary.schedule[Math.min(paymentsMade, summary.schedule.length) - 1];
  return row ? row.balance : 0;
}

export function resolveLoanAmount(loan: Loan): number {
  const price = clampNonNegative(loan.purchasePrice);
  if (loan.useManualLoanAmount) {
    return Math.min(price, clampNonNegative(loan.loanAmount));
  }
  const downPct = clampPercent(loan.downPaymentPercent) / 100;
  return Math.max(0, price - price * downPct);
}

export function calculateDownPayment(purchasePrice: number, loanAmount: number): number {
  return Math.max(0, clampNonNegative(purchasePrice) - clampNonNegative(loanAmount));
}

export function calculateBuyerClosingCosts(costs: AcquisitionCosts): number {
  return (
    clampNonNegative(costs.attorney) +
    clampNonNegative(costs.inspection) +
    clampNonNegative(costs.appraisal) +
    clampNonNegative(costs.mortgageRelated) +
    clampNonNegative(costs.title) +
    clampNonNegative(costs.recording) +
    clampNonNegative(costs.transfer) +
    clampNonNegative(costs.broker) +
    clampNonNegative(costs.escrow) +
    clampNonNegative(costs.otherClosing)
  );
}

export function calculateTotalAcquisitionCost(
  purchasePrice: number,
  costs: AcquisitionCosts,
  financingFees: number,
): number {
  return (
    clampNonNegative(purchasePrice) +
    calculateBuyerClosingCosts(costs) +
    clampNonNegative(costs.renovationBudget) +
    clampNonNegative(financingFees)
  );
}

export function calculateTotalCashInvested(input: {
  downPayment: number;
  buyerClosingCosts: number;
  renovation: number;
  financingFees: number;
  initialReserves: number;
}): number {
  return (
    clampNonNegative(input.downPayment) +
    clampNonNegative(input.buyerClosingCosts) +
    clampNonNegative(input.renovation) +
    clampNonNegative(input.financingFees) +
    clampNonNegative(input.initialReserves)
  );
}

export function calculatePointsCost(loanAmount: number, points: number): number {
  return clampNonNegative(loanAmount) * (clampNonNegative(points) / 100);
}

/** LTV = Loan Amount ÷ Purchase Price. Denominator is always purchase price in this engine. */
export function calculateLTV(loanAmount: number, purchasePrice: number): number | null {
  return safeDivide(loanAmount, purchasePrice);
}

/** LTC = Loan Amount ÷ Total Project Cost */
export function calculateLTC(loanAmount: number, totalProjectCost: number): number | null {
  return safeDivide(loanAmount, totalProjectCost);
}

export function calculateDebtService(monthlyPayment: number): number {
  return clampNonNegative(monthlyPayment) * 12;
}
