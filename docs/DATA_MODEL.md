# Data model

Entities are defined in `src/models/index.ts`. Calculations accept plain data and do not import the storage layer.

## Core entities

| Entity | Role |
| --- | --- |
| `Deal` | Aggregate root: one saved analysis |
| `PropertyInfo` | Address, borough, tax lot, CO/DOB/HPD notes |
| `Unit` | Rent-roll line: rents, occupancy, legal flag, utilities |
| `OtherIncomeItem` | Parking, laundry, etc., with verified / base-case flags |
| `OperatingExpenseItem` | Dollar or % of EGI |
| `CapitalExpenseItem` | Immediate cost, year, useful life, reserve |
| `Loan` | Price, leverage, rate, term, amortization, IO, points |
| `AcquisitionCosts` | Buyer-paid closing, reserves, renovation budget |
| `UnderwritingAssumptions` | Vacancy, rent scenario, user targets, unverified-income opt-in |
| `ScenarioAdjustments` | Conservative / Base / Upside overlays |
| `RenovationPlan` | Value-add inputs |
| `RefinanceScenario` | BRRRR / refinance inputs |
| `DueDiligenceItem` | Checklist row with status |
| `DealAnalysis` | Full computed output, including traces and scenarios |

## Persistence

`DealRepository` (`src/models/index.ts`) defines:

- `list`, `get`, `save`, `delete`
- `duplicate`, `rename`
- `exportJson`, `importJson`

`src/storage/localRepository.ts` implements that interface with versioned `localStorage` (`nyc-deal-analyzer.v2.deals`).

A future PostgreSQL adapter should implement the same interface. Do not call `localStorage` (or SQL) from `src/calculations/`.

Schema version is `3` (storage key remains `nyc-deal-analyzer.v2.deals`). v2 deals migrate. Unknown or corrupt payloads are quarantined when possible rather than silently discarded.

See [DATABASE.md](DATABASE.md) for a future PostgreSQL sketch. PostgreSQL is not required to run the app.

## Deal health and traces

`DealAnalysis.health` stores the signal plus the six underlying tests.

`DealAnalysis.traces` stores line-by-line calculations for EGI, NOI, cap rate, DSCR, cash flow, CoC, debt yield, and LTV so the UI can “Show calculation” without recomputing in the component.
