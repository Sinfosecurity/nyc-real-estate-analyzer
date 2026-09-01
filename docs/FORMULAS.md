# Financial formulas

All formulas live in `src/calculations/`. Presentation code does not reimplement them.

Where a figure cannot be computed (zero price, zero debt, etc.), the engine returns `null` and the UI shows **N/A**. It never displays `NaN` or `Infinity`.

## Income

### GRI — Gross Rental Income

Sum of scheduled monthly rent on **legally verified** units, using the selected rent scenario (current, market, or underwritten), × 12.

Unverified units contribute $0 to GRI.

### GPR — Gross Potential Rent

Same structure as GRI, evaluated at market (or the requested scenario) for all legal units for the full period.

### Vacancy and collection loss

**Combined mode** (original calculator):

```
Vacancy/Collection Loss = GRI × combined vacancy percent
```

**Detailed mode:**

```
Vacancy Loss = GRI × physical vacancy percent
Collection Loss = (GRI − Vacancy Loss) × collection loss percent
Total Loss = Vacancy Loss + Collection Loss
```

### Other legal income

Annual sum of other-income items where `verified === true` **and** `includeInBaseCase === true`.

### Unverified / potential income

```
Unverified Annual = unverified monthly amount × 12
```

Never added to base-case EGI. Added to the Upside scenario only when the user explicitly enables it.

### EGI — Effective Gross Income

Original formula:

```
EGI = GRI − Vacancy/Collection Loss + Other Legal Income
```

## Expenses and NOI

Operating expense lines resolve as:

- Dollar mode: the annual dollar amount
- Percent-of-EGI mode: `EGI × percent`

```
Operating Expenses = sum of resolved lines
Operating Expense Ratio = Operating Expenses ÷ EGI
NOI = EGI − Operating Expenses
```

Mortgage principal and interest are **not** operating expenses and are **not** subtracted in NOI.

Replacement reserves placed on the OpEx schedule are included in NOI (same as the original “Replacement Reserve / Year” input). Separate CapEx items are **not** subtracted from NOI.

## Financing

### Loan amount

Default (original behavior):

```
Down Payment = Purchase Price × down payment percent
Loan Amount = Purchase Price − Down Payment
```

Manual override: user-entered loan amount, capped at purchase price.

### Monthly P&I

Standard fully amortizing payment. If the annual rate is 0:

```
Payment = Principal ÷ number of months
```

Otherwise:

```
r = annualRate / 100 / 12
n = years × 12
Payment = Principal × (r × (1+r)^n) / ((1+r)^n − 1)
```

During an interest-only period, the current payment is interest only (`Principal × r`). After the IO period, the remaining term is amortized.

```
Annual Debt Service = Monthly P&I × 12
```

### Acquisition cash

```
Buyer Closing Costs = attorney + inspection + appraisal + mortgage-related
                    + title + recording + transfer + broker + escrow + other closing

Financing Fees = (Loan × points / 100) + lender fees

Total Acquisition Cost = Purchase Price + Buyer Closing Costs + Renovation + Financing Fees

Total Cash Invested = Down Payment + Buyer Closing Costs + Renovation
                    + Financing Fees + Initial Reserves
```

Seller-paid versus buyer-paid is not assumed. Enter only amounts the buyer pays.

## Return metrics

```
Cap Rate = NOI ÷ Purchase Price
GRM = Purchase Price ÷ GRI
Cash Flow = NOI − Annual Debt Service
CoC = Annual Pre-Tax Cash Flow ÷ Total Cash Invested
DSCR = NOI ÷ Annual Debt Service
Debt Yield = NOI ÷ Loan Amount
LTV = Loan Amount ÷ Purchase Price     (denominator is purchase price)
LTC = Loan Amount ÷ Total Acquisition Cost
Equity = Property Value − Outstanding Debt
```

DSCR, CoC, cap rate, debt yield, LTV, and LTC return `null` when the denominator is 0.

## Break-even occupancy

Two methods are computed. The UI never presents an approximation as a universally exact formula.

### Simplified break-even occupancy (original calculator)

Treats all operating expenses as occupancy-independent:

```
SIMPLIFIED BREAK-EVEN OCCUPANCY =
  (Operating Expenses + Annual Debt Service) ÷ (GRI + Other Legal Income)
Break-even Revenue = Operating Expenses + Annual Debt Service
Margin above break-even = EGI − Break-even Revenue
```

This is the identity used by the original HTML calculator. On the golden fixture (management = 0%, all dollar OpEx treated as fixed) it is also the displayed BEO.

### Contribution-margin break-even occupancy

Used when any operating expense is classified as variable or semi-variable (semi-variable is treated as 50% variable):

```
Variable Expense Ratio = Variable Operating Expenses ÷ Gross Potential Income
Fixed Costs = Fixed Operating Expenses + Required Debt Service
Break-Even Occupancy Ratio =
  Fixed Costs ÷ (Gross Potential Income × (1 − Variable Expense Ratio))
```

Gross potential income in this engine is `GRI + Other Legal Income`.

Default expense behaviors: dollar lines are **fixed**; management (`percent_egi`) is **variable**. Changing those classifications changes contribution-margin BEO only.

## Amortization extras

- Payment date is shown when a first-payment date is supplied.
- Year-1 principal / interest, 5-year balance, and 10-year balance are taken from the schedule.
- If loan term < amortization, the remaining balance at term is a **balloon**. The fixture uses 30/30 and is unchanged.

## Valuation and loan support

```
Supported Property Value = NOI ÷ Target Cap Rate
Maximum Annual Debt Service = NOI ÷ User DSCR Target
Supported Loan = present value of that monthly debt service at the current rate and amortization
```

### Maximum offer

| Constraint | Calculation |
| --- | --- |
| Cap rate | `NOI ÷ target cap rate` |
| DSCR | `DSCR-supported loan ÷ planned LTV` (planned LTV from the down-payment structure) |
| Financing | More restrictive of `supported loan ÷ max LTV` and any optional cash budget |
| Cash-on-Cash | Highest price at which CoC still meets the user minimum, given planned leverage and cash to close |

**Conservative maximum offer** = the lowest applicable finite constraint.

This is a screening ceiling, not a bid recommendation.

## Renovation / value-add

```
Projected NOI = Projected legal annual rent − Projected operating expenses
NOI Increase = Projected NOI − Current NOI
Value Created = NOI Increase ÷ Target Cap Rate
Return on Renovation Capital = (Value Created − Renovation Cost) ÷ Renovation Cost
```

Projected rent should be legal rent. The engine does not invent illegal upside.

## Refinance / BRRRR

```
Total Basis = Purchase Price + Renovation + Additional Basis + Buyer Closing Costs
Maximum Refinance Loan = Expected ARV × Refinance LTV
Cash Available From Refinance = max(0, Refi Loan − Old Debt Payoff − Refi Costs)
Remaining Equity = ARV − Refi Loan
Cash Left in Deal = Total Cash Invested − Cash Available From Refinance
Post-Refi DSCR = Post-Renovation NOI ÷ New Annual Debt Service
Post-Refi Cash Flow = Post-Renovation NOI − New Annual Debt Service
Post-Refi CoC = Post-Refi Cash Flow ÷ Cash Left in Deal
```

A warning is raised if the modeled loan exceeds the configured refinance LTV.

## Deal health

Six tests against **user-set** thresholds (same logic as the starter, with the label changed):

1. Cap rate ≥ target cap
2. DSCR ≥ user DSCR target (or N/A if no debt)
3. CoC ≥ minimum CoC
4. LTV ≤ maximum LTV
5. Annual cash flow > 0
6. NOI > 0

- **STRONG REVIEW** — NOI > 0, cash flow > 0, and at least 5 tests meet
- **INVESTIGATE** — NOI > 0 and at least 3 tests meet
- **PASS** — otherwise

The original starter label “BUY / STRONG REVIEW” is now **STRONG REVIEW** only.
