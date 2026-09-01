import type { DealHealth, DealSignal, UnderwritingTest } from '../models';
import { money, pct, ratio } from '../utils/format';

export interface HealthInput {
  noi: number;
  capRate: number | null;
  targetCapRate: number;
  dscr: number | null;
  targetDscr: number;
  cashOnCash: number | null;
  minCashOnCash: number;
  ltv: number | null;
  maxLtv: number;
  cashFlow: number;
  annualDebtService: number;
  legalComplete?: boolean;
  criticalIssues?: string[];
}

/**
 * Deal-health signal. Uses the starter app's threshold logic:
 * STRONG REVIEW when NOI > 0, cash flow > 0, and at least 5 tests meet;
 * INVESTIGATE when NOI > 0 and at least 3 tests meet;
 * PASS otherwise.
 * The original label "BUY / STRONG REVIEW" is now "STRONG REVIEW" only.
 */
export function calculateDealHealth(input: HealthInput): DealHealth {
  const tests: UnderwritingTest[] = [
    {
      metric: 'Cap Rate',
      actualLabel: pct(input.capRate),
      targetLabel: `≥ ${pct(input.targetCapRate / 100)}`,
      meets: input.capRate !== null && input.capRate * 100 >= input.targetCapRate - 1e-9,
      detail: 'Unleveraged yield versus the user target cap rate.',
    },
    {
      metric: 'DSCR',
      actualLabel: input.annualDebtService === 0 ? 'N/A' : ratio(input.dscr),
      targetLabel: `≥ ${input.targetDscr.toFixed(2)} (user target)`,
      meets: input.annualDebtService === 0 || (input.dscr !== null && input.dscr >= input.targetDscr),
      detail: 'NOI coverage of annual debt service versus the user underwriting target.',
    },
    {
      metric: 'Cash-on-Cash',
      actualLabel: pct(input.cashOnCash),
      targetLabel: `≥ ${pct(input.minCashOnCash / 100)}`,
      meets: input.cashOnCash !== null && input.cashOnCash * 100 >= input.minCashOnCash - 1e-9,
      detail: 'Pre-tax cash flow versus total cash invested.',
    },
    {
      metric: 'LTV',
      actualLabel: pct(input.ltv),
      targetLabel: `≤ ${pct(input.maxLtv / 100)}`,
      meets: input.ltv !== null && input.ltv * 100 <= input.maxLtv + 1e-9,
      detail: 'Loan amount ÷ purchase price versus the user maximum LTV.',
    },
    {
      metric: 'Annual Cash Flow',
      actualLabel: money(input.cashFlow),
      targetLabel: '> $0',
      meets: input.cashFlow > 0,
      detail: 'NOI minus annual debt service.',
    },
    {
      metric: 'NOI',
      actualLabel: money(input.noi),
      targetLabel: '> $0',
      meets: input.noi > 0,
      detail: 'Property operations must produce positive income before financing.',
    },
  ];

  const passedCount = tests.filter((test) => test.meets).length;
  const totalCount = tests.length;

  let financialSignal: DealSignal = 'PASS';
  let summary =
    'The current base-case assumptions fail several of your underwriting thresholds. Revisit price, rent, expenses, or financing before proceeding.';

  if (input.noi > 0 && input.cashFlow > 0 && passedCount >= 5) {
    financialSignal = 'STRONG REVIEW';
    summary =
      'The base-case numbers meet most or all selected thresholds. Continue with legal, physical, title, rent-roll, comparable-sales, lender, and NYC building-record due diligence before making an acquisition decision. This is not a recommendation to purchase.';
  } else if (input.noi > 0 && passedCount >= 3) {
    financialSignal = 'INVESTIGATE';
    summary =
      'The deal shows some workable economics but misses one or more key targets. Review asking price, rents, expenses, financing terms, legal occupancy, and value-creation opportunities.';
  }

  const criticalIssues = input.criticalIssues ?? [];
  const legalComplete = input.legalComplete !== false && criticalIssues.length === 0;
  let signal: DealSignal = financialSignal;
  let legalSummary = legalComplete
    ? 'Legal occupancy for underwritten units is user-attested or verified. Official records still require independent review.'
    : 'LEGAL VERIFICATION INCOMPLETE — at least one underwritten unit or occupancy question is unresolved.';

  if (criticalIssues.length > 0) {
    legalSummary = `Critical issues: ${criticalIssues.join('; ')}`;
  }

  if (financialSignal === 'STRONG REVIEW' && (!legalComplete || criticalIssues.length > 0)) {
    signal = 'INVESTIGATE';
    summary = `FINANCIAL RESULT: STRONG REVIEW. LEGAL VERIFICATION: INCOMPLETE. OVERALL: INVESTIGATE. ${summary}`;
  }

  return {
    signal,
    summary,
    tests,
    passedCount,
    totalCount,
    financialSignal,
    legalComplete,
    legalSummary,
    criticalIssues,
  };
}

export { money, pct, ratio };
