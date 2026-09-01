# Cursor Build Prompt — NYC Real Estate Deal Analyzer

You are continuing development of an existing real-estate underwriting dashboard. Do not throw away the current working calculations. First inspect `index.html`, `styles.css`, `app.js`, and `README.md` and preserve the existing formulas unless a calculation is demonstrably wrong.

## Objective

Transform this starter into a premium, production-quality NYC real-estate investment underwriting application for 2–4 family and small multifamily acquisitions.

## Core requirements

### 1. Architecture
- Convert the project to React + TypeScript with Vite or Next.js.
- Put all financial calculations in a separate pure calculation module.
- Add unit tests for every financial formula.
- Keep UI components separate from calculation logic.
- Do not introduce a backend until local calculation and persistence requirements are complete.

### 2. Property profile
Add fields for:
- Address
- Borough
- Neighborhood
- Property type
- Number of legal units
- Asking price
- Proposed offer price
- Square footage
- Year built
- Property taxes
- Legal occupancy status
- Certificate of Occupancy status
- Rent-regulated / free-market status

### 3. Rent roll
Support dynamic units instead of only four hard-coded units.
For each unit include:
- Unit number
- Bedrooms
- Legal monthly rent
- Market monthly rent
- Current tenant / vacant status
- Lease expiration
- Utility responsibility
- Legal / verified toggle

Only verified legal income may enter the base-case underwriting.

### 4. Income
Calculate and explain:
- GPR — Gross Potential Rent
- GRI — Gross Rental Income
- Vacancy loss
- Collection loss
- Other legal income
- EGI — Effective Gross Income

### 5. Operating expenses
Support:
- Property taxes
- Insurance
- Water / sewer
- Electricity / common utilities
- Gas / heating
- Repairs and maintenance
- Property management
- Payroll / superintendent / janitorial
- Landscaping / snow
- Pest control
- Legal / accounting
- Licensing / permits
- HOA / association
- Replacement reserves
- Other operating expenses

Allow both fixed-dollar and percentage-based assumptions where appropriate.

### 6. Financial metrics
Calculate, display, and explain:
- NOI — Net Operating Income
- Cap Rate
- Gross Rent Multiplier (GRM)
- Expense Ratio
- Break-even Occupancy
- Debt Yield
- Monthly P&I
- Annual Debt Service
- DSCR
- LTV
- LTC
- Annual Cash Flow
- Monthly Cash Flow
- Total Cash Invested
- Cash-on-Cash Return
- Equity at Acquisition
- Price per Unit
- Price per Square Foot

### 7. Financing
Support:
- Down payment % and dollars
- Loan amount
- Interest rate
- Amortization term
- Interest-only period
- Loan fees / points
- Closing costs
- Seller financing
- Second mortgage / subordinate debt
- Private money

### 8. Renovation / value creation
Support:
- Rehab budget
- Contingency
- Holding costs
- Renovation months
- Post-renovation legal rents
- ARV — After Repair Value
- Stabilized NOI
- Stabilized Cap Rate
- Equity created

### 9. Refinance / BRRRR
Add calculations for:
- Refinance value
- Refinance LTV
- New loan amount
- Old debt payoff
- Refinance closing costs
- Cash returned to investor
- Cash remaining in the deal
- New debt service
- New DSCR
- New cash flow
- Post-refinance CoC return

### 10. Scenario analysis
Provide three tabs:
- Conservative
- Base Case
- Upside

Allow users to change rents, vacancy, expenses, interest rate, and renovation assumptions independently per scenario.

### 11. Maximum offer engine
Calculate maximum purchase price based on:
- Required cap rate
- Minimum DSCR
- Minimum CoC return
- Maximum LTV

Show the binding constraint and explain why it limits the offer.

### 12. Deal decision system
Do not produce a simplistic Buy/Pass decision from one metric.
Create a review panel with:
- Income quality
- Expense coverage
- Cap rate test
- DSCR test
- Cash flow test
- CoC return test
- Leverage test
- Legal occupancy risk
- Data completeness

Outputs:
- Strong Review
- Investigate
- Weak / Pass

Always explain which metrics caused the result.

### 13. Glossary
Create a complete searchable glossary in the app. At minimum include:
GRI, GPR, EGI, NOI, OpEx, CapEx, Cap Rate, GRM, P&I, Debt Service, DSCR, LTV, LTC, CoC, Debt Yield, Break-even Occupancy, ARV, Equity, Amortization, Refinance, CO, DOB, HPD, rent roll, stabilized NOI, market rent, legal rent, vacancy loss, collection loss, total cash invested, and cash flow.

Every metric card should have a tooltip or info icon showing its definition and formula.

### 14. NYC due diligence
Add a checklist area for:
- DOB building profile
- Certificate of Occupancy
- HPD registration
- HPD violations
- DOB violations
- ECB/OATH violations where applicable
- Property taxes
- Water charges
- Rent regulation
- Leases
- Security deposits
- Utility meters
- Legal basement/cellar occupancy
- Zoning / use
- Open permits
- Liens / title

Do not automatically claim a property is legal or compliant. The app should mark items as Unknown until verified.

### 15. Reports and export
Add:
- Printable investment summary
- PDF underwriting report
- CSV export
- JSON project export/import

The PDF should contain:
- Property overview
- Rent roll
- Income
- Expenses
- Financing
- Financial metrics
- Scenario comparison
- Maximum offer analysis
- Due-diligence checklist
- Risks / assumptions

### 16. UX requirements
- Premium professional design
- Desktop and mobile responsive
- Clear input/output separation
- No cramped tables
- Green/neutral professional visual system
- Never use red as a dominant brand color; reserve it only for genuine risk or failed tests
- Plain-English explanations next to advanced metrics
- Numeric inputs must never produce NaN or Infinity

### 17. Validation
Add validation for:
- Negative numbers
- Vacancy over 100%
- Down payment over 100%
- Zero price
- Zero loan term
- Missing rent
- Missing expenses
- Invalid financing assumptions

### 18. Testing
Write tests for:
- NOI
- Cap Rate
- mortgage payment
- DSCR
- LTV
- LTC
- CoC Return
- Debt Yield
- break-even occupancy
- target-cap valuation
- maximum loan based on DSCR
- refinance proceeds
- BRRRR cash-left-in-deal

## Important financial rule
Mortgage principal and interest are debt service, not operating expenses. Do not subtract them when calculating NOI.

## Important legal rule
Never treat illegal, unsupported, or unverified rental income as base-case revenue. It can be shown separately as excluded or hypothetical scenario income only.

## Delivery
Work continuously until the application is complete, tested, and polished. Do not provide piecemeal instructions. Preserve working functionality while upgrading the architecture.
