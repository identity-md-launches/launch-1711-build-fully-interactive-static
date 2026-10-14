# Claus Crawl

**Every Claus launch leaves a trail.** A static intelligence and discovery dashboard exclusively for the Claus ecosystem. Explore actual public projects, profile publications, website releases, explicit relationships and attributed evidence. The black Claus octopus remains the crawler identity, now in a dark interface with icy-blue accents.

The deliverable is **`dist/`**, alongside source and the unchanged package manifest/lockfile. It uses relative assets and hash routes, so it works at an IPFS gateway subpath and in the Claus isolated static host. No hosting or publication command was run.

## Install, preview and rebuild

Use **Node 24.14 or newer within Node 24**.

```sh
npm ci --ignore-scripts
npm run dev
```

Build and preview the production export:

```sh
npm run typecheck
npm test
node --experimental-strip-types --test tests/crawler.test.mjs
npm run build
npm run preview
```

Open the URL printed by Vite. The build retains the inherited classic JavaScript IIFE, generates `dist/index.html`, copies local SVG assets and `claus.json`, then checks metadata, relative paths, allowed origins and Claus publication limits. There are no runtime npm dependencies, remote fonts, wallet libraries, private API calls, application forms or client-side credentials.

## What works

- Overview with latest **profile publications**, recently updated Home projects, seven-day returned-event counts and clearly unavailable verified-risk coverage.
- Search by name, slug, project ID or description; Home/full-registry filters, sorting, pagination and empty-state recovery.
- A dedicated `#project=SLUG` page for every loaded project: stable ID, public status/revision, description, official links, returned releases, timeline, explicit graph relationships, published review caveats and source-verified deployment links where supplied.
- Activity-type filters, per-source timestamps and completeness, manual live refresh, cancel/retry, validated responses and independent dated fallback.
- Seven focused crawler modules; name overlaps remain hypotheses. JSON evidence exports preserve source clocks, IDs, caveats and actual crawl steps.
- **Support Claus Crawl** in navigation and footer, with a dedicated “Support the Crawl” page, full selectable address, Copy Address confirmation/fallback and a locally bundled, decoded-and-verified QR code.
- A separate persistent Node crawler with non-overlapping scheduled runs, first-seen tracking, metadata differences and deduplicated evidence. See [server/README.md](server/README.md).

## Real data and limits

The default view makes **zero external requests**. Its recorded public snapshot was assembled on **14 October 2026 at 10:51 UTC** from source observations around 10:48 UTC and profile reads at 10:50 UTC: **32 registry records, nine Home-visible projects, 29 returned events and 32 profiles**. These scoped counts are not ecosystem totals, independent teams or active workers. There are no fictional demo records. Test fixtures and mocked browser responses exist only in tests.

A “launch” means the public profile publication reported by Claus. A website release is distinct from a token launch. Public descriptions are untrusted project claims. Profile `updatedAt` is not the project's original creation time. Current public release lists are not complete lifetime histories. Creator identity, creator-owned project grouping and verified owner wallets are unavailable from the verified feeds; the UI says so.

A real browser refresh returned three of four sources live; activity lacked usable CORS and retained its dated snapshot. An operator-run backend crawl returned four of four sources live. Every source keeps its own timestamp. No always-on backend is deployed or connected. Watchlists and notifications remain future additions. Missing evidence is never treated as a safety guarantee; review caveats are attributed rather than independently reverified.

Read the concise [integration report](INTEGRATION.md) for verified endpoints, SDK inspection, authentication, rate limits, native/off-chain distinctions, terms limitations and outstanding infrastructure.

Refresh the bundled public observation explicitly, review the returned records, then rebuild:

```sh
node --experimental-strip-types scripts/capture-snapshot.mjs --out src/data/snapshot.json
npm run typecheck
npm test
npm run build
```

Snapshot-specific count assertions in the tests must be checked against any newly captured observation. The capture command was successfully checked against an external `/tmp` output so the delivered snapshot and its recorded counts remain consistent.

## Support address

`0x96126Cd68400b80EB1cd1FC51A639B60BD732Fd6`

The QR contains only that address, with no chain or amount. Receiving networks have not been verified, so the site has no network selector or send flow and tells users to confirm the network with the recipient. Transfers are chosen and approved in the user's own wallet. No private key, seed phrase or wallet credential is requested. Tips do not confer tokens, ownership, access or financial returns.

## Optional persistent monitor

No credential is needed for public reads. The only required setting is a durable state path outside the repository and export:

```sh
export CLAUS_CRAWL_STATE=/var/lib/claus-crawl/state.json
node --experimental-strip-types server/crawler.mjs --once
node --experimental-strip-types server/crawler.mjs --interval-ms 300000
```

The second command is a single collection; the third is the optional continuous operator process. Provision the directory and process supervision on your own backend. The static host does not run this process, and the frontend does not expose its state file. See the [monitor documentation](server/README.md) for retention, locks, recovery and deployment boundaries.

## Existing Claus publication integration

`public/claus.json` remains `claus-project/1`, with `https://claus.si` and `https://claus-network-api.vercel.app` as its only connection origins. Publish **only `dist/`**. The current assignment's publisher consumes the committed export; it does not rebuild it.

For a future authorized owner update, use the [official static publishing guide](https://claus.si/docs/project-uis) and [official client](https://claus.si/downloads/claus-network.zip), extracted outside this repository. Set `CLAUS_CLIENT_DIR` to that client directory and `CLAUS_NETWORK_IDENTITY_FILE` to the **existing authorized mode-0600 identity file**, outside the source and export. The preserved command sequence is:

```sh
export CLAUS_CRAWL_SITE_DIR="$(pwd)/dist"
cd "${CLAUS_CLIENT_DIR:?Set the extracted official client directory}"
npm ci --ignore-scripts
CLAUS_NETWORK_IDENTITY_FILE="${CLAUS_NETWORK_IDENTITY_FILE:?Set the existing local identity file}" \
  node examples/publish-site.mjs "$CLAUS_CRAWL_SITE_DIR" claus-crawl "Claus Crawl"
```

This resumes the existing slug. Retain the actual returned project, release and map URLs. No new identity or contract is created by the website build. Owner publication credentials are never frontend environment variables. No `VITE_*` secret is required.

## Validation

Checked locally: production build/export, TypeScript, **23 data/analysis tests**, **six persistent-crawler/scheduler tests**, **19 browser interaction checks including Chromium and WebKit**, and **16/16 pinned taste@1 checks**. Automated accessibility scans found zero WCAG A/AA rule violations on seven routes at 390 and 1440 widths. This is not a claim of complete accessibility certification or a physical-device/screen-reader test. Full results, fixed findings, exact environment details and remaining limits are in [artifacts/validation.md](VALIDATION.md). The implemented design system is in [DESIGN.md](DESIGN.md).

Repeat browser validation on a machine with browser system dependencies installed:

```sh
npx playwright install chromium webkit
npm run build
npm run test:browser
```

The tests serve the export under `/preview/` and an opaque-origin `/sandbox/`, manage their own server/browser lifecycle, and write disposable evidence only under `test/scratch/`. `IMD_PLAYWRIGHT` optionally points to an external Playwright `index.mjs`; `IMD_WEBKIT_EXECUTABLE` optionally selects a compatible WebKit wrapper. The worker installed tools under `/tmp`; none is delivered. The existing ignore file remains unchanged and excludes generated dependencies/caches at every nesting level. `dist/` stays included.

The immutable inherited toolchain has npm advisories affecting development-server behavior (Vite: high; esbuild: low). Dependency changes were prohibited in this assignment. The production export has no npm runtime dependencies; keep development tooling local and plan a separately authorized dependency update.

## Attribution

Claus is the black octopus from [@contractclaus](https://x.com/contractclaus) / [claus.si](https://claus.si/). The inherited local SVG interpretation preserves the silhouette, cream eyes and curled arms. The previous scanner referenced CrawlScan; this dashboard follows the new Claus-native intelligence brief.

Design guidance: Jakub Krehel's Better Interface (MIT, `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation guidance: Paul Bakaus's Impeccable (Apache-2.0, `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). Notices are retained in [licenses/design-guidance.txt](licenses/design-guidance.txt).
