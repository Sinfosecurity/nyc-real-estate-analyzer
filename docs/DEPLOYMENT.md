# Deployment — NYC Real Estate Deal Analyzer

This application is a React + TypeScript + Vite single-page app. Persistence is browser `localStorage`. NYC lookups call public HTTPS endpoints from the browser. There is no application server and no authentication.

## Selected hosting

**GitHub Pages** at `https://sinfosecurity.github.io/nyc-real-estate-analyzer/`

The live site is the `gh-pages` branch (the compiled `dist/` folder).

Why this matches the current architecture:

- The production artifact is static files in `dist/`
- HTTPS and a public tester URL are provided without a custom domain
- GitHub is already the connected account in this environment
- A `404.html` copy of `index.html` is the SPA fallback so nested routes do not 404 on refresh
- No application server or secrets are required

## Build

| Item | Value |
| --- | --- |
| Node | 22 |
| Install | `npm ci` |
| Validate | `npm test`, `npm run lint`, `npm run typecheck` |
| Build | `npm run build` |
| Output | `dist/` |
| Preview locally | `npm run preview` |

`npm run build` compiles TypeScript, runs Vite, then copies `dist/index.html` to `dist/404.html` (`scripts/spa-fallback.mjs`).

GitHub Pages is a project site, so the published build sets:

```
BASE_PATH=/nyc-real-estate-analyzer/
```

Local development leaves `BASE_PATH` unset so the app stays at `/`.

## Environment variables

| Name | Class | Required | Purpose |
| --- | --- | --- | --- |
| `BASE_PATH` | Public build path | Pages only | Vite `base` for the project-site prefix |
| Client secrets | — | None | GeoSearch and SODA are public, keyless |
| Server secrets | — | None | No backend |

See `.env.example`. Never put secrets in `VITE_*` variables.

## SPA routing

React Router uses `BrowserRouter` with `basename` derived from Vite `BASE_URL`.

GitHub Pages has no server rewrite engine. Refreshing `/guide/income` (or the prefixed Pages equivalent) would otherwise 404. Publishing `404.html` identical to `index.html` returns the SPA shell so the client router can resolve the path. `.nojekyll` prevents GitHub from ignoring files that Jekyll would skip.

## How deployment is triggered

From a clean, passing tree:

```bash
npm test
npm run typecheck
npm run lint
npm run deploy
```

`npm run deploy` builds with `BASE_PATH=/nyc-real-estate-analyzer/` and force-updates the `gh-pages` branch only. It does not change `main`.

## Redeploy

```bash
npm run deploy
```

Wait one or two minutes for GitHub Pages to refresh.

## Rollback

Checkout the last known-good commit on `main`, then run `npm run deploy` again. GitHub Pages also lists prior deployments under **Settings → Pages**.

## Public beta URL

https://sinfosecurity.github.io/nyc-real-estate-analyzer/

## Known limitations

- Deal data stays in the tester’s browser. It is not shared, synced, or visible to the repository owner.
- Clearing site data, using a different browser, or a different device starts empty.
- The repository is public so the client source is public. That is acceptable because there are no server secrets.
- NYC GeoSearch and PLUTO/SODA are third-party public APIs and can rate-limit or change CORS independently of this app.
- This hostname is a GitHub Pages project URL, not a custom production domain.
