# Future PostgreSQL schema

The running application does **not** require PostgreSQL. Persistence today is `DealRepository` → `localStorage`.

This document is a target schema for a later adapter. Do not treat it as implemented.

## Design rules

- One calculation engine. The database stores inputs and snapshots, not recomputed NOI.
- `schema_version` on every deal row. Incompatible rows are quarantined, never silently discarded.
- Provenance columns on sourced property fields (`value`, `source`, `source_url`, `retrieved_at`, `verification_status`).

## Tables

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  schema_version integer NOT NULL,
  unverified_income_monthly numeric NOT NULL DEFAULT 0,
  investor_notes text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE properties (
  id uuid PRIMARY KEY,
  deal_id uuid UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  address text,
  borough text,
  neighborhood text,
  zip text,
  bbl text,
  block text,
  lot text,
  property_type text,
  legal_unit_count integer,
  observed_unit_count integer,
  official_unit_count integer,
  year_built integer,
  square_footage numeric,
  lot_size numeric,
  zoning text,
  tax_class text,
  listing_url text,
  listing_price numeric,
  listing_source text
);

CREATE TABLE units (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  identifier text NOT NULL,
  bedrooms numeric,
  bathrooms numeric,
  current_monthly_rent numeric,
  market_monthly_rent numeric,
  underwritten_monthly_rent numeric,
  occupancy_status text,
  income_status text,
  rent_regulation_status text,
  space_type text,
  legal_occupancy_verified boolean NOT NULL DEFAULT false
);

CREATE TABLE income_items (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  description text,
  category text,
  monthly_amount numeric,
  verified boolean,
  include_in_base_case boolean,
  income_status text
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  key text,
  label text,
  annual_amount numeric,
  percent_of_egi numeric,
  mode text,
  behavior text
);

CREATE TABLE loans (
  id uuid PRIMARY KEY,
  deal_id uuid UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  loan_type text,
  purchase_price numeric,
  loan_amount numeric,
  down_payment_percent numeric,
  interest_rate numeric,
  loan_term_years integer,
  amortization_years integer,
  interest_only_months integer
);

CREATE TABLE scenarios (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  rent_multiplier numeric,
  vacancy_percent_override numeric,
  expense_multiplier numeric,
  interest_rate_override numeric
);

CREATE TABLE due_diligence_items (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  category text,
  label text,
  status text,
  notes text,
  source text,
  date_checked date,
  severity text
);

CREATE TABLE risks (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  category text,
  risk text,
  probability text,
  impact text,
  mitigation text,
  status text
);

CREATE TABLE comps (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  address text,
  sale_date date,
  sale_price numeric,
  legal_units integer,
  building_sqft numeric,
  source text
);

CREATE TABLE analysis_snapshots (
  id uuid PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  version_label text,
  created_at timestamptz NOT NULL,
  notes text,
  purchase_price numeric,
  noi numeric,
  cap_rate numeric,
  dscr numeric,
  cash_flow numeric,
  cash_on_cash numeric,
  max_offer numeric,
  signal text
);
```

Authentication, multi-user ACL, and hosted backups are **NOT IMPLEMENTED**.
