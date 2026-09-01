# NYC data sources

No fabricated endpoints. Status is honest.

| Source | Official interface | App status |
| --- | --- | --- |
| NYC Planning GeoSearch | `https://geosearch.planninglabs.nyc/v2/search` | **LIVE** (no key). Address → BBL / borough / ZIP candidates. |
| PLUTO (MapPLUTO) | NYC Open Data SODA `64uk-42ks` | **LIVE** when a BBL is resolved. Building area, unitsres, zoning, year built. |
| DOB violations | NYC Open Data SODA `3h2n-5cm9` | **PREPARED / BLOCKED** for full building profile. Sample query only when BIN exists. Never concludes legality. |
| OATH / ECB | NYC Open Data SODA `6bgk-3dad` | **PREPARED / BLOCKED** as a complete case file. Sample count only. |
| HPD violations | NYC Open Data SODA `wvxf-dwi5` | **PREPARED / BLOCKED** as a complete HPD integration. Sample count only. |
| NYC Geoclient | Requires NYC Developer Portal token | **PREPARED / BLOCKED** — no token in this repo. GeoSearch is the no-key path. |
| DOF property tax bills | NYC Finance / property tax APIs | **PREPARED / BLOCKED** — types and user tax model exist; no live bill pull. |
| DHCR rent registration | No public bulk API used here | **NOT IMPLEMENTED** |
| Comparable sales vendor | Would require a licensed provider | **PREPARED / BLOCKED** — manual comps only. |
| Certificate of Occupancy PDF | DOB BIS / DOB NOW | **NOT IMPLEMENTED** — user-entered status only. |

Code lives under `src/services/nyc/`. Failed lookups show an error. They never invent a BBL, tax bill, or “legal unit” conclusion.

Finding language from lookup:

- LEGAL OCCUPANCY VERIFIED (never emitted automatically from incomplete records)
- LEGAL OCCUPANCY NOT VERIFIED
- RECORDS REQUIRE REVIEW
- POTENTIAL CONFLICT

SODA endpoints and dataset IDs should be re-checked on [data.cityofnewyork.us](https://data.cityofnewyork.us) if a dataset is retired.
