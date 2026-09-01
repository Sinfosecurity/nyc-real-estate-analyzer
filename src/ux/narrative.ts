import { analyzeDeal } from '../calculations/analyze';
import { isBaseCaseUnit, resolveIncomeStatus, unitMonthlyRent } from '../calculations/income';
import type { Deal, DealAnalysis, DealSignal, Unit } from '../models';
import { money, pct, ratio } from '../utils/format';

export function plainEnglishSignal(signal: DealSignal): { headline: string; body: string } {
  if (signal === 'STRONG REVIEW') {
    return {
      headline: 'This property shows promising fundamentals',
      body: 'The numbers meet most of your targets, but this is not a recommendation to buy. Legal occupancy, title, and NYC records still need independent review.',
    };
  }
  if (signal === 'INVESTIGATE') {
    return {
      headline: 'This property needs further investigation',
      body: 'Some pieces look workable, but one or more financial targets or verification items are unresolved.',
    };
  }
  return {
    headline: 'This property currently fails your investment targets',
    body: 'Under the current asking price, income, expenses, and financing, the deal does not meet the thresholds you set.',
  };
}

export function unitRentLine(unit: Unit, scenario: Deal['assumptions']['rentScenario']): number {
  return unitMonthlyRent(unit, scenario);
}

export function includedUnits(deal: Deal): Unit[] {
  return deal.units.filter((unit) => isBaseCaseUnit(unit));
}

export function excludedUnitList(deal: Deal): Unit[] {
  return deal.units.filter((unit) => !isBaseCaseUnit(unit));
}

export function verifiedMonthlyRent(deal: Deal): number {
  return includedUnits(deal).reduce((sum, unit) => sum + unitRentLine(unit, deal.assumptions.rentScenario), 0);
}

export function potentialMonthlyRent(deal: Deal): number {
  return deal.units.reduce((sum, unit) => sum + unitRentLine(unit, deal.assumptions.rentScenario), 0);
}

export function excludedMonthlyRent(deal: Deal): number {
  return excludedUnitList(deal).reduce(
    (sum, unit) => sum + unitRentLine(unit, deal.assumptions.rentScenario),
    0,
  ) + deal.unverifiedIncomeMonthly;
}

export function whyNumbersAreLow(deal: Deal): string | null {
  const included = includedUnits(deal);
  const excluded = excludedUnitList(deal);
  if (excluded.length === 0) return null;
  const includedRent = verifiedMonthlyRent(deal);
  const excludedRent = excludedMonthlyRent(deal);
  if (excludedRent <= 0) return null;
  return `You entered ${deal.units.length} potential rental unit${deal.units.length === 1 ? '' : 's'}, but only ${included.length} currently qualify for base-case income under your verification settings. The analyzer is therefore underwriting only ${money(includedRent)}/month of rent.`;
}

export function bottomLine(deal: Deal, analysis: DealAnalysis): string[] {
  const paragraphs: string[] = [];
  const asking = analysis.purchasePrice;
  paragraphs.push(
    `At the current asking price of ${money(asking)}, verified income produces ${money(analysis.noi)} of NOI against ${money(analysis.annualDebtService)} of annual debt service.`,
  );
  if (analysis.cashFlowAnnual < 0) {
    paragraphs.push(
      `Monthly cash flow is approximately ${money(analysis.cashFlowMonthly)}. That means operations do not currently cover the modeled mortgage after expenses.`,
    );
  } else {
    paragraphs.push(
      `Monthly cash flow is approximately ${money(analysis.cashFlowMonthly)} before income taxes and owner-specific costs.`,
    );
  }
  const conflict = analysis.sourceConflicts?.[0];
  if (conflict) {
    paragraphs.push(
      `The largest unresolved issue is a ${conflict.field.toLowerCase()} discrepancy. The listing/observed figure is ${conflict.listing} while available official records currently indicate ${conflict.official}.`,
    );
  }
  if (excludedMonthlyRent(deal) > 0) {
    paragraphs.push(
      `Additional rental income of ${money(excludedMonthlyRent(deal))}/month should not be relied upon until legal occupancy and permitted residential use are verified.`,
    );
  }
  if (analysis.maxOffer.conservative != null) {
    paragraphs.push(
      `The conservative maximum offer under your targets is ${money(analysis.maxOffer.conservative)}, controlled by ${analysis.maxOffer.bindingConstraint ?? 'the tightest active constraint'}.`,
    );
  }
  return paragraphs;
}

export interface HealthChip {
  label: string;
  state: 'ok' | 'warn' | 'bad' | 'todo';
  detail: string;
}

export function dealHealthChips(deal: Deal, analysis: DealAnalysis): HealthChip[] {
  const chips: HealthChip[] = [];
  chips.push({
    label: 'Income',
    state: excludedMonthlyRent(deal) > 0 ? 'warn' : analysis.gri > 0 ? 'ok' : 'todo',
    detail:
      excludedMonthlyRent(deal) > 0
        ? 'Some rent is excluded until occupancy is verified.'
        : analysis.gri > 0
          ? 'Base-case rent is entered.'
          : 'No verified rent yet.',
  });
  chips.push({
    label: 'Cash Flow',
    state: analysis.cashFlowAnnual > 0 ? 'ok' : analysis.purchasePrice <= 0 ? 'todo' : 'bad',
    detail: analysis.cashFlowAnnual > 0 ? 'Positive after debt service.' : 'Negative or not yet modeled.',
  });
  const dscrTarget = deal.assumptions.targetDscr;
  chips.push({
    label: 'DSCR',
    state:
      analysis.annualDebtService === 0
        ? 'ok'
        : analysis.dscr != null && analysis.dscr >= dscrTarget
          ? 'ok'
          : analysis.dscr == null
            ? 'todo'
            : 'bad',
    detail:
      analysis.dscr == null
        ? 'Not applicable or not yet computed.'
        : `${ratio(analysis.dscr)} vs your ${dscrTarget.toFixed(2)} target.`,
  });
  chips.push({
    label: 'Cap Rate',
    state:
      analysis.capRate != null && analysis.capRate * 100 >= deal.assumptions.targetCapRate
        ? 'ok'
        : analysis.capRate == null
          ? 'todo'
          : 'bad',
    detail:
      analysis.capRate == null
        ? 'Needs a purchase price and NOI.'
        : `${pct(analysis.capRate)} vs your ${deal.assumptions.targetCapRate}% target.`,
  });
  chips.push({
    label: 'Legal Verification',
    state: analysis.health.legalComplete ? 'ok' : 'warn',
    detail: analysis.health.legalSummary ?? 'Official records still require review.',
  });
  chips.push({
    label: 'Property Records',
    state: (analysis.sourceConflicts ?? []).length > 0 ? 'warn' : deal.property.lastLookupAt ? 'ok' : 'todo',
    detail:
      (analysis.sourceConflicts ?? []).length > 0
        ? 'Listing and official records disagree.'
        : deal.property.lastLookupAt
          ? 'A public-record lookup has been attempted.'
          : 'No official lookup yet.',
  });
  const ddDone = deal.dueDiligence.filter((item) =>
    ['verified', 'resolved', 'not_applicable'].includes(item.status),
  ).length;
  chips.push({
    label: 'Due Diligence',
    state: ddDone === 0 ? 'todo' : ddDone / deal.dueDiligence.length < 0.4 ? 'warn' : 'ok',
    detail: `${ddDone} of ${deal.dueDiligence.length} checks completed.`,
  });
  return chips;
}

export function nextBestAction(deal: Deal, analysis: DealAnalysis): string {
  if (!deal.property.address) return 'Enter the property address so we can look up NYC records.';
  if (deal.loan.purchasePrice <= 0) return 'Enter the asking or purchase price.';
  if ((analysis.sourceConflicts ?? []).length > 0) {
    return 'Verify the legal unit count before relying on income from units that official records may not recognize.';
  }
  if (deal.units.every((u) => unitMonthlyRent(u, deal.assumptions.rentScenario) <= 0)) {
    return 'Add the monthly rent for each unit you intend to underwrite.';
  }
  if (excludedMonthlyRent(deal) > 0 && includedUnits(deal).length === 0) {
    return 'Mark at least one unit as verified or user-attested, or continue conservatively with excluded income.';
  }
  const insurance = deal.expenses.find((e) => e.key === 'insurance');
  if (insurance && insurance.annualAmount <= 0) {
    return 'Enter property insurance, or use a clearly labeled estimate, to improve the expense picture.';
  }
  const taxes = deal.expenses.find((e) => e.key === 'taxes');
  if (taxes && taxes.annualAmount <= 0) {
    return 'Enter annual property taxes from a bill or a labeled estimate.';
  }
  if (deal.dueDiligence.filter((d) => d.status === 'issue_found').length > 0) {
    return 'Review the due-diligence issues marked found before making an offer.';
  }
  if (analysis.health.signal !== 'STRONG REVIEW') {
    return 'Open Deal Analysis to see why the numbers miss your targets, then test a lower offer.';
  }
  return 'Your financial assumptions are complete enough to review Deal Analysis and the report.';
}

export interface PriorityAlert {
  severity: 'critical' | 'warning' | 'information';
  title: string;
  body: string;
}

export function priorityAlerts(deal: Deal, analysis: DealAnalysis): PriorityAlert[] {
  const alerts: PriorityAlert[] = [];
  for (const conflict of analysis.sourceConflicts ?? []) {
    alerts.push({
      severity: 'critical',
      title: `Official ${conflict.field.toLowerCase()} conflicts with the listing`,
      body: `Listing/observed: ${conflict.listing}. Official record: ${conflict.official}. Additional-unit income stays out of the base case until you resolve this.`,
    });
  }
  if (excludedMonthlyRent(deal) > 0) {
    alerts.push({
      severity: 'warning',
      title: 'Some rent is excluded from the base case',
      body: `${money(excludedMonthlyRent(deal))}/month is shown as potential income until legal occupancy is verified.`,
    });
  }
  const insurance = deal.expenses.find((e) => e.key === 'insurance');
  if (insurance && insurance.annualAmount > 0 && !deal.property.lastLookupAt) {
    alerts.push({
      severity: 'information',
      title: 'Insurance is a user assumption',
      body: 'This is not an official premium quote.',
    });
  }
  if ((deal.comps ?? []).length === 0) {
    alerts.push({
      severity: 'information',
      title: 'Comparable sales have not been completed',
      body: 'The income approach still works. Sales comparison stays empty until you add manual comps.',
    });
  }
  return alerts;
}

export function investorAnswers(deal: Deal, analysis: DealAnalysis): { q: string; a: string }[] {
  return [
    {
      q: 'Why is cash flow negative?',
      a:
        analysis.cashFlowAnnual >= 0
          ? `Cash flow is currently ${money(analysis.cashFlowAnnual)} per year, which is not negative under these assumptions.`
          : `Cash flow is NOI minus the mortgage. NOI is ${money(analysis.noi)}; annual debt service is ${money(analysis.annualDebtService)}. The difference is ${money(analysis.cashFlowAnnual)}.`,
    },
    {
      q: 'Why is DSCR low?',
      a:
        analysis.dscr == null
          ? 'DSCR is not applicable when there is no mortgage, or not yet computed.'
          : `DSCR is NOI ÷ annual debt service = ${money(analysis.noi)} ÷ ${money(analysis.annualDebtService)} = ${ratio(analysis.dscr)}. Your target is ${deal.assumptions.targetDscr.toFixed(2)}.`,
    },
    {
      q: 'What does cap rate mean?',
      a: `Cap rate is NOI ÷ purchase price. Here that is ${money(analysis.noi)} ÷ ${money(analysis.purchasePrice)} = ${pct(analysis.capRate)}. It is an unleveraged yield, not a grade.`,
    },
    {
      q: 'Why was rent excluded?',
      a:
        excludedMonthlyRent(deal) <= 0
          ? 'No rent is currently excluded from the base case.'
          : (whyNumbersAreLow(deal) ??
            'Unverified or questionable space is excluded until legal occupancy is verified.'),
    },
    {
      q: 'What should I offer?',
      a: `The conservative maximum under your active constraints is ${money(analysis.maxOffer.conservative)}. The controlling constraint is ${analysis.maxOffer.bindingConstraint ?? 'not yet determined'}. This is a screening ceiling, not a bid.`,
    },
    {
      q: 'What would make this deal work?',
      a: 'Use the offer slider and the “What would make this deal work?” breakpoints on the Analysis step. Those numbers come from the same engine as the rest of the deal.',
    },
    {
      q: 'What should I verify before buying?',
      a: 'Legal unit count, Certificate of Occupancy, DOB/HPD/OATH records, rent-regulation status, taxes, insurance, leases, and title. Completing a checklist row does not retrieve or certify official records.',
    },
  ];
}

export function priceForTargetMonthlyCashFlow(deal: Deal, monthlyTarget: number): number | null {
  if (deal.loan.purchasePrice <= 0 && monthlyTarget === 0) return 0;
  let low = 0;
  let high = Math.max(deal.loan.purchasePrice * 2, 2_000_000);
  let found = false;
  for (let i = 0; i < 36; i += 1) {
    const mid = (low + high) / 2;
    const trial = analyzeDeal({
      ...deal,
      loan: { ...deal.loan, purchasePrice: mid, useManualLoanAmount: false },
    });
    if (trial.cashFlowMonthly >= monthlyTarget) {
      high = mid;
      found = true;
    } else {
      low = mid;
    }
  }
  return found ? high : null;
}

export function exclusionReason(unit: Unit): string {
  const status = resolveIncomeStatus(unit);
  const space = unit.spaceType ?? 'primary';
  if (['basement', 'cellar', 'attic', 'garage'].includes(space) && status !== 'verified') {
    return 'Questionable space is excluded until legal occupancy is verified.';
  }
  if (status === 'unverified' || status === 'excluded' || status === 'potentially_non_conforming') {
    return 'Legal occupancy is not verified.';
  }
  return 'Not included in the conservative base case.';
}
