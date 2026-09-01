import type {
  AcquisitionCosts,
  CapitalExpenseItem,
  Deal,
  DueDiligenceItem,
  OperatingExpenseItem,
  ScenarioAdjustments,
  Unit,
  UnderwritingAssumptions,
} from '../models';
import { createId } from '../utils/id';
import { defaultDueDiligence } from './dueDiligence';

export const IDENTITY_ADJUSTMENT: ScenarioAdjustments = {
  rentMultiplier: 1,
  vacancyPercentOverride: null,
  collectionLossOverride: null,
  expenseMultiplier: 1,
  interestRateOverride: null,
  renovationBudgetOverride: null,
  otherIncomeMultiplier: 1,
};

/** Matches the original starter conservative/base/upside posture without changing base-case math. */
export function defaultScenarios(): Deal['scenarios'] {
  return {
    conservative: {
      rentMultiplier: 0.95,
      vacancyPercentOverride: 7,
      collectionLossOverride: null,
      expenseMultiplier: 1.1,
      interestRateOverride: 6.1,
      renovationBudgetOverride: null,
      otherIncomeMultiplier: 1,
    },
    base: { ...IDENTITY_ADJUSTMENT },
    upside: {
      rentMultiplier: 1.05,
      vacancyPercentOverride: 3,
      collectionLossOverride: null,
      expenseMultiplier: 0.97,
      interestRateOverride: null,
      renovationBudgetOverride: null,
      otherIncomeMultiplier: 1,
    },
  };
}

export function createUnit(partial?: Partial<Unit>): Unit {
  return {
    id: createId('unit'),
    identifier: '1',
    bedrooms: 2,
    bathrooms: 1,
    currentMonthlyRent: 0,
    marketMonthlyRent: 0,
    underwrittenMonthlyRent: 0,
    occupancyStatus: 'occupied',
    leaseExpiration: '',
    rentStabilized: false,
    legalOccupancyVerified: true,
    tenantPaysElectric: true,
    tenantPaysGas: true,
    notes: '',
    incomeStatus: 'verified',
    rentRegulationStatus: 'unknown',
    spaceType: 'primary',
    ...partial,
  };
}

/**
 * Starter fixture units: $3,200 + $3,100 + $2,900 = $9,200 / month legal rent.
 * Annual GRI = $110,400.
 */
export function defaultUnits(): Unit[] {
  return [
    createUnit({
      identifier: '1',
      bedrooms: 2,
      bathrooms: 1,
      currentMonthlyRent: 3200,
      marketMonthlyRent: 3200,
      underwrittenMonthlyRent: 3200,
    }),
    createUnit({
      identifier: '2',
      bedrooms: 2,
      bathrooms: 1,
      currentMonthlyRent: 3100,
      marketMonthlyRent: 3100,
      underwrittenMonthlyRent: 3100,
    }),
    createUnit({
      identifier: '3',
      bedrooms: 1,
      bathrooms: 1,
      currentMonthlyRent: 2900,
      marketMonthlyRent: 2900,
      underwrittenMonthlyRent: 2900,
    }),
  ];
}

export const EXPENSE_TEMPLATES: { key: string; label: string; mode: OperatingExpenseItem['mode']; defaultAnnual: number; defaultPercent: number }[] = [
  { key: 'taxes', label: 'Property taxes', mode: 'dollar', defaultAnnual: 8000, defaultPercent: 0 },
  { key: 'insurance', label: 'Insurance', mode: 'dollar', defaultAnnual: 4500, defaultPercent: 0 },
  { key: 'water', label: 'Water / sewer', mode: 'dollar', defaultAnnual: 3600, defaultPercent: 0 },
  { key: 'electric', label: 'Owner-paid electricity', mode: 'dollar', defaultAnnual: 1200, defaultPercent: 0 },
  { key: 'gas', label: 'Owner-paid gas / heating', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'repairs', label: 'Repairs', mode: 'dollar', defaultAnnual: 5500, defaultPercent: 0 },
  { key: 'maintenance', label: 'Maintenance', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'management', label: 'Property management', mode: 'percent_egi', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'superintendent', label: 'Superintendent / janitorial', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'trash', label: 'Trash', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'landscaping', label: 'Landscaping', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'pest', label: 'Pest control', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'security', label: 'Security', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'hoa', label: 'HOA / common charges', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'licenses', label: 'Licenses / permits', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'professional', label: 'Professional fees', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'administrative', label: 'Administrative expenses', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
  { key: 'reserve', label: 'Replacement reserves', mode: 'dollar', defaultAnnual: 2500, defaultPercent: 0 },
  { key: 'other', label: 'Other operating expenses', mode: 'dollar', defaultAnnual: 0, defaultPercent: 0 },
];

export function defaultExpenses(): OperatingExpenseItem[] {
  return EXPENSE_TEMPLATES.map((item) => ({
    id: createId('exp'),
    key: item.key,
    label: item.label,
    annualAmount: item.defaultAnnual,
    percentOfEgi: item.defaultPercent,
    mode: item.mode,
    behavior: item.mode === 'percent_egi' || item.key === 'management' ? 'variable' : 'fixed',
  }));
}

export const CAPEX_CATEGORIES = [
  'Roof',
  'Boiler',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Windows',
  'Facade',
  'Elevator',
  'Structural repairs',
  'Renovation',
  'Appliances',
  'Other',
];

export function createCapexItem(category = 'Other'): CapitalExpenseItem {
  return {
    id: createId('capex'),
    category,
    immediateCost: 0,
    expectedYear: new Date().getFullYear(),
    usefulLifeYears: 15,
    annualReserve: 0,
    notes: '',
  };
}

/** Buyer-paid closing line items sum to the original $30,000 closing-cost assumption. */
export function defaultAcquisition(): AcquisitionCosts {
  return {
    attorney: 3500,
    inspection: 1000,
    appraisal: 750,
    mortgageRelated: 1500,
    title: 4000,
    recording: 500,
    transfer: 0,
    broker: 0,
    escrow: 0,
    initialReserves: 10000,
    renovationBudget: 0,
    otherClosing: 18750,
  };
}

export function defaultAssumptions(): UnderwritingAssumptions {
  return {
    rentScenario: 'underwritten',
    vacancyMode: 'combined',
    combinedVacancyPercent: 5,
    physicalVacancyPercent: 4,
    collectionLossPercent: 1,
    targetCapRate: 7,
    targetDscr: 1.25,
    minCashOnCash: 6,
    maxLtv: 75,
    includeUnverifiedInUpside: false,
    maxCashToInvest: null,
    appreciationRate: 0,
  };
}

export function createDefaultDeal(partial?: Partial<Deal>): Deal {
  const now = new Date().toISOString();
  return {
    id: createId('deal'),
    name: 'Example 3-family — $1,200,000',
    createdAt: now,
    updatedAt: now,
    property: {
      address: '',
      borough: '',
      neighborhood: '',
      zip: '',
      block: '',
      lot: '',
      propertyType: '3-family',
      legalUnitCount: 3,
      yearBuilt: null,
      squareFootage: 0,
      lotSize: 0,
      zoning: '',
      certificateOfOccupancyStatus: 'Unknown — verify with DOB',
      dobStatus: 'Unknown — not retrieved from official records',
      hpdStatus: 'Unknown — not retrieved from official records',
      notes: '',
      bbl: '',
      observedUnitCount: 3,
      officialUnitCount: null,
      taxClass: '',
      listingUrl: '',
      listingPrice: 1_200_000,
      listingSource: '',
      listingNotes: '',
      legalOccupancyFinding: 'not_verified',
      tax: {
        currentAnnual: 8000,
        listingReported: null,
        officialRecord: null,
        userUnderwritten: 8000,
        sourceUsed: 'underwritten',
        marketValue: null,
        assessedValue: null,
        taxableValue: null,
      },
    },
    units: defaultUnits(),
    otherIncome: [],
    unverifiedIncomeMonthly: 0,
    expenses: defaultExpenses(),
    capex: [],
    loan: {
      loanType: 'conventional',
      purchasePrice: 1_200_000,
      loanAmount: 900_000,
      downPaymentPercent: 25,
      interestRate: 5.6,
      loanTermYears: 30,
      amortizationYears: 30,
      interestOnlyMonths: 0,
      points: 0,
      lenderFees: 0,
      useManualLoanAmount: false,
    },
    acquisition: defaultAcquisition(),
    assumptions: defaultAssumptions(),
    scenarios: defaultScenarios(),
    renovation: {
      enabled: false,
      projectedMonthlyRent: 0,
      renovationCost: 0,
      renovationMonths: 0,
      vacancyDuringRenoPercent: 100,
      projectedAnnualExpenses: 0,
      targetCapRate: 7,
    },
    refinance: {
      enabled: false,
      additionalBasis: 0,
      postRenovationNoi: null,
      expectedArv: 0,
      refinanceLtv: 75,
      refinanceRate: 6,
      refinanceAmortizationYears: 30,
      refinanceCosts: 8000,
      currentLoanBalanceOverride: null,
    },
    dueDiligence: defaultDueDiligence(),
    investorNotes: '',
    comps: [],
    risks: [],
    documents: [],
    snapshots: [],
    renovationLines: [],
    financingAlternatives: [
      {
        id: 'fin_25_conv',
        label: '25% down conventional',
        loanType: 'conventional',
        downPaymentPercent: 25,
        interestRate: 5.6,
        amortizationYears: 30,
        interestOnlyMonths: 0,
        points: 0,
        lenderFees: 0,
      },
      {
        id: 'fin_20',
        label: '20% down',
        loanType: 'conventional',
        downPaymentPercent: 20,
        interestRate: 5.85,
        amortizationYears: 30,
        interestOnlyMonths: 0,
        points: 0,
        lenderFees: 0,
      },
      {
        id: 'fin_seller',
        label: 'Seller financing',
        loanType: 'seller',
        downPaymentPercent: 15,
        interestRate: 6.5,
        amortizationYears: 20,
        interestOnlyMonths: 0,
        points: 0,
        lenderFees: 0,
      },
    ],
    offerPrices: {
      asking: 1_200_000,
      target: 1_100_000,
      aggressive: 1_050_000,
      custom: 1_200_000,
    },
    schemaVersion: 3,
    ...partial,
  };
}

export function emptyDueDiligence(): DueDiligenceItem[] {
  return defaultDueDiligence();
}

/** New-user deal: no invented rent, no fixture expenses, no implied official records. */
export function createBlankDeal(partial?: Partial<Deal>): Deal {
  return createDefaultDeal({
    name: 'Untitled property',
    units: [
      createUnit({
        identifier: '1',
        legalOccupancyVerified: false,
        incomeStatus: 'unverified',
        rentRegulationStatus: 'unknown',
      }),
    ],
    expenses: EXPENSE_TEMPLATES.map((item) => ({
      id: createId('exp'),
      key: item.key,
      label: item.label,
      annualAmount: 0,
      percentOfEgi: 0,
      mode: item.mode,
      behavior: item.mode === 'percent_egi' || item.key === 'management' ? 'variable' : 'fixed',
    })),
    loan: {
      loanType: 'conventional',
      purchasePrice: 0,
      loanAmount: 0,
      downPaymentPercent: 25,
      interestRate: 5.6,
      loanTermYears: 30,
      amortizationYears: 30,
      interestOnlyMonths: 0,
      points: 0,
      lenderFees: 0,
      useManualLoanAmount: false,
    },
    property: {
      ...createDefaultDeal().property,
      propertyType: '3-family',
      legalUnitCount: 0,
      observedUnitCount: 0,
      officialUnitCount: null,
      listingPrice: 0,
    },
    offerPrices: { asking: 0, target: 0, aggressive: 0, custom: 0 },
    ...partial,
  });
}

/** Clearly labeled synthetic walkthrough. Not a claim about a real building. */
export function createSyntheticExampleDeal(partial?: Partial<Deal>): Deal {
  return createDefaultDeal({
    name: 'SYNTHETIC example — 3-family at $1,200,000',
    property: {
      ...createDefaultDeal().property,
      address: '179-XX Example Avenue (SYNTHETIC — not a real listing)',
      borough: 'Queens',
      neighborhood: 'Example neighborhood',
      zip: '11434',
      listingNotes: 'Educational fixture only. Do not treat as a real property.',
    },
    ...partial,
  });
}
