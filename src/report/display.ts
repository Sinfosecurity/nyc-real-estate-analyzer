import { money, pct, ratio, signedMoney } from '../utils/format';

export function moneyCell(value: number | null | undefined): string {
  return money(value);
}

export function moneyOrNotProvided(
  amount: number,
  provided: boolean,
): string {
  if (!provided) return 'NOT PROVIDED';
  return money(amount);
}

export function formatDscr(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
  return `${ratio(value)}x`;
}

export function formatPct(value: number | null | undefined): string {
  return pct(value);
}

export function formatSigned(value: number | null | undefined): string {
  return signedMoney(value);
}

export function formatDate(iso = new Date().toISOString()): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function suspiciousMonthlyRent(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 100;
}

export function expectedUnitsFromPropertyType(propertyType: string): number | null {
  const normalized = propertyType.trim().toLowerCase();
  if (normalized === '1-family') return 1;
  if (normalized === '2-family') return 2;
  if (normalized === '3-family') return 3;
  if (normalized === '4-family') return 4;
  return null;
}

export const REPORT_DISCLAIMER =
  'This report is an underwriting and educational screening tool based on information and assumptions entered or retrieved at the time of analysis. It is not an appraisal, legal opinion, lending commitment, tax opinion, or recommendation to purchase. NYC property records, legal occupancy, title, leases, physical condition and other material facts should be independently verified.';
