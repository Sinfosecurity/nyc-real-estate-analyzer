# NYC Real Estate Deal Analyzer

A local-first underwriting desk for New York City investment properties — especially 1–4 family and small multifamily — with a calculation engine that remains usable for larger multifamily deals.

The original working HTML calculator is preserved in `legacy/`. This application is the React + TypeScript + Vite successor. **The original formulas were not replaced.** They were extracted into typed, testable functions and extended.

This tool helps answer:

> At this price, under these assumptions, is this property financially attractive enough to investigate further?

It does **not** issue purchase advice. Deal health is labeled **STRONG REVIEW**, **INVESTIGATE**, or **PASS**.

## Purpose

- Underwrite legal income, operating expenses, NOI, financing, and cash-on-cash
- Keep unverified or potentially illegal income out of the base case
- Compare scenarios, sensitivity, renovation, and refinance / BRRRR math
- Track NYC due diligence without pretending the app has retrieved official records
- Save deals locally and produce a printable investment analysis report

## Legal-income rule

Base-case GRI and NOI include only units marked **Legal occupancy verified**.

Other income enters the base case only when **Verified** and **Included in base case** are both true.

Potential / unverified income (cellar, attic, garage, etc.) is displayed separately and may be added to the **Upside** scenario only after an explicit user opt-in.

> Potential income is excluded from base-case underwriting until legal occupancy and permitted use are verified.

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

The original calculator can still be opened from `legacy/index.html`.

## Public beta

Testers: https://sinfosecurity.github.io/nyc-real-estate-analyzer/

Deal data stays in the tester’s browser. It is not synced and is not visible to the repository owner. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Development

```bash
npm run dev      # Vite dev server
npm run build    # Typecheck + production build
npm run preview  # Preview the production build
npm run lint     # ESLint
npm test         # Vitest
```

## Testing

```bash
npm test
```

Tests live in `src/tests/calculations.test.ts` and lock the original fixture:

| Input | Value |
| --- | --- |
| Purchase price | $1,200,000 |
| Monthly legal rent | $9,200 |
| Annual GRI | $110,400 |
| Vacancy | 5% |
| EGI | $104,880 |
| Operating expenses | $25,300 |
| NOI | $79,580 |
| Down payment | 25% |
| Loan | $900,000 |
| Interest | 5.6% |
| Amortization | 30 years |

## Architecture

```
src/
  calculations/   Pure financial functions (no UI, no storage)
  models/         TypeScript entities
  constants/      Defaults, glossary, due-diligence checklist
  storage/        Persistence interface (localStorage today)
  hooks/          Deal state
  components/     Shared UI
  pages/          Feature screens
  tests/          Vitest fixtures
legacy/           Original HTML/CSS/JS calculator
docs/             Formulas, NYC notes, data model
```

Financial logic is not duplicated in components. Screens call `analyzeDeal()`.

Persistence is abstracted behind `DealRepository`. The current adapter is `localStorage`. A later PostgreSQL (or other) adapter can implement the same interface without changing calculations.

## Financial formulas

See [docs/FORMULAS.md](docs/FORMULAS.md) for every calculation used.

Highlights that match the original calculator:

- `EGI = GRI − Vacancy/Collection Loss + Other Legal Income`
- `NOI = EGI − Operating Expenses` (debt service is never in NOI)
- `Cap Rate = NOI ÷ Purchase Price`
- `DSCR = NOI ÷ Annual Debt Service`
- `Cash Flow = NOI − Debt Service`
- `CoC = Annual Pre-Tax Cash Flow ÷ Total Cash Invested`
- Simplified break-even occupancy = `(OpEx + Debt Service) ÷ (GRI + Other Legal Income)` (original calculator)
- Contribution-margin break-even when variable OpEx is present

## Assumptions

All material assumptions are editable in the UI:

- Rent scenario: current / market / underwritten
- Vacancy: combined % or detailed physical + collection
- Expense dollars or % of EGI
- User DSCR target (not labeled as a lender requirement)
- Target cap rate, minimum CoC, maximum LTV
- Scenario multipliers
- Explicit appreciation (off by default — never implied)

## Documentation

- [docs/FORMULAS.md](docs/FORMULAS.md) — every formula
- [docs/NYC_UNDERWRITING.md](docs/NYC_UNDERWRITING.md) — NYC-specific considerations
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — entities and persistence
- [docs/DATABASE.md](docs/DATABASE.md) — future PostgreSQL schema (not required locally)
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — live vs prepared NYC interfaces
- [docs/TESTING.md](docs/TESTING.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## What is not claimed

Authentication, PostgreSQL, DOF tax-bill pull, full DOB/HPD case files, vendor comps, and a PDF library are **not implemented**. Manual comps, print-to-PDF, and GeoSearch/PLUTO lookup are.

## Disclaimer

This application is for screening and education. It is not legal, tax, lending, appraisal, or investment advice. Official NYC records and licensed professionals should be consulted before any acquisition decision.
