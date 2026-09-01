# Deployment — NYC Real Estate Deal Analyzer

This application is a React + TypeScript + Vite single-page app. Persistence is browser `localStorage`. NYC lookups call public HTTPS endpoints from the browser. There is no application server and no authentication.

## Selected hosting

**GitHub Pages** at `https://sinfosecurity.github.io/nyc-real-estate-analyzer/`

Why this matches the current architecture:

- The production artifact is static files in `dist/`
- HTTPS and a public tester URL are provided without a custom domain
- GitHub is already the connected account in this environment
- GitHub Actions can rebuild and publish on every push to `main`
- A `404.html` copy of `index.html` is the SPA fallback so nested routes do not 404 on refresh

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

GitHub Pages is a project site, so CI sets:

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

GitHub Pages has no server rewrite engine. Refreshing `/guide/income` (or the prefixed Pages equivalent) would otherwise 404. Publishing `404.html` identical to `index.html` returns the SPA shell so the client router can resolve the path.

## How deployment is triggered

Push to `main` runs `.github/workflows/pages.yml`:

1. `npm ci`
2. test, lint, typecheck, build with `BASE_PATH`
3. Upload `dist/` as a Pages artifact
4. Deploy to GitHub Pages

`.github/workflows/ci.yml` continues to validate PRs and `main` without publishing.

Manual republish: **Actions → Deploy Pages → Run workflow**.

## Redeploy

```bash
git push origin main
```

Wait for the Deploy Pages workflow to finish.

## Rollback

GitHub Pages keeps prior deployments. In the repository: **Settings → Pages → Deployment history**, or restore a previous commit on `main` and push.

## Public beta URL

https://sinfosecurity.github.io/nyc-real-estate-analyzer/

## Known limitations

- Deal data stays in the tester’s browser. It is not shared, synced, or visible to the repository owner.
- Clearing site data, using a different browser, or a different device starts empty.
- The repository is public so the client source is public. That is acceptable because there are no server secrets.
- NYC GeoSearch and PLUTO/SODA are third-party public APIs and can rate-limit or change CORS independently of this app.
- This hostname is a GitHub Pages project URL, not a custom production domain.
