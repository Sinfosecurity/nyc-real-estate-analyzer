/** Returns a finite number or the fallback. Never NaN or Infinity. */
export function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampNonNegative(value: number): number {
  const n = finite(value);
  return n < 0 ? 0 : n;
}

export function clampPercent(value: number): number {
  return Math.min(100, clampNonNegative(value));
}

/** Division that returns null instead of Infinity / NaN. */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function asRate(percent: number): number {
  return clampPercent(percent) / 100;
}

export function roundMoney(value: number): number {
  return Math.round(finite(value) * 100) / 100;
}
