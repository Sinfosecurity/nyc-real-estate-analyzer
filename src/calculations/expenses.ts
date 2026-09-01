import type { CapitalExpenseItem, ExpenseBehavior, OperatingExpenseItem } from '../models';
import { clampNonNegative, clampPercent, finite, safeDivide } from './safe';

export function resolveExpenseBehavior(item: OperatingExpenseItem): ExpenseBehavior {
  if (item.behavior) return item.behavior;
  if (item.mode === 'percent_egi' || item.key === 'management') return 'variable';
  return 'fixed';
}

export function variableShare(behavior: ExpenseBehavior): number {
  if (behavior === 'variable') return 1;
  if (behavior === 'semi_variable') return 0.5;
  return 0;
}

export function resolveExpenseAmount(item: OperatingExpenseItem, egi: number): number {
  if (item.mode === 'percent_egi') {
    return finite(egi) * (clampPercent(item.percentOfEgi) / 100);
  }
  return clampNonNegative(item.annualAmount);
}

export function calculateOperatingExpenses(
  items: OperatingExpenseItem[],
  egi: number,
): {
  total: number;
  details: { key: string; label: string; annualAmount: number; behavior: ExpenseBehavior }[];
  fixed: number;
  variable: number;
} {
  const details = items.map((item) => {
    const annualAmount = resolveExpenseAmount(item, egi);
    const behavior = resolveExpenseBehavior(item);
    return { key: item.key, label: item.label, annualAmount, behavior };
  });
  const total = details.reduce((sum, row) => sum + row.annualAmount, 0);
  const variable = details.reduce((sum, row) => sum + row.annualAmount * variableShare(row.behavior), 0);
  const fixed = total - variable;
  return { total, details, fixed, variable };
}

/** NOI = EGI − Operating Expenses. Debt service is never included. */
export function calculateNOI(egi: number, operatingExpenses: number): number {
  return finite(egi) - finite(operatingExpenses);
}

/** Operating Expense Ratio = Operating Expenses ÷ EGI */
export function calculateOperatingExpenseRatio(
  operatingExpenses: number,
  egi: number,
): number | null {
  return safeDivide(operatingExpenses, egi);
}

export function calculateImmediateCapex(items: CapitalExpenseItem[]): number {
  return items.reduce((sum, item) => sum + clampNonNegative(item.immediateCost), 0);
}

export function calculateAnnualCapexReserves(items: CapitalExpenseItem[]): number {
  return items.reduce((sum, item) => {
    if (item.annualReserve > 0) return sum + clampNonNegative(item.annualReserve);
    const life = item.usefulLifeYears;
    const cost = clampNonNegative(item.immediateCost);
    if (life > 0 && cost > 0) return sum + cost / life;
    return sum;
  }, 0);
}
