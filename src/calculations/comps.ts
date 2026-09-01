import type { CompSale } from '../models';
import { clampNonNegative, safeDivide } from './safe';

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarizeComps(comps: CompSale[]) {
  const prices = comps.map((c) => clampNonNegative(c.salePrice)).filter((v) => v > 0);
  const psf = comps
    .map((c) => safeDivide(c.salePrice, c.buildingSqft))
    .filter((v): v is number => v !== null);
  const perUnit = comps
    .map((c) => safeDivide(c.salePrice, c.legalUnits))
    .filter((v): v is number => v !== null);
  return {
    count: comps.length,
    averagePrice: average(prices),
    medianPrice: median(prices),
    averagePsf: average(psf),
    averagePerUnit: average(perUnit),
    rangeLow: prices.length ? Math.min(...prices) : null,
    rangeHigh: prices.length ? Math.max(...prices) : null,
  };
}

export function salesComparisonValue(comps: CompSale[], subjectUnits: number, subjectSqft: number) {
  const summary = summarizeComps(comps);
  const fromUnits =
    summary.averagePerUnit !== null && subjectUnits > 0 ? summary.averagePerUnit * subjectUnits : null;
  const fromSqft =
    summary.averagePsf !== null && subjectSqft > 0 ? summary.averagePsf * subjectSqft : null;
  const indications = [fromUnits, fromSqft, summary.medianPrice].filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  return {
    summary,
    fromUnits,
    fromSqft,
    low: indications.length ? Math.min(...indications) : null,
    high: indications.length ? Math.max(...indications) : null,
  };
}
