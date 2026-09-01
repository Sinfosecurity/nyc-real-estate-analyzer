# Testing

```bash
npm test
```

Vitest. Tests are in `src/tests/`.

## Golden fixture

`src/tests/calculations.test.ts` locks the original calculator:

| Item | Value |
| --- | --- |
| Purchase | $1,200,000 |
| Legal monthly rent | $9,200 |
| GRI | $110,400 |
| Vacancy | 5% → $5,520 |
| EGI | $104,880 |
| OpEx | $25,300 |
| NOI | $79,580 |
| Down | 25% → $900,000 loan |
| Rate / amort | 5.6% / 30 |
| Total cash | $340,000 |
| Value @ 7% cap | ≈ $1,136,857 |

Ordinary refactors must not change these identities.

## Additional suites

- `hardening.test.ts` — legal-income gate, dual break-even, balloon, max-offer independence, import safety, scenario inheritance
- `nycFixtures.test.ts` — synthetic two/three/four-family, small MF, negative CF, high CF, renovation, BRRRR, unverified basement

Synthetic fixtures are **not** claims about real buildings.

## What is not tested here

Live NYC Open Data responses (network). Those services fail closed and do not fabricate records.
