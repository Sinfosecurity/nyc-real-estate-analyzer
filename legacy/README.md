# NYC Real Estate Deal Analyzer

A browser-based underwriting dashboard for analyzing NYC 2–4 family and small multifamily investment properties.

## Included

- Full financial glossary and acronym reference
- Unit-by-unit rent input
- Gross Rental Income (GRI)
- Effective Gross Income (EGI)
- Net Operating Income (NOI)
- Operating expense calculation
- Cap Rate
- Mortgage P&I
- Annual debt service
- DSCR
- LTV
- Cash Flow
- Cash-on-Cash Return
- Debt Yield
- Break-even Occupancy
- Total Cash Invested
- Target-cap valuation
- DSCR-supported maximum loan
- Buy / Investigate / Pass screening signal
- Separate field for excluded non-legal or unverified rental income

## Run locally

Open `index.html` directly in a browser, or from Cursor use any simple local web server.

Examples:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Recommended next build in Cursor

1. Convert to React + TypeScript or Next.js.
2. Add reusable calculation engine in `src/lib/underwriting.ts`.
3. Add property save/load capability.
4. Add multiple scenarios: Base, Conservative, Upside.
5. Add editable expense assumptions by property type.
6. Add amortization table and principal paydown.
7. Add refinance / BRRRR calculator.
8. Add after-repair value (ARV), rehab, refinance LTV, and cash-left-in-deal calculations.
9. Add purchase closing-cost estimator.
10. Add NYC due-diligence checklist for DOB, HPD, CO, violations, taxes, rent regulation, leases, utility responsibility, and legal occupancy.
11. Add PDF export of the underwriting report.
12. Add CSV / Excel export.
13. Add user accounts and saved properties only after the local calculation engine is stable.

## Important underwriting principle

Never include illegal, unverified, or unsupported rental income in the base-case underwriting. Show it separately only as a note or scenario until legal use and collectability are verified.
