# Claus Crawl validation

Worker-run checks on 14 October 2026. These results are local evidence, not independent certification by the submission verifier. **Complete for the implemented static dashboard and operator-run crawler scope.** Continuous hosting, creator identity APIs and receiving-network confirmation remain the external limitations described below.

## Results

| Area | Actual result |
| --- | --- |
| Production build and export integrity | Pass; seven files, **225,400 bytes**; largest file 188,479 bytes; serialized export 238,422 bytes |
| TypeScript | `tsc --noEmit`: pass |
| Data / analysis tests | **23/23 pass** |
| Persistent monitor / scheduler tests | **6/6 pass** |
| Browser interactions | **19/19 pass**, including Chromium and WebKit |
| Pinned design probe | **16/16 pass**, at 320, 390 and 1440 widths |
| Accessibility rules | Axe-core 4.11.1: **zero violations**, seven routes × two widths; manual-review flags were examined and applicable issues fixed |
| First 390px screen | Product name, purpose, search input and “Explore projects” action visible; action fits within 844px viewport height |
| Live integration | Real browser: **3/4 live sources**, activity retained as dated cache; real backend run: **4/4 live sources**, persistent state written |
| Snapshot capture utility | Real public run: **32 projects, 32 profiles, zero profile errors**; output verified under `/tmp`, delivered snapshot left unchanged |
| Tip QR | Generated locally with qrcode 1.5.4; decoded with jsQR 1.4.0 to the exact 42-character supplied address |
| Share metadata | Title, favicon, description, `og:title`, `og:description`, `og:image`, local preview SVG present |
| Runtime assets / scope | Relative assets, hash routing, no runtime dependencies, no default external requests, no client secrets, no wallet/transaction flow |

The packaged source, export and documentation are far below the 8 MiB submission limit. The final size audit is recorded in `artifacts/submission-audit.json`. Build configuration, existing dependencies/lockfile, ignore rules, restricted directories and Git metadata were not edited. Required source and runtime assets remain present; no dependency archive or submodule was added.

## Commands actually run

The final build/typecheck and final automated suites used **Node 24.14.0**, TypeScript **5.9.3**, Vite **7.3.1** and Playwright **1.56.1**. Dependency manifests and lockfiles were copied to `/tmp/claus-build` for installation; no repository dependency directory was created. The machine initially supplied Node 24.9.0; a compatible Node 24.14.0 tool was installed outside the repository for final checks.

```sh
npm run typecheck
npm test
node --experimental-strip-types --test tests/crawler.test.mjs
npm run build
npm run test:browser
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
node --experimental-strip-types server/crawler.mjs --once --state /tmp/claus-crawl-monitor/state.json
node --experimental-strip-types scripts/capture-snapshot.mjs --out /tmp/claus-research/capture-validation.json
```

The production build includes `node scripts/finalize.mjs` and `node scripts/check-export.mjs`. All final commands above succeeded. The public backend run produced `runs: 1`, `liveSources: 4`, `retainedEvents: 29`, `retainedFindings: 36`; findings include attributed caveats and low-confidence name hypotheses, not 36 verified risk incidents.

Tool location overrides in this constrained worker were:

```sh
export PATH=/tmp/claus-node-tool/node_modules/.bin:/tmp/claus-build/node_modules/.bin:$PATH
export IMD_PLAYWRIGHT=/tmp/claus-build/node_modules/playwright/index.mjs
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pepefront-browsers
```

WebKit initially could not launch with the machine's default library search paths. A compatible existing wrapper and relocated system libraries were used successfully, with Mesa software rendering paths:

```sh
export IMD_WEBKIT_EXECUTABLE=/tmp/pepefront-webkit
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
export LIBGL_DRIVERS_PATH=/tmp/imd-review-deps/usr/lib/x86_64-linux-gnu/dri
export __EGL_VENDOR_LIBRARY_FILENAMES=/tmp/imd-review-deps/usr/share/glvnd/egl_vendor.d/50_mesa.json
export MESA_SHADER_CACHE_DIR=/tmp/claus-mesa-cache
ulimit -c 0
npm run test:browser
```

Skipping the default host-library probe did not skip WebKit execution: mobile navigation, search, project detail, copy fallback and a screenshot all completed in WebKit. Earlier browser crash dumps were removed; none is delivered. A normal machine should install Playwright's standard browser/system dependencies instead of copying these worker-specific paths.

A temporary audit script under `/tmp` served the production export, injected axe-core only into the test browser, ran WCAG 2 A/AA, 2.1 AA and 2.2 AA rule tags on each principal route at 390 and 1440, and closed its server. No accessibility test library is in the production export. QR generation/decoding tools likewise stayed under `/tmp`.

## Interaction coverage

`tests/interactions.mjs` exercises the built export under `/preview/`, not the TypeScript dev server. It also serves a realistic opaque-origin CSP under `/sandbox/`.

- No outbound request on default load; complete local assets, no application console errors or missing resources in the controlled default session.
- Keyboard search → directory → project, slug deep links, official links, releases, identity fields and creator-unavailable copy.
- Unknown search/address input, Escape, clear recovery, Home/full registry scope, sorting and all three registry pages.
- Activity filtering, source links and exact fixture event counts.
- Source-verified Sepolia deployment/explorer links, attributed review caveats and hypothesis labeling.
- JSON download with stable IDs, per-source clocks, source URLs and evidence.
- Exact clipboard contents, success confirmation, loaded QR, no network selector or wallet/transaction action.
- Unknown and malformed routes recover without a server rewrite.
- All seven principal routes at 320, 390, 760 and 1440: no horizontal overflow.
- Skip link, visible primary-action focus and heading focus after navigation.
- Mocked successful live responses, unavailable feeds, malformed responses, retry, stop and reduced motion.
- Opaque-origin sandbox: JavaScript, navigation, recorded data and manual-copy fallback work despite unavailable localStorage.
- 200% root-text enlargement on overview, support and an evidence project at 760px; no horizontal overflow.
- WebKit mobile search, project route and support copy/fallback, with no page exception.

Live provider fixtures in deterministic tests are explicitly mocks. They are not evidence that the public service is always available. Separate real reads established the CORS limitation and working backend paths.

## Better Interface review: all six domains

The pinned contents, workflow, six core domains and documentation section were read before/while implementation. The supplied license notices remain in `licenses/design-guidance.txt`. One consolidated review was applied to the actual production export.

| Domain | Checked | Limitations |
| --- | --- | --- |
| Accessibility | Native controls/links, labels, named chart/log, skip and route focus, visible 2px focus ring, reduced motion, complete address selection, clipboard fallback, axe on seven routes | No human screen-reader session, physical touch device or complete forced-colors evaluation |
| Layout | First mobile screen, all principal routes at 320/390/760/1440, source/primary-action order, long IDs and names, responsive panels, 200% text enlargement | Native browser 200% zoom and RTL mirror not performed; >1700px breakpoint source-reviewed only |
| Writing | Exact data scopes, live/recorded wording, publication versus token distinction, uncertain names, unknown creator data, actionable empty/error/retry copy, voluntary support terms | Public descriptions remain author claims and are displayed as such |
| Typography | Six-size source scale, two families/two requested weights, heading order, mobile 16px inputs, wrapping, selectable IDs, restrained tracking | System font fallback varies by OS; no claim that a remote Inter font loaded |
| Colors | Named hex roles, solid surfaces, measured rendered text pairs, distinguishable statuses with text, white QR background | No light theme requested; artwork is decorative, not a contrast-dependent control |
| UI details | Hover/focus/pressed/loading/empty/error/success states, flat structural panels, consistent SVG icons, stopped/reduced animation, exports, hash navigation, source disclosure | Animation-panel playback at 10% speed not performed; no overlay/transaction flow exists to test |

Representative contrast pairs were calculated from the actual CSS custom-property values retrieved in the browser using sRGB relative luminance: primary text/page **16.15:1**, muted text/surface **7.98:1**, faint text/surface **6.99:1**, primary-action text/fill **10.88:1**, warning text/surface **10.38:1**, focus/surface **14.50:1**. The pinned probe independently passed its measured text contrast checks. These ratios do not establish contrast for every possible image or future theme.

## Findings, fixes and rechecks

1. **Medium, accessibility: skip navigation entered the router.** `src/main.ts:142`, `document.querySelector('.skip-link')...`. The original native `#main` action was interpreted as an unknown app route. It now prevents hash mutation, focuses main and scrolls it into view. Rechecked with keyboard in the browser suite; route heading focus remains correct.
2. **Medium, accessibility: chart/log labels had generic roles.** `src/main.ts:61` and `src/main.ts:79`. Axe manual-review flags identified `aria-label` on untyped `div`/`pre`. The chart now has `role="group"`; the transcript has a named log role with `aria-live="off"`. Rechecked in final axe and interactions.
3. **Medium, layout/typography: repeated decorative initials resembled heading kickers.** `src/main.ts:57`, `src/style.css:368`. The first probe flagged three initials positioned above discovery headings. Initials and titles now share a horizontal row. Discovery also shows projects outside the latest-publication list, avoiding unnecessary repeat content. Final probe: no eyebrow or repetition failure.
4. **Low, colors/UI: illustration background and standalone links were ambiguous to automated checks.** `src/style.css:371`, `.art-caption`, and `src/style.css:372`, `.back-link,.support-copy>.text-link`. Caption background is now explicitly the page color; back-navigation links are underlined. This preserves the diagram while clarifying contrast/affordance. Final axe/manual image review rechecked.
5. **Medium, data clarity: snapshot source URLs and profile freshness needed independent provenance.** `src/data.ts:62`, `src/data.ts:163`, `src/main.ts:82`. Captured sources now retain the actual requested source origin; profile modes survive route changes and fallbacks keep their clocks. Mocked success/failure and real 3/4-live tests verified the labels. Recorded activity does not become fresh when only a profile refreshes.
6. **Medium, resilience: malformed clocks and oversized responses could reach rendering.** `src/data.ts:10`, `src/data.ts:69`. Clocks must be safe, renderable numbers; graph observation times are validated; responses are size-bounded while streaming. Tests cover unrenderable clocks, bad fields, cursor loops, partial pagination, invalid releases, userinfo origins, byte limits and rate-limit cooldowns.
7. **Medium, analysis: repeated records must not become duplicate-project accusations.** `src/intelligence.ts:30`. Similarity groups deduplicate IDs before comparing normalized names, and always remain low-confidence hypotheses. Tests cover repeated IDs, equal names, distinct names and absence of ownership assertions.

No unresolved high-impact defect was observed in the implemented static scope. The pinned probe reports 14 text controls below the comfortable 44px size at 390, all meeting its 24px-or-spacing requirement; primary touch controls are 44px. Those compact secondary links are an intentional dashboard-density tradeoff.

## Evidence files and limits

Disposable full evidence is generated under `test/scratch/` and is removed by the submission workflow. Selected copies are under `artifacts/`:

- `overview-mobile.png`, `overview-desktop.png`, `support-webkit.png`.
- `interaction-results.json`, `accessibility-results.json`, `taste-results.json`.
- `integration-report.md`, `validation.md`, `submission-audit.json`.

Desktop overview, first 390px screen, keyboard-focus state, project detail and support screenshots were inspected. The assigned browser tool was also used to navigate the production export, inspect the support page, exercise refresh, inspect source state and read the actual CORS errors. Earlier temporary-preview shutdown produced a local image request failure; this was a preview-lifecycle issue, not a missing export asset. Final controlled production tests and the pinned probe report no missing local files or script errors.

The repository's existing `.git/info/exclude` excludes `artifacts/`; it was not changed. `INTEGRATION.md` and this root `VALIDATION.md` retain the reports in the Git deliverable, with identical artifact copies for the task's separate artifact collection. `DESIGN.md` documents the final source tokens and behavior.

## Remaining product and infrastructure limits

Continuous backend operation is not deployed. Public identity APIs do not support reliable creator attribution. Activity completeness is bounded and browser CORS is inconsistent. Source-verified chain evidence was not independently reverified against RPC. No full security verdict, full transaction archive, website-content diff, notifications or watchlists is claimed. Receiving networks for the supplied tip address are unverified, so the address-only flow deliberately requires users to confirm before sending.

`npm audit` on the immutable inherited lockfile reported one high-severity Vite dependency entry and one low-severity esbuild entry, relating to development-server behavior. Dependencies were explicitly out of edit scope. No affected dev server is deployed with the static export. A future authorized dependency-maintenance change should address these advisories; this does not change the preserved build configuration in this assignment.
