export interface GlossaryEntry {
  id: string;
  acronym: string;
  name: string;
  formula: string;
  explanation: string;
  why: string;
    interpretation?: string;
  related?: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'gri',
    acronym: 'GRI',
    name: 'Gross Rental Income',
    formula: 'Sum of scheduled legal monthly rents × 12',
    explanation:
      'Total scheduled legal rental income before vacancy, collection loss, operating expenses, or financing.',
    why: 'It is the starting point of the income statement and must reflect only legally occupiable units.',
    interpretation: 'If GRI relies on unverified cellar, attic, or garage “units,” the rest of the analysis is unreliable.',
  },
  {
    id: 'gpr',
    acronym: 'GPR',
    name: 'Gross Potential Rent',
    formula: 'Legal units × assumed rent × 12 (typically market or underwritten rent)',
    explanation:
      'The rent the property could generate if all legal units were rented for the entire period at the assumed rents.',
    why: 'Separates current collections from the property’s legal rent potential.',
  },
  {
    id: 'egi',
    acronym: 'EGI',
    name: 'Effective Gross Income',
    formula: 'EGI = GRI − Vacancy/Collection Loss + Other Legal Income',
    explanation:
      'Income remaining after vacancy and collection loss, plus qualifying other property income.',
    why: 'EGI is the income available to pay operating expenses.',
  },
  {
    id: 'opex',
    acronym: 'OpEx',
    name: 'Operating Expenses',
    formula: 'Sum of recurring operating costs (dollars and any % of EGI items)',
    explanation:
      'Recurring costs required to operate the property. Does not include mortgage principal and interest, or major capital replacements treated as CapEx.',
    why: 'Understated expenses are the most common way a deal looks better than it is.',
  },
  {
    id: 'oer',
    acronym: 'OER',
    name: 'Operating Expense Ratio',
    formula: 'Operating Expense Ratio = Operating Expenses ÷ EGI',
    explanation: 'Share of effective income consumed by operations.',
    why: 'Helps compare cost structure across properties.',
  },
  {
    id: 'noi',
    acronym: 'NOI',
    name: 'Net Operating Income',
    formula: 'NOI = EGI − Operating Expenses',
    explanation:
      'Property income after operating expenses but before mortgage payments, depreciation, income taxes, and financing costs.',
    why: 'NOI is the core unleveraged earnings figure used for cap rate, DSCR, and valuation.',
    interpretation: 'Debt service is never subtracted when calculating NOI.',
  },
  {
    id: 'caprate',
    acronym: 'Cap Rate',
    name: 'Capitalization Rate',
    formula: 'Cap Rate = NOI ÷ Purchase Price',
    explanation: 'Unleveraged property operating return relative to purchase price.',
    why: 'Lets you compare properties independent of financing.',
    interpretation: 'Higher is a higher unleveraged yield — not automatically a “better” building.',
  },
  {
    id: 'grm',
    acronym: 'GRM',
    name: 'Gross Rent Multiplier',
    formula: 'GRM = Purchase Price ÷ GRI',
    explanation: 'How many years of scheduled rent equal the price, before expenses.',
    why: 'A quick screen only; it ignores vacancy, expenses, and debt.',
  },
  {
    id: 'pi',
    acronym: 'P&I',
    name: 'Principal and Interest',
    formula: 'Standard amortizing mortgage payment (interest-only during any IO period)',
    explanation: 'The principal repayment and interest portion of a mortgage payment.',
    why: 'This is the payment that must be covered by NOI for a positively leveraged hold.',
  },
  {
    id: 'debt-service',
    acronym: 'Debt Service',
    name: 'Annual Debt Service',
    formula: 'Monthly P&I × 12',
    explanation: 'Total mortgage principal and interest payments during the period being analyzed.',
    why: 'Used in DSCR, cash flow, and break-even occupancy.',
  },
  {
    id: 'dscr',
    acronym: 'DSCR',
    name: 'Debt Service Coverage Ratio',
    formula: 'DSCR = NOI ÷ Annual Debt Service',
    explanation: 'Measures the property’s ability to cover its debt payments.',
    why: 'A core credit metric. This app uses your user underwriting target, not a hard-coded lender rule.',
    interpretation:
      'Below 1.00 = NOI does not fully cover debt service. 1.00 = break-even before other capital needs. Above 1.00 = increasing cushion.',
  },
  {
    id: 'ltv',
    acronym: 'LTV',
    name: 'Loan-to-Value Ratio',
    formula: 'LTV = Loan Amount ÷ Purchase Price',
    explanation:
      'In this engine the denominator is purchase price, not an appraised value, unless you treat them as the same number.',
    why: 'Shows leverage. Many lenders also look at appraised value separately.',
  },
  {
    id: 'ltc',
    acronym: 'LTC',
    name: 'Loan-to-Cost Ratio',
    formula: 'LTC = Loan Amount ÷ Total Project Cost',
    explanation: 'Loan relative to purchase price plus buyer closing costs, renovation, and financing fees.',
    why: 'Common for renovation and construction financing.',
  },
  {
    id: 'cashflow',
    acronym: 'CF',
    name: 'Cash Flow',
    formula: 'Cash Flow = NOI − Debt Service',
    explanation: 'Pre-tax cash remaining after operating expenses and debt service.',
    why: 'The levered result of the hold — before income taxes and owner-specific items.',
  },
  {
    id: 'coc',
    acronym: 'CoC',
    name: 'Cash-on-Cash Return',
    formula: 'CoC = Annual Pre-Tax Cash Flow ÷ Total Cash Invested',
    explanation: 'Yield on the cash you actually put into the deal.',
    why: 'Connects operations and financing to the equity check you write.',
  },
  {
    id: 'tce',
    acronym: 'TCE',
    name: 'Total Cash Invested',
    formula:
      'Down payment + buyer closing costs + renovation + financing fees + initial reserves',
    explanation: 'All cash required to acquire and stabilize the initial position.',
    why: 'The CoC denominator. Omitting closing costs or reserves overstates return.',
  },
  {
    id: 'debt-yield',
    acronym: 'DY',
    name: 'Debt Yield',
    formula: 'Debt Yield = NOI ÷ Loan Amount',
    explanation: 'Property income relative to the loan, ignoring interest rate and amortization.',
    why: 'Some lenders use it as a rate-independent credit check.',
  },
  {
    id: 'beo',
    acronym: 'BEO',
    name: 'Break-Even Occupancy',
    formula:
      'SIMPLIFIED: (OpEx + Debt Service) ÷ (GRI + Other Legal Income). CONTRIBUTION: Fixed Costs ÷ (GPI × (1 − Variable Expense Ratio)).',
    explanation:
      'Two methods are shown. The simplified formula treats all OpEx as occupancy-independent (original calculator). The contribution-margin method isolates variable expenses. The displayed BEO uses contribution when variable OpEx > 0.',
    why: 'Shows how much vacancy the deal can absorb before cash flow goes negative.',
    interpretation:
      'Never treat the simplified formula as universally exact when management fees or other variable costs are material.',
    related: 'OpEx, Debt Service, Cash Flow',
  },
  {
    id: 'capex',
    acronym: 'CapEx',
    name: 'Capital Expenditures',
    formula: 'Major non-routine building costs (not included in NOI unless you place reserves in OpEx)',
    explanation:
      'Roof replacement, boiler, structural work, major systems, and similar long-life items.',
    why: 'Treating CapEx as if it does not exist overstates both NOI quality and cash needs.',
  },
  {
    id: 'equity',
    acronym: 'Equity',
    name: 'Equity',
    formula: 'Equity = Property Value − Outstanding Debt',
    explanation: 'Residual ownership interest after debt.',
    why: 'Tracks what you have at risk at acquisition, after renovation, and after a refinance.',
  },
  {
    id: 'arv',
    acronym: 'ARV',
    name: 'After Repair Value',
    formula: 'User estimate of value after defined improvements',
    explanation: 'Estimated property value after completion of defined improvements.',
    why: 'Used in refinance / BRRRR analysis. It is an assumption, not an appraisal.',
  },
  {
    id: 'amort',
    acronym: 'Amortization',
    name: 'Amortization',
    formula: 'Scheduled principal reduction over the loan term',
    explanation: 'Gradual repayment of loan principal over the loan term.',
    why: 'Creates equity through paydown even if the market value is unchanged.',
  },
  {
    id: 'refi',
    acronym: 'Refi',
    name: 'Refinance',
    formula: 'New loan based on updated value, terms, or objectives',
    explanation:
      'Replacing existing financing with a new loan, usually based on updated property value, loan terms, or investment objectives.',
    why: 'Can return cash, change DSCR, or reset term and rate.',
  },
  {
    id: 'co',
    acronym: 'CO',
    name: 'Certificate of Occupancy',
    formula: 'Official NYC building record of legal use and occupancy (where required)',
    explanation:
      'States the legal use and occupancy of a building when one is required. It does not by itself prove current compliance.',
    why: 'Illegal or unverified units cannot be treated as base-case income.',
    interpretation:
      'This application does not retrieve or certify CO status. Check official DOB records and professional due diligence.',
  },
  {
    id: 'dob',
    acronym: 'DOB',
    name: 'NYC Department of Buildings',
    formula: 'n/a',
    explanation:
      'NYC agency responsible for building records, permits, violations, construction, and occupancy matters.',
    why: 'Open violations, work without permits, and occupancy questions change both risk and legal income.',
  },
  {
    id: 'hpd',
    acronym: 'HPD',
    name: 'NYC Department of Housing Preservation and Development',
    formula: 'n/a',
    explanation:
      'NYC housing agency that maintains property registration, housing-code violations, and related housing records.',
    why: 'HPD violations and registration status are standard NYC acquisition diligence items.',
  },
  {
    id: 'dof',
    acronym: 'DOF',
    name: 'NYC Department of Finance',
    formula: 'n/a',
    explanation:
      'NYC Finance / DOF administers property taxes, assessments, and related charges.',
    why: 'Tax bills and arrears are material operating costs and closing issues.',
    interpretation:
      'Official records and professional due diligence should be consulted. This application does not establish legal or tax status.',
  },
  {
    id: 'dcr',
    acronym: 'DCR',
    name: 'Debt Coverage Ratio',
    formula: 'Same concept as DSCR = NOI ÷ Annual Debt Service',
    explanation: 'Another shorthand sometimes used for debt coverage. DSCR is the clearer term in this app.',
    why: 'Avoid mixing DCR and DSCR as if they were different tests.',
  },
  {
    id: 'bbl',
    acronym: 'BBL',
    name: 'Borough, Block, Lot',
    formula: 'Borough code (1–5) + 5-digit block + 4-digit lot',
    explanation: 'NYC tax-lot identifier used across DOB, HPD, and DOF records.',
    why: 'It is the join key for official property records.',
    related: 'Block, Lot, DOB, HPD, DOF',
  },
  {
    id: 'zoning',
    acronym: 'Zoning',
    name: 'Zoning district',
    formula: 'n/a',
    explanation: 'NYC Planning designation of permitted use, bulk, and density.',
    why: 'Use that does not match zoning or the CO is a legal-income problem.',
    related: 'CO, DOB',
  },
  {
    id: 'rentroll',
    acronym: 'Rent roll',
    name: 'Rent roll',
    formula: 'Unit-level schedule of rent, occupancy, and regulation status',
    explanation: 'The source document for GRI. Advertised rent is not automatically collectible.',
    why: 'Errors here flow into every return metric.',
    related: 'GRI, rent stabilization, legal occupancy',
  },
  {
    id: 'rstab',
    acronym: 'RS',
    name: 'Rent stabilization',
    formula: 'n/a',
    explanation: 'NYC regulatory status that can limit legal collectible rent and lease terms.',
    why: 'Market rent on a stabilized unit is an assumption, not a fact.',
    related: 'Rent roll, legal occupancy',
  },
  {
    id: 'legalocc',
    acronym: 'Legal occupancy',
    name: 'Legal occupancy',
    formula: 'n/a',
    explanation: 'Whether a space may lawfully be used as a dwelling per CO and DOB records.',
    why: 'Unverified basement, cellar, attic, or garage income is excluded from the base case.',
    related: 'CO, DOB, GRI',
  },
  {
    id: 'comp',
    acronym: 'Comp',
    name: 'Comparable sale',
    formula: 'User-entered sale used for a sales-comparison indication',
    explanation: 'A recent similar sale. This app does not certify adjustments or produce an appraisal.',
    why: 'Triangulates the income approach without inventing market data.',
    related: 'ARV, valuation range',
  },
  {
    id: 'brrrr',
    acronym: 'BRRRR',
    name: 'Buy, Rehab, Rent, Refinance, Repeat',
    formula: 'See refinance module',
    explanation: 'A recapitalization sequence. Cash left in deal is original cash minus refinance proceeds.',
    why: 'Shows whether renovation plus refinance returns capital — using your ARV assumption.',
    related: 'ARV, refinance, cash left in deal',
  },
  {
    id: 'paydown',
    acronym: 'Paydown',
    name: 'Principal paydown',
    formula: 'Scheduled principal reduction over a period',
    explanation: 'Equity created by amortization, independent of appreciation.',
    why: 'A cash-flow deal can still build equity through the loan schedule.',
    related: 'Amortization, equity',
  },
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((entry) => [entry.id, entry]));
