export type Borough =
  | ''
  | 'Manhattan'
  | 'Brooklyn'
  | 'Queens'
  | 'Bronx'
  | 'Staten Island';

export type OccupancyStatus = 'occupied' | 'vacant' | 'notice';

export type RentScenario = 'current' | 'market' | 'underwritten';

export type LoanType =
  | 'conventional'
  | 'fha'
  | 'va'
  | 'portfolio'
  | 'commercial'
  | 'dscr'
  | 'private'
  | 'hard_money'
  | 'seller'
  | 'custom';

export type ExpenseInputMode = 'dollar' | 'percent_egi';

export type ExpenseBehavior = 'fixed' | 'variable' | 'semi_variable';

export type IncomeStatus =
  | 'verified'
  | 'user_attested'
  | 'unverified'
  | 'potentially_non_conforming'
  | 'excluded';

export type RentRegulationStatus = 'stabilized' | 'controlled' | 'market' | 'unknown';

export type SpaceType = 'primary' | 'basement' | 'cellar' | 'attic' | 'garage' | 'other';

export type FieldProvenance =
  | 'user_entered'
  | 'official_source'
  | 'listing_source'
  | 'calculated'
  | 'unverified';

export type TaxSourceUsed = 'current' | 'listing' | 'official' | 'underwritten';

export type LegalOccupancyFinding =
  | 'verified'
  | 'not_verified'
  | 'records_require_review'
  | 'potential_conflict';

export type VacancyMode = 'combined' | 'detailed';

export type DueDiligenceStatus =
  | 'not_started'
  | 'requested'
  | 'pending'
  | 'verified'
  | 'issue_found'
  | 'resolved'
  | 'not_applicable';

export type DueDiligenceCategory =
  | 'legal'
  | 'dob'
  | 'hpd'
  | 'oath'
  | 'zoning'
  | 'title'
  | 'tenancy'
  | 'leases'
  | 'financial'
  | 'structural'
  | 'mechanical'
  | 'environmental'
  | 'insurance'
  | 'financing'
  | 'appraisal'
  | 'closing'
  | 'property'
  | 'transaction';

export type OtherIncomeCategory =
  | 'parking'
  | 'laundry'
  | 'storage'
  | 'garage'
  | 'commercial'
  | 'antenna'
  | 'other';

export type DealSignal = 'STRONG REVIEW' | 'INVESTIGATE' | 'PASS';

export type ScenarioName = 'conservative' | 'base' | 'upside';

export interface Unit {
  id: string;
  identifier: string;
  bedrooms: number;
  bathrooms: number;
  currentMonthlyRent: number;
  marketMonthlyRent: number;
  underwrittenMonthlyRent: number;
  occupancyStatus: OccupancyStatus;
  leaseExpiration: string;
  rentStabilized: boolean;
  legalOccupancyVerified: boolean;
  tenantPaysElectric: boolean;
  tenantPaysGas: boolean;
  notes: string;
  incomeStatus?: IncomeStatus;
  rentRegulationStatus?: RentRegulationStatus;
  spaceType?: SpaceType;
}

export interface OtherIncomeItem {
  id: string;
  description: string;
  category: OtherIncomeCategory;
  monthlyAmount: number;
  verified: boolean;
  includeInBaseCase: boolean;
  incomeStatus?: IncomeStatus;
}

export interface OperatingExpenseItem {
  id: string;
  key: string;
  label: string;
  annualAmount: number;
  percentOfEgi: number;
  mode: ExpenseInputMode;
  behavior?: ExpenseBehavior;
}

export interface CapitalExpenseItem {
  id: string;
  category: string;
  immediateCost: number;
  expectedYear: number;
  usefulLifeYears: number;
  annualReserve: number;
  notes: string;
}

export interface Loan {
  loanType: LoanType;
  purchasePrice: number;
  loanAmount: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  amortizationYears: number;
  interestOnlyMonths: number;
  points: number;
  lenderFees: number;
  useManualLoanAmount: boolean;
  startDate?: string;
}

export interface AcquisitionCosts {
  attorney: number;
  inspection: number;
  appraisal: number;
  mortgageRelated: number;
  title: number;
  recording: number;
  transfer: number;
  broker: number;
  escrow: number;
  initialReserves: number;
  renovationBudget: number;
  otherClosing: number;
}

export interface UnderwritingAssumptions {
  rentScenario: RentScenario;
  vacancyMode: VacancyMode;
  combinedVacancyPercent: number;
  physicalVacancyPercent: number;
  collectionLossPercent: number;
  targetCapRate: number;
  /** User underwriting target — not a lender requirement. */
  targetDscr: number;
  minCashOnCash: number;
  maxLtv: number;
  /** Explicit opt-in. Never applied to base-case underwriting. */
  includeUnverifiedInUpside: boolean;
  /** Optional cash budget for the financing constraint. Null = no cash cap. */
  maxCashToInvest: number | null;
  /** Explicit annual appreciation assumption. Default 0 — never implied. */
  appreciationRate: number;
}

export interface ScenarioAdjustments {
  rentMultiplier: number;
  vacancyPercentOverride: number | null;
  collectionLossOverride: number | null;
  expenseMultiplier: number;
  interestRateOverride: number | null;
  renovationBudgetOverride: number | null;
  otherIncomeMultiplier: number;
}

export interface RenovationPlan {
  enabled: boolean;
  projectedMonthlyRent: number;
  renovationCost: number;
  renovationMonths: number;
  vacancyDuringRenoPercent: number;
  projectedAnnualExpenses: number;
  targetCapRate: number;
}

export interface RefinanceScenario {
  enabled: boolean;
  additionalBasis: number;
  postRenovationNoi: number | null;
  expectedArv: number;
  refinanceLtv: number;
  refinanceRate: number;
  refinanceAmortizationYears: number;
  refinanceCosts: number;
  currentLoanBalanceOverride: number | null;
}

export interface DueDiligenceItem {
  id: string;
  category: DueDiligenceCategory;
  label: string;
  status: DueDiligenceStatus;
  notes: string;
  source?: string;
  dateChecked?: string;
  documentReference?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  owner?: string;
  followUp?: string;
}

export interface ProvenancedNumber {
  value: number | null;
  provenance: FieldProvenance;
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
}

export interface PropertyTaxModel {
  currentAnnual: number;
  listingReported: number | null;
  officialRecord: number | null;
  userUnderwritten: number;
  sourceUsed: TaxSourceUsed;
  marketValue: number | null;
  assessedValue: number | null;
  taxableValue: number | null;
}

export interface PropertyInfo {
  address: string;
  borough: Borough;
  neighborhood: string;
  zip: string;
  block: string;
  lot: string;
  bbl?: string;
  propertyType: string;
  legalUnitCount: number;
  observedUnitCount?: number;
  yearBuilt: number | null;
  squareFootage: number;
  lotSize: number;
  zoning: string;
  certificateOfOccupancyStatus: string;
  dobStatus: string;
  hpdStatus: string;
  notes: string;
  taxClass?: string;
  listingUrl?: string;
  listingPrice?: number;
  listingSource?: string;
  listingNotes?: string;
  legalOccupancyFinding?: LegalOccupancyFinding;
  tax?: PropertyTaxModel;
  officialUnitCount?: number | null;
  officialZoning?: string;
  lastLookupAt?: string;
  lastLookupSource?: string;
}

export interface CompSale {
  id: string;
  address: string;
  saleDate: string;
  salePrice: number;
  propertyType: string;
  legalUnits: number;
  buildingSqft: number;
  lotSqft: number;
  distanceMiles: number;
  condition: string;
  notes: string;
  source: string;
}

export interface RiskItem {
  id: string;
  category:
    | 'income'
    | 'tenant'
    | 'legal'
    | 'physical'
    | 'financing'
    | 'market'
    | 'construction'
    | 'environmental'
    | 'insurance';
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'open' | 'monitoring' | 'mitigated';
}

export interface DocumentMeta {
  id: string;
  kind:
    | 'listing'
    | 'rent_roll'
    | 'lease'
    | 'tax_bill'
    | 'insurance'
    | 'co'
    | 'dob'
    | 'hpd'
    | 'inspection'
    | 'appraisal'
    | 'loan_quote'
    | 'contract'
    | 'title'
    | 'survey'
    | 'environmental'
    | 'renovation_estimate'
    | 'other';
  label: string;
  reference: string;
  date: string;
  notes: string;
}

export interface AnalysisSnapshot {
  id: string;
  versionLabel: string;
  createdAt: string;
  notes: string;
  purchasePrice: number;
  noi: number;
  capRate: number | null;
  dscr: number | null;
  cashFlow: number;
  cashOnCash: number | null;
  maxOffer: number | null;
  signal: DealSignal;
}

export interface RenovationLine {
  id: string;
  scope: string;
  category: string;
  cost: number;
  contingencyPercent: number;
  start: string;
  durationMonths: number;
  monthlyRentImpact: number;
  status: 'planned' | 'in_progress' | 'complete';
}

export interface OfferPriceSet {
  asking: number;
  target: number;
  aggressive: number;
  custom: number;
}

export interface FinancingAlternative {
  id: string;
  label: string;
  loanType: LoanType;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  interestOnlyMonths: number;
  points: number;
  lenderFees: number;
}

export interface Deal {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion?: number;
  property: PropertyInfo;
  units: Unit[];
  otherIncome: OtherIncomeItem[];
  /** Monthly unverified / potentially non-legal income. Never in base case. */
  unverifiedIncomeMonthly: number;
  expenses: OperatingExpenseItem[];
  capex: CapitalExpenseItem[];
  loan: Loan;
  acquisition: AcquisitionCosts;
  assumptions: UnderwritingAssumptions;
  scenarios: Record<ScenarioName, ScenarioAdjustments>;
  renovation: RenovationPlan;
  refinance: RefinanceScenario;
  dueDiligence: DueDiligenceItem[];
  investorNotes: string;
  comps?: CompSale[];
  risks?: RiskItem[];
  documents?: DocumentMeta[];
  snapshots?: AnalysisSnapshot[];
  renovationLines?: RenovationLine[];
  offerPrices?: OfferPriceSet;
  financingAlternatives?: FinancingAlternative[];
  loanStartDate?: string;
}

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  interestOnly: boolean;
  beginningBalance?: number;
  date?: string;
}

export interface AmortizationSummary {
  monthlyPayment: number;
  annualDebtService: number;
  totalInterest: number;
  totalPrincipal: number;
  remainingBalance: number;
  year1Principal: number;
  year1Interest: number;
  year5Balance?: number;
  year10Balance?: number;
  schedule: AmortizationRow[];
}

export interface CalculationLine {
  label: string;
  value: number | null;
  operator?: '+' | '−' | '×' | '÷' | '=';
  isPercent?: boolean;
}

export interface CalculationTrace {
  title: string;
  lines: CalculationLine[];
  resultLabel: string;
  result: number | null;
  resultIsPercent?: boolean;
  note?: string;
}

export interface UnderwritingTest {
  metric: string;
  actualLabel: string;
  targetLabel: string;
  meets: boolean;
  detail: string;
}

export interface DealHealth {
  signal: DealSignal;
  summary: string;
  tests: UnderwritingTest[];
  passedCount: number;
  totalCount: number;
  financialSignal?: DealSignal;
  legalComplete?: boolean;
  legalSummary?: string;
  criticalIssues?: string[];
}

export interface MaxOfferBreakdown {
  byCapRate: number | null;
  byDscr: number | null;
  byCashOnCash: number | null;
  byFinancing: number | null;
  byLtv?: number | null;
  byAvailableCash?: number | null;
  byRenovationBasis?: number | null;
  conservative: number | null;
  bindingConstraint: string | null;
  traces: CalculationTrace[];
}

export interface RefinanceAnalysis {
  totalBasis: number;
  maxRefinanceLoan: number;
  requestedLoan: number;
  oldDebtPayoff: number;
  cashFromRefinance: number;
  remainingEquity: number;
  cashLeftInDeal: number;
  postRefiMonthlyPayment: number;
  postRefiDebtService: number;
  postRefiDscr: number | null;
  postRefiCashFlow: number;
  postRefiCashOnCash: number | null;
  exceedsConfiguredLtv: boolean;
  traces: CalculationTrace[];
}

export interface RenovationAnalysis {
  currentNoi: number;
  projectedNoi: number;
  noiIncrease: number;
  valueCreated: number | null;
  renovationCost: number;
  valueVsCost: number | null;
  returnOnRenovationCapital: number | null;
  holdingVacancyLoss: number;
  traces: CalculationTrace[];
}

export interface SensitivityRow {
  label: string;
  monthlyPI: number;
  annualDebtService: number;
  dscr: number | null;
  cashFlow: number;
  cashOnCash: number | null;
  noi?: number;
  capRate?: number | null;
}

export interface ScenarioResult {
  name: ScenarioName;
  label: string;
  gri: number;
  egi: number;
  noi: number;
  capRate: number | null;
  dscr: number | null;
  cashFlow: number;
  cashOnCash: number | null;
  debtYield: number | null;
  supportedValue: number | null;
  maxOffer: number | null;
  includesUnverifiedIncome: boolean;
}

export interface EquityAnalysis {
  acquisitionEquity: number;
  postRenovationEquity: number | null;
  refinanceEquity: number | null;
  principalPaydownYear1: number;
  appreciatedValue: number | null;
  appreciationRate: number;
}

export interface DealAnalysis {
  gri: number;
  gpr: number;
  currentRentAnnual: number;
  marketRentAnnual: number;
  underwrittenRentAnnual: number;
  vacancyLoss: number;
  collectionLoss: number;
  vacancyAndCollectionLoss: number;
  otherLegalIncome: number;
  unverifiedIncomeAnnual: number;
  egi: number;
  expenseDetails: { key: string; label: string; annualAmount: number }[];
  operatingExpenses: number;
  monthlyOperatingExpenses: number;
  operatingExpenseRatio: number | null;
  replacementReservesInOpex: number;
  immediateCapex: number;
  annualCapexReserves: number;
  noi: number;
  capRate: number | null;
  grm: number | null;
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  ltv: number | null;
  ltvDenominator: 'Purchase Price';
  ltc: number | null;
  pointsCost: number;
  financingFees: number;
  buyerClosingCosts: number;
  monthlyPI: number;
  annualDebtService: number;
  dscr: number | null;
  cashFlowAnnual: number;
  cashFlowMonthly: number;
  totalAcquisitionCost: number;
  totalCashInvested: number;
  cashOnCash: number | null;
  debtYield: number | null;
  breakEvenOccupancy: number | null;
  breakEvenRevenue: number;
  breakEvenMargin: number;
  supportedValue: number | null;
  askingVsValue: number | null;
  askingVsValuePct: number | null;
  maxAnnualDebtService: number | null;
  supportedLoan: number;
  maxOffer: MaxOfferBreakdown;
  equity: EquityAnalysis;
  pricePerUnit: number | null;
  pricePerSqft: number | null;
  amortization: AmortizationSummary;
  health: DealHealth;
  traces: Record<string, CalculationTrace>;
  renovation: RenovationAnalysis;
  refinance: RefinanceAnalysis;
  scenarios: Record<ScenarioName, ScenarioResult>;
  interestSensitivity: SensitivityRow[];
  rentSensitivity: SensitivityRow[];
  expenseSensitivity: SensitivityRow[];
  priceSensitivity: SensitivityRow[];
  simplifiedBreakEvenOccupancy?: number | null;
  contributionBreakEvenOccupancy?: number | null;
  breakEvenMethodLabel?: string;
  fixedOperatingExpenses?: number;
  variableOperatingExpenses?: number;
  variableExpenseRatio?: number | null;
  excludedIncomeDetail?: { label: string; annual: number }[];
  sourceConflicts?: { field: string; listing: string; official: string }[];
  stressTests?: SensitivityRow[];
  breakpoints?: { label: string; value: number | null; unit: string }[];
  offerRows?: SensitivityRow[];
  financingCompare?: SensitivityRow[];
  compSummary?: {
    count: number;
    averagePrice: number | null;
    medianPrice: number | null;
    averagePsf: number | null;
    averagePerUnit: number | null;
    rangeLow: number | null;
    rangeHigh: number | null;
  };
  valuationRange?: {
    incomeApproach: number | null;
    salesLow: number | null;
    salesHigh: number | null;
    indicativeLow: number | null;
    indicativeHigh: number | null;
  };
  completion?: Record<string, number>;
}

export interface DealRepository {
  list(): Deal[];
  get(id: string): Deal | null;
  save(deal: Deal): Deal;
  delete(id: string): void;
  duplicate(id: string): Deal | null;
  rename(id: string, name: string): Deal | null;
  exportJson(id: string): string | null;
  importJson(json: string): Deal;
}
