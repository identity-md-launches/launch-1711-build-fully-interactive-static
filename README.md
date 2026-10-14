# Claus Crawl

A static Claus Network project scanner inspired by [CrawlScan](https://crawlscan.fun/). The black Claus octopus walks real registry connections while each visit produces a scan log and a public activity report.

**Publishable directory: `dist/`.** Source, lockfile, and the complete production export are included. No publication or account creation has been performed.

## Install, run, rebuild

Use Node **24.14 or newer within Node 24**.

```sh
npm ci --ignore-scripts
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

Open the local URL printed by Vite. `npm run build` creates a classic JavaScript bundle, copies the local SVGs and manifest, generates `dist/index.html`, and checks file types, relative paths, metadata, origins, and publishing limits. The classic bundle also runs in an opaque-origin sandbox without a module CORS dependency. The site has no runtime dependencies, forms, cookies, browser storage, credentials, or remote assets.

## Use it

- Leave the search blank and choose **crawl →** or **Run demo** for a six-project tour. A name, slug, or description search narrows the trail; an exact slug selects one project. Broad searches visit up to six matches, with the limit disclosed in the log.
- Choose **Live data** before crawling to request public sources. **Stop** cancels requests and movement, retaining completed results. The animation stops for reduced-motion preferences.
- Select a map node or project row to inspect its description, registration status, profile, links, and activity. Featured, All projects, and Scanned are session filters. Export report downloads the results and source provenance as JSON; Copy log copies the transcript or selects it if clipboard access is unavailable.
- `#project=agent-blackbox` opens a project selection without starting a scan. Ordinary links and assets work at a static subpath.

## Data and limitations

The bundled snapshot was captured on **14 October 2026**, with **29 registry projects**, **6 Home-visible projects**, **21 returned activity events**, and **10 successfully retrieved detailed profiles**. It is real cached public data. Some profile reads failed; available Home context supplies explicitly attributed counts, and missing fields remain unknown. Demo mode makes **zero outbound requests**.

Live requests use `credentials: "omit"`, no redirects, and a 15-second timeout per request. Graph and context cursors are followed for up to 20 pages, with repeat cursors, page limits, and interrupted pagination disclosed as incomplete. Successful pages are retained if a later page fails. Every source retains its own mode and observation time.

The only declared connection origins are:

- `https://claus.si`: project overview/full graph, project profiles, activity, and context.
- `https://claus-network-api.vercel.app`: the official public graph/profile fallback specified by the publishing guide.

The HTML [directory](https://claus.si/read/network) and project pages are offered as source links; the app reads JSON. Project-authored names and descriptions are escaped. Remote logos, instructions, URLs, and code are never executed or embedded.

“Recent” means an event or profile update within seven days **of that source's observation**, including a dated cache. The verdict measures public activity, not security, uptime, legitimacy, adoption, or financial quality. A missing event does not prove inactivity. Registry references and the narrower Home inventory are kept distinct.

**Observed live limitation:** browser requests to several `claus.si` feeds lacked CORS headers. The official API returned live overview/profile data in the real browser check; other sources fell back to the labeled snapshot. This is reported in the UI and exported report, not treated as an empty feed. Provider availability and CORS can change.

## Publish to Claus

Follow the official [static publishing guide](https://claus.si/docs/project-uis) and [build guide](https://claus.si/build.txt). Download and extract the [official client](https://claus.si/downloads/claus-network.zip) outside this repository.

Set `CLAUS_CLIENT_DIR` to the extracted client directory. Set `CLAUS_NETWORK_IDENTITY_FILE` to your **existing authorized local identity JSON file**, kept outside `dist/` and source control with mode `0600`. These are owner-settable paths, not new identities. From this repository, the exact command sequence is:

```sh
export CLAUS_CRAWL_SITE_DIR="$(pwd)/dist"
cd "${CLAUS_CLIENT_DIR:?Set the extracted official client directory}"
npm ci --ignore-scripts
CLAUS_NETWORK_IDENTITY_FILE="${CLAUS_NETWORK_IDENTITY_FILE:?Set the existing local identity file}" \
  node examples/publish-site.mjs "$CLAUS_CRAWL_SITE_DIR" claus-crawl "Claus Crawl"
```

Publish **only `dist/`**. It contains `index.html`, `claus.json` (`claus-project/1`), local CSS/JS, the octopus logo, and its preview SVG. The command uses the chosen `claus-crawl` slug and prints the real project, site, and map URLs. Save those returned URLs; no deployment URL is claimed here. No key or identity file is part of this submission.

## Validation

Production build, TypeScript, **10 data tests**, **14 browser interaction checks**, and **16/16 pinned design-probe checks** were run locally. Detailed results, actual limitations, source locations, and the six-domain Better Interface review are in [artifacts/validation.md](artifacts/validation.md). Implemented design tokens and behavior are in [DESIGN.md](DESIGN.md).

To repeat the shipped interaction checks:

```sh
npx playwright install chromium webkit
npm run build
npm run test:browser
```

Linux WebKit may need Playwright's system libraries (`npx playwright install-deps webkit` on a machine where system installation is allowed). The browser test starts and stops its own local server and writes only `test/scratch/interactions/`. `IMD_PLAYWRIGHT` can point to an externally installed Playwright `index.mjs`.

The build and dependency tooling in this run were installed under `/tmp`, with `/tmp` binaries added to `PATH`; no dependency directory is included. The explicit `.gitignore` path budget is **256 bytes** (implemented: 191 bytes), covering generated dependencies/caches at every nesting level and disposable test outputs. `dist/` is intentionally included.

## Credits

Claus is the black ink octopus from [@contractclaus](https://x.com/contractclaus) / [claus.si](https://claus.si/). The local SVG is a vector interpretation of the [published character](https://claus.si/assets/claus-logo.png), preserving its black silhouette, asymmetric cream eyes, and curled arms. CrawlScan supplies the terminal-flow reference; this scanner concerns only Claus projects.

Design guidance: Jakub Krehel's Better Interface (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation guidance: Paul Bakaus's Impeccable (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). The supplied license notices are retained in [licenses/design-guidance.txt](licenses/design-guidance.txt).
