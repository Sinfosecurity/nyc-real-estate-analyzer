# NYC underwriting considerations

This application is built for New York City 1–4 family and small multifamily acquisitions. The financial engine is general; the diligence and income rules are NYC-aware.

## Legal occupancy is the first filter

NYC buildings are not underwritten from a listing’s bedroom count or from “how the seller has been renting it.”

Base-case income may include only space whose **legal residential occupancy** you are willing to treat as verified. Typical problem areas:

- Cellar and basement apartments
- Attic or garret units
- Garage or outbuilding conversions
- Rooms created without permits
- Units that do not match the Certificate of Occupancy or DOB occupancy records

The analyzer stores potential income separately. It will not drop that income into NOI unless you explicitly enable it for the Upside scenario.

## Records that matter

| Agency | Why it matters |
| --- | --- |
| **DOB** — Department of Buildings | Building profile, occupancy, permits, violations, open applications |
| **CO** — Certificate of Occupancy | Legal use and occupancy where a CO is required |
| **HPD** — Housing Preservation & Development | Registration, housing-code violations |
| **ECB / OATH** | Adjudicated environmental-control-board style penalties, where applicable |
| **NYC Finance / DOF** | Assessed value, property taxes, arrears, related charges |

Look Up Property can call NYC Planning GeoSearch and public PLUTO rows. That is **OFFICIAL SOURCE** only for the fields returned. It does **not** retrieve a Certificate of Occupancy, certify legal occupancy, or replace DOB / HPD / DOF due diligence.

DOF tax bills, full DOB/HPD case files, and DHCR registrations are **PREPARED / BLOCKED**. Completing the due-diligence checklist is a workplan, not a legal determination.

## Rent regulation

Many NYC units are rent-stabilized or otherwise regulated. The rent roll stores a regulated indicator per unit. That flag does not automatically cap rent — you must underwrite the legal collectible rent yourself. Using “market” rent on a regulated unit as the base case is an assumption you are making, and it should be visible.

## Taxes and water

NYC property taxes and water/sewer are material line items and often differ from suburban rules of thumb. Enter actual bills or a documented estimate. The default fixture uses the original calculator’s $8,000 tax and $3,600 water assumptions only as an example.

## Utility responsibility

The rent roll records whether the tenant pays electric and gas. Owner-paid utilities belong in operating expenses. Do not assume a building is separately metered.

## CapEx in older masonry stock

Brownstones, walk-ups, and small multifamily buildings often need:

- Roof and parapet
- Boiler / heating
- Facade / Local Law work
- Electrical upgrades
- Plumbing stacks
- Windows

Model these as CapEx, not as a silent reduction of asking price. Immediate CapEx does not reduce NOI in this engine; it increases cash required when you put it in the renovation / acquisition budget.

## Financing reality

Loan-type labels (FHA, VA, DSCR, hard money, seller, etc.) do **not** encode hidden agency or lender overlays. Your DSCR and LTV targets are **user underwriting targets**. A live lender may use different tests, reserves, or ineligible-property rules.

## How to use the deal signal

**STRONG REVIEW**, **INVESTIGATE**, and **PASS** are threshold tests against numbers you typed. They are not a substitute for:

- Title and survey
- Inspection
- Appraisal
- Lease audit
- Regulatory counsel
- Insurance quotes
- Actual trailing financials

If legal occupancy is unclear, treat the financial result as incomplete even when the signal is STRONG REVIEW.
