import { createDefaultDeal } from '../constants/defaults';
import type { Deal, IncomeStatus, OperatingExpenseItem, Unit } from '../models';

const CURRENT = 3;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if ('__proto__' in (value as object) || 'constructor' in (value as object) && (value as { constructor?: unknown }).constructor !== Object) {
    // still allow normal objects; reject explicit proto pollution keys below
  }
  if (Object.prototype.hasOwnProperty.call(value, '__proto__')) return null;
  return value as Record<string, unknown>;
}

function migrateUnit(unit: Unit): Unit {
  const incomeStatus: IncomeStatus =
    unit.incomeStatus ?? (unit.legalOccupancyVerified ? 'verified' : 'unverified');
  return {
    ...unit,
    incomeStatus,
    rentRegulationStatus: unit.rentRegulationStatus ?? (unit.rentStabilized ? 'stabilized' : 'unknown'),
    spaceType: unit.spaceType ?? 'primary',
    legalOccupancyVerified: incomeStatus === 'verified' || incomeStatus === 'user_attested',
  };
}

function migrateExpense(item: OperatingExpenseItem): OperatingExpenseItem {
  return {
    ...item,
    behavior: item.behavior ?? (item.mode === 'percent_egi' || item.key === 'management' ? 'variable' : 'fixed'),
  };
}

export function migrateDeal(raw: unknown): Deal {
  const incoming = asRecord(raw);
  if (!incoming) {
    throw new Error('Invalid deal payload.');
  }
  const base = createDefaultDeal();
  const property = asRecord(incoming.property) ?? {};
  const loan = asRecord(incoming.loan) ?? {};
  const merged: Deal = {
    ...base,
    ...(incoming as unknown as Deal),
    id: typeof incoming.id === 'string' ? incoming.id : base.id,
    name: typeof incoming.name === 'string' ? incoming.name : base.name,
    property: {
      ...base.property,
      ...(property as unknown as Deal['property']),
      tax: {
        currentAnnual: base.property.tax?.currentAnnual ?? 8000,
        listingReported: null,
        officialRecord: null,
        userUnderwritten: 8000,
        sourceUsed: 'underwritten',
        marketValue: null,
        assessedValue: null,
        taxableValue: null,
        ...(asRecord(property.tax) as unknown as Deal['property']['tax']),
      },
    },
    loan: { ...base.loan, ...(loan as unknown as Deal['loan']) },
    units: Array.isArray(incoming.units) ? (incoming.units as Unit[]).map(migrateUnit) : base.units,
    expenses: Array.isArray(incoming.expenses)
      ? (incoming.expenses as OperatingExpenseItem[]).map(migrateExpense)
      : base.expenses,
    otherIncome: Array.isArray(incoming.otherIncome) ? incoming.otherIncome : base.otherIncome,
    comps: Array.isArray(incoming.comps) ? incoming.comps : [],
    risks: Array.isArray(incoming.risks) ? incoming.risks : [],
    documents: Array.isArray(incoming.documents) ? incoming.documents : [],
    snapshots: Array.isArray(incoming.snapshots) ? incoming.snapshots : [],
    renovationLines: Array.isArray(incoming.renovationLines) ? incoming.renovationLines : [],
    financingAlternatives: Array.isArray(incoming.financingAlternatives)
      ? incoming.financingAlternatives
      : [],
    offerPrices: incoming.offerPrices && typeof incoming.offerPrices === 'object'
      ? (incoming.offerPrices as Deal['offerPrices'])
      : { asking: Number(loan.purchasePrice) || 1_200_000, target: 0, aggressive: 0, custom: 0 },
    schemaVersion: CURRENT,
  };
  return merged;
}

export function validateImportJson(json: string): unknown {
  if (json.length > 2_000_000) {
    throw new Error('Import file is too large.');
  }
  if (json.includes('__proto__') || json.includes('constructor.prototype')) {
    throw new Error('Rejected import: potentially unsafe JSON keys.');
  }
  const parsed: unknown = JSON.parse(json);
  return parsed;
}

export const CURRENT_SCHEMA_VERSION = CURRENT;
