import type { DealSignal } from '../models';

export type ReportKind = 'executive' | 'full' | 'diligence';

export type ReportClass = 'PRELIMINARY UNDERWRITING' | 'DUE DILIGENCE UNDERWRITING' | 'FINAL INVESTMENT REVIEW';

export type ConfidenceLevel = 'PRELIMINARY' | 'MODERATE' | 'HIGH';

export type ReadinessLevel = 'READY' | 'READY WITH WARNINGS' | 'NOT READY';

export type ConflictSeverity = 'critical' | 'warning' | 'info';

export interface ReportConflict {
  id: string;
  severity: ConflictSeverity;
  title: string;
  explanation: string;
}

export interface ReadinessCheck {
  id: string;
  label: string;
  state: 'pass' | 'warn' | 'open';
  detail?: string;
}

export interface ExpenseCompleteness {
  complete: boolean;
  providedLabels: string[];
  missingLabels: string[];
  annualOperatingExpenses: number;
  warning: string | null;
}

export interface ReportReadiness {
  level: ReadinessLevel;
  reportClass: ReportClass;
  confidence: ConfidenceLevel;
  financialSignal: DealSignal;
  overallStatus: string;
  financialCompleteness: number;
  recordVerification: number;
  dueDiligence: number;
  overallCompleteness: number;
  checks: ReadinessCheck[];
  conflicts: ReportConflict[];
  criticalCount: number;
  warningCount: number;
  expense: ExpenseCompleteness;
  generateLabel: string;
}

export interface OfferScenarioRow {
  key: string;
  label: string;
  price: number;
  downPayment: number;
  loan: number;
  cashRequired: number;
  noi: number;
  capRate: number | null;
  dscr: number | null;
  cashFlowMonthly: number;
  cashOnCash: number | null;
  vsAsking: number | null;
}

export interface PricePosition {
  asking: number;
  conservativeMax: number | null;
  incomeValue: number | null;
  difference: number | null;
  differencePct: number | null;
  insideRange: boolean | null;
  explanation: string;
}

export interface SupportItem {
  tone: 'support' | 'break';
  text: string;
}

export interface ReportBreakpoint {
  label: string;
  value: number | null;
  unit: string;
  kind: 'break' | 'improve';
}
