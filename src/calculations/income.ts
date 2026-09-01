import type { IncomeStatus, OtherIncomeItem, RentScenario, SpaceType, Unit, VacancyMode } from '../models';
import { clampNonNegative, clampPercent, finite } from './safe';

const QUESTIONABLE_SPACE: SpaceType[] = ['basement', 'cellar', 'attic', 'garage'];

export function resolveIncomeStatus(unit: Unit): IncomeStatus {
  if (unit.incomeStatus === 'user_attested') return 'user_attested';
  if (!unit.legalOccupancyVerified) {
    return unit.incomeStatus && unit.incomeStatus !== 'verified' ? unit.incomeStatus : 'unverified';
  }
  if (unit.incomeStatus) return unit.incomeStatus;
  return 'verified';
}

export function resolveSpaceType(unit: Unit): SpaceType {
  return unit.spaceType ?? 'primary';
}

/**
 * Base-case units: verified or user-attested legal occupancy.
 * Basement / cellar / attic / garage never enter the base case unless status is verified.
 */
export function isBaseCaseUnit(unit: Unit): boolean {
  const status = resolveIncomeStatus(unit);
  const space = resolveSpaceType(unit);
  if (QUESTIONABLE_SPACE.includes(space) && status !== 'verified') return false;
  return status === 'verified' || status === 'user_attested';
}

export function unitMonthlyRent(unit: Unit, scenario: RentScenario): number {
  if (scenario === 'current') return clampNonNegative(unit.currentMonthlyRent);
  if (scenario === 'market') return clampNonNegative(unit.marketMonthlyRent);
  return clampNonNegative(unit.underwrittenMonthlyRent);
}

/** Legal / verified / user-attested units only. Unverified units never enter base-case income. */
export function legalUnits(units: Unit[]): Unit[] {
  return units.filter((unit) => isBaseCaseUnit(unit));
}

export function excludedUnits(units: Unit[]): Unit[] {
  return units.filter((unit) => !isBaseCaseUnit(unit));
}

export function isBaseCaseOtherIncome(item: OtherIncomeItem): boolean {
  const status = item.incomeStatus ?? (item.verified && item.includeInBaseCase ? 'verified' : 'unverified');
  return (status === 'verified' || status === 'user_attested') && item.includeInBaseCase;
}

export function calculateMonthlyLegalRent(units: Unit[], scenario: RentScenario): number {
  return legalUnits(units).reduce((sum, unit) => sum + unitMonthlyRent(unit, scenario), 0);
}

/**
 * GRI — Gross Rental Income.
 * Total scheduled legal rental income before vacancy, expenses, or financing.
 */
export function calculateGRI(units: Unit[], scenario: RentScenario): number {
  return calculateMonthlyLegalRent(units, scenario) * 12;
}

/**
 * GPR — Gross Potential Rent.
 * Rent if every legal unit were rented for the full period at the assumed (typically market) rent.
 */
export function calculateGPR(units: Unit[], scenario: RentScenario = 'market'): number {
  return calculateGRI(units, scenario);
}

export function calculateAnnualRentRoll(
  units: Unit[],
): { current: number; market: number; underwritten: number } {
  return {
    current: calculateGRI(units, 'current'),
    market: calculateGRI(units, 'market'),
    underwritten: calculateGRI(units, 'underwritten'),
  };
}

/**
 * Other legal income included in the base case.
 * Requires verified === true AND includeInBaseCase === true.
 */
export function calculateOtherLegalIncome(items: OtherIncomeItem[]): number {
  return items.reduce((sum, item) => {
    if (isBaseCaseOtherIncome(item)) {
      return sum + clampNonNegative(item.monthlyAmount) * 12;
    }
    return sum;
  }, 0);
}

export function calculateExcludedUnitIncome(units: Unit[], scenario: RentScenario): number {
  return excludedUnits(units).reduce((sum, unit) => sum + unitMonthlyRent(unit, scenario) * 12, 0);
}

export function calculateUnverifiedIncomeAnnual(monthlyAmount: number): number {
  return clampNonNegative(monthlyAmount) * 12;
}

export interface VacancyInputs {
  mode: VacancyMode;
  combinedPercent: number;
  physicalPercent: number;
  collectionPercent: number;
}

export interface VacancyResult {
  vacancyLoss: number;
  collectionLoss: number;
  totalLoss: number;
}

/**
 * Vacancy and collection loss.
 * Combined: totalLoss = GRI × combined rate.
 * Detailed: vacancyLoss = GRI × physical vacancy;
 *           collectionLoss = (GRI − vacancyLoss) × collection rate.
 */
export function calculateVacancyAndCollection(gri: number, inputs: VacancyInputs): VacancyResult {
  const safeGri = clampNonNegative(gri);
  if (inputs.mode === 'combined') {
    const totalLoss = safeGri * (clampPercent(inputs.combinedPercent) / 100);
    return { vacancyLoss: totalLoss, collectionLoss: 0, totalLoss };
  }
  const vacancyLoss = safeGri * (clampPercent(inputs.physicalPercent) / 100);
  const collectionLoss = (safeGri - vacancyLoss) * (clampPercent(inputs.collectionPercent) / 100);
  return { vacancyLoss, collectionLoss, totalLoss: vacancyLoss + collectionLoss };
}

/**
 * EGI = GRI − Vacancy/Collection Loss + Other Legal Income
 * Preserves the original starter formula.
 */
export function calculateEGI(
  gri: number,
  vacancyAndCollectionLoss: number,
  otherLegalIncome: number,
): number {
  return finite(gri) - finite(vacancyAndCollectionLoss) + finite(otherLegalIncome);
}
