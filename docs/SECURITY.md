# Security

This is a local-first browser app. There is no authentication and no server-side session.

## Import / storage

- JSON import is size-capped (`2_000_000` characters).
- Payloads containing `__proto__` or `constructor.prototype` are rejected.
- Corrupt `localStorage` blobs are quarantined (`nyc-deal-analyzer.quarantine`) instead of being silently discarded when possible.
- Deals are migrated to schema version 3. Unknown shapes throw rather than executing attacker-controlled keys.

## XSS / HTML

- React text interpolation is used. The app does not `dangerouslySetInnerHTML`.
- CSV export quotes fields and doubles embedded quotes.
- Listing URLs are user-entered. Treat them as untrusted; do not auto-execute scripts.

## External requests

- NYC GeoSearch and SODA calls are read-only HTTPS GETs.
- Failures surface as user-visible errors. Empty or error responses are not replaced with invented property data.

## Secrets

- No API keys are required for the live GeoSearch / PLUTO path.
- Do not commit NYC Developer Portal tokens if Geoclient is added later.

## localStorage

- Acceptable for a single-browser underwriting desk.
- Export JSON weekly (the Settings screen reminds after seven days).
- Clearing site data deletes deals.
