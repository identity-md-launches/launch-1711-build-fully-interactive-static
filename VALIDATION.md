# Claus Crawl swarm revision: worker validation

Complete for the stated scope. This is a local worker report, not independent certification. Nothing was published or deployed by this job. The final `dist/` is the static publishing deliverable.

## Scope and preservation

This is an addition to the existing Vite/TypeScript application, not a replacement. The available animation brief names a Claus crawler swarm and activity terminal; the routes, playback pace and controls were ordinary implementation decisions using the seven existing module definitions. No essential owner input was needed.

| Requirement | Result and evidence |
| --- | --- |
| Claus-native intelligence remains primary | Preserved search, scope filters, directory, project pages, activity and evidence modules; 19 existing interaction checks |
| Claus Launch Radar and directory | Preserved publication logic; launch panel now explicitly carries the requested Claus Launch Radar name |
| Project intelligence and evidence-backed signals | Preserved releases, source clocks, verified deployment links, attributed caveats and similarity hypotheses; no invented safety score |
| Animated black Claus octopus swarm | Seven moving actors reuse `octopusBody`, with independent routes, walking arms, scan dwells, selected agent and pause/resume |
| Activity terminal | Recorded event replay and actual per-source request progress; no fake live feed |
| Existing source integrations | Same endpoints, validation, pagination, rate limits, cancel/retry and public-read boundary; default load makes zero external requests |
| Exact support address | `0x96126Cd68400b80EB1cd1FC51A639B60BD732Fd6`; copy, manual fallback and bundled QR preserved |
| Existing branding/navigation/responsive features | Existing shell, mission, palette, local assets, hash routes and working pages retained |
| Static workflow | Existing `vite.config.js`, package manifest, lockfile and `claus.json` unchanged; classic IIFE, relative assets, opaque-origin sandbox tested |
| First 390px screen | Product, Explore projects action, Refresh sources and visible crawler artwork; see `overview-mobile.jpg` |
| Share metadata | Title, favicon, description, og:title and og:image present; taste share check passes |
| Design/build documentation | Root `DESIGN.md` describes final source; README has install, preview, rebuild and existing owner publication commands |

The visual idea remains Claus-native research in a dark workspace, with black octopuses tracing an explicitly illustrative source map next to readable evidence.

## Diagnosis before editing

The inherited `src/main.ts` `networkArt()` (now line 54) rendered a stationary SVG and an octopus disc. `src/style.css:252` only animated a pending-request spinner; it contained no travel or tentacle keyframes. The inherited mobile rule at `src/style.css:300` hid `.network-art`. There was no swarm animation loop to restart. This establishes the cause in the supplied implementation; it does not identify who removed animation or which earlier historical change did so.

A second issue kept the terminal static during requests: `refreshDataset()` waited for `Promise.allSettled`, reported the four outcomes afterward, and `refresh()` rerendered the log only at completion. A third issue became apparent while repairing this path: failed refreshes started from `cachedDataset()` and could replace a newer successful session observation with the older bundled snapshot.

## Implementation and data boundaries

- `src/swarm.ts` contains a single lifecycle-controlled controller. SVG translations implement travel independently of CSS body/arm transforms. Pausing, offscreen panels, hidden documents and reduced-motion preferences suspend the relevant work. Route changes remove listeners/observers and cancel pending animation frames and replay timers.
- Seven agents are **illustrated module identities**, not seven running servers. Movement, scan dwell and route geometry are demo presentation, labeled “Demo motion · real records.” Their positions do not represent verified relationships or current scanning progress.
- Recorded replay starts with two actual records, remains paused until requested, appends one record per 1.4 seconds, stops at the end and can restart. Each row preserves the event timestamp and links to its project and source. It never invents events or uses playback time as observation time.
- Refresh sources performs real on-demand reads. `src/data.ts:146` reports each request start/result as it happens, while the existing transcript and terminal append actual entries. Stop cancels outstanding requests and preserves the previous dataset. Source labels become Live read only for successful reads. Subsequent failures retain the latest session data with its original clock and label it Recorded.
- The loaded snapshot, project intelligence rules, persistent crawler and supported read origins remain unchanged. No wallet connection or transaction flow was added. No continuous service is connected.

A real browser request at **2026-10-14 12:16 UTC** returned **2/4 sources**: registry and Home inventory were live; graph and activity retained their 10:48 UTC recorded observations. The exact UI result is in `live-read.json`. Availability can change. Deterministic success/failure/cancellation checks use mocked provider responses separately; those are never shipped as product data.

## Actual commands and results

The repository forbids writes to dependency/configuration paths. Build tools were installed under `/tmp` from copies of the unchanged manifest and lockfile, without creating a repository `node_modules/`:

```sh
mkdir -p /tmp/claus-crawl-tools
cp package.json package-lock.json /tmp/claus-crawl-tools/
npm ci --prefix /tmp/claus-crawl-tools --cache /tmp/claus-crawl-npm-cache --ignore-scripts
PATH=/tmp/claus-crawl-tools/node_modules/.bin:$PATH npm run build
PATH=/tmp/claus-crawl-tools/node_modules/.bin:$PATH npm run typecheck
npm test
node --experimental-strip-types --test tests/crawler.test.mjs
```

| Check | Actual result |
| --- | --- |
| Production build and export validation | Pass; 7 runtime files, 243,673 raw bytes, 257,179 serialized bytes; largest file 200,281 bytes |
| TypeScript | `tsc --noEmit`: pass |
| Data/intelligence tests | 23/23 pass |
| Persistent crawler/scheduler tests | 6/6 pass; scheduling verified with 10ms test intervals, no long timer wait |
| Existing browser interactions | 19/19 pass after repairing a test synchronization race described below |
| New swarm interactions | 10/10 pass |
| Pinned taste@1 probe | 16/16 pass |
| Automated accessibility | 0 violations in 14 axe-core scans: seven routes at 390 and 1440; incomplete checks are retained in `accessibility.json` |
| Resource/console errors | No unexpected page exceptions or missing local resources in deterministic tests; actual unavailable external reads are reported as cache fallback |
| Export/submission hygiene | Relative assets, required metadata, unchanged lockfile/configuration, no new dependencies or submodules; size details in `submission-size.json` |

Browser commands used on this worker:

```sh
export IMD_PLAYWRIGHT=/tmp/claus-crawl-tools/node_modules/playwright/index.mjs
export PLAYWRIGHT_BROWSERS_PATH=/tmp/claus-crawl-browsers
export IMD_WEBKIT_EXECUTABLE=/tmp/claus-crawl-webkit
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
npm run test:browser
node tests/swarm.mjs
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

Node was 24.21.0, Vite 7.3.1, TypeScript 5.9.3, and Playwright 1.56.1, with Chromium 141 and WebKit 26. The supplied browser MCP launcher failed with `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`. Production browser inspection instead ran in bounded Playwright scripts that started and closed their own subpath preview servers. WebKit initially lacked host libraries. It subsequently executed successfully with a temporary wrapper, bundled WPE libraries, relocated system libraries and Mesa software rendering. Skipping the host preflight did not skip WebKit execution. No browser binary/library/cache is delivered.

An additional bounded script (`test/scratch/audit-final.mjs`, disposable) served the final export, injected axe-core 4.11.0 from `/tmp/claus-crawl-audit-tools`, inspected seven routes, measured the actual new text/background pairs, and wrote the retained screenshots and accessibility report. The earlier audit script also performed the actual public read recorded separately. The normal installation and browser commands for another machine are in README; use Playwright’s standard browser/system dependency installation there.

## Interaction coverage

The 19 preserved checks cover static subpath loading without remote requests; keyboard search and dedicated project routing; unmatched searches and arbitrary-address rejection; filters, sort and pagination; activity-type counts; verified deployment/evidence links; agent hypotheses; JSON export; exact tip address and copy; malformed/unknown routes; 320/390/760/1440 reflow across seven routes; skip-link and heading focus; provider success/failure/malformed data; cancellation and reduced motion; opaque-origin hosting; 200% text enlargement; and WebKit mobile search/project/support behavior.

The 10 additional checks cover:

1. Seven changing SVG travel positions with no default network requests.
2. Keyboard pause/resume, frozen tentacles and selectable module identity.
3. Route cleanup plus retained selection and pause preference.
4. Finite replay with actual timestamps, pause/restart and project/source links.
5. A fast source result appearing while another source is still pending; Stop cancels and restores focus.
6. Successful refresh followed by failure retaining updated data and its original observation clock, including JSON export and corrected source-header labeling.
7. Initial and dynamically changed reduced-motion preferences.
8. Offscreen suspension and resume without a large time jump.
9. Visible first-screen product/action at 390 and reflow/controls at 320/390/760/1440.
10. WebKit travel, pause, recorded replay and project navigation at 390.

## Better Interface: six-domain review

The pinned workflow and core principles in all six domains were read before implementation. Supporting animation/performance, focus/motion and documentation sections informed the controller, controls and final DESIGN.md. The user’s preservation requirement takes precedence over the generic six-word marketing-headline preference: the existing seven-word “Every Claus launch leaves a trail” branding is retained.

| Domain | Coverage and evidence | Limits |
| --- | --- | --- |
| Accessibility | Checked native buttons/select/links, visible labels, keyboard paths, 2px focus ring, 44px new controls, decorative SVG exclusion, log/status semantics, reduced motion, forced colors, cancellation focus return and automated rules | No screen-reader session or physical device; automated scan is not complete conformance |
| Layout | Checked 320, 390, 760 and 1440 routes; map/terminal stacking; first phone screen; wrap/no horizontal overflow; 200% root-text enlargement; controls outside the scrolling feed | No browser-native zoom or RTL/localization session; above-1700 sidebar breakpoint source-reviewed only |
| Writing | Checked every new action/state against actual behavior, Demo/Recorded/Live distinctions, retry/stop/empty copy, event provenance and retained-record labels | Public project descriptions remain source-authored claims |
| Typography | Reused six-size scale, two stacks/two weights, tabular event times, selectable full text, 16px mobile select; screenshots inspected in both engines | System fallback fonts differ; no claim that Inter is installed; tiny decorative SVG labels are not the sole source of information |
| Colors | Reused existing tokens; measured actual new text/background pairs; inspected focus and forced-colors rendering; corrected forced-colors SVG specificity | Not every animated pixel/background combination has a numeric contrast measurement; axe reports incomplete contrast checks, retained in JSON |
| UI | Checked actual moving/frozen/reduced states, selected route/agent, loading/stop/received/fallback, empty log, replay end/restart, native focus, scrollback, and per-route cleanup; slow CSS motion sample inspected | The slow-motion screenshot slows CSS tentacles to 0.1×, not the JavaScript travel loop; no manual animation-devtools session |

Representative computed contrast pairs (4.5:1 requirement for these small text sizes):

| Rendered pair | Ratio |
| --- | --- |
| Swarm subtitle `#a0b0bf` on `#101923` | 7.98:1 |
| Terminal source/status/timestamps `#92a5b6` on `#0a1017` | 7.53:1 |
| Terminal links `#b1d9ef` on `#0a1017` | 12.77:1 |
| Motion button / agent select text `#e5edf4` on `#101923` | 14.98:1 |

## Findings, repairs and rechecks

| Severity / domain | Source and finding | Repair and evidence |
| --- | --- | --- |
| High / functionality, UI | Inherited `src/main.ts:54` and `src/style.css:252,300`: static mascot, no crawler travel and mobile art hidden | Added bounded `src/swarm.ts:65,189,209` lifecycle/translation and `src/style.css:428` arm motion; Chromium/WebKit transforms change and pause; mobile screenshot shows crawlers |
| High / functionality, writing | Inherited refresh waited for all source results; terminal appeared inactive during slow reads | `src/data.ts:146–179`, `src/main.ts:14,123`, `src/swarm.ts:129`: immediate settled-source reporting and append-only feed; gated-source browser test confirms output before completion |
| Medium / data honesty | Failed refresh could replace newer session data with an older bundled dataset | Optional prior dataset in `src/data.ts:146`; failure retains its fields/clocks and labels them Recorded. Regression test checks changed name and exact timestamp after a second failed refresh |
| Medium / writing | Original snapshot header would be inaccurate for newly retained session observations | `src/main.ts:47,106` now points to per-source dates after attempted reads. Regression test and source rows confirm label/clock agreement |
| Medium / writing | First draft added two short two-sentence status lines, yielding four slogan-like lines in taste | `src/swarm.ts:41,142`: concrete Demo motion / real records and single-line playback status. Probe improved from 15/16 to 16/16 |
| Low / UI | Initial actors traveled across the central mascot and obscured its silhouette | Separate waypoints and selected paths in `src/swarm.ts:12,46,215`; final desktop/mobile screenshots keep the hub readable |
| Medium / accessibility | High-contrast inspection found grey SVG node states and weak selected route/tab distinction | `src/style.css:459`: explicit CanvasText/Canvas/Highlight rules with sufficient specificity; forced-colors screenshot rechecked |
| Low / accessibility | Rewriting identical polite status text on each replay tick could repeat announcements | `src/swarm.ts:145`: update the stable status region only when its string changes; source inspection and replay regression pass |
| Validation defect | `tests/interactions.mjs:43` occasionally counted directory rows after the hash changed but before the hashchange renderer ran | Wait for `.directory-list` before counting. This preserves the assertion and fixes test synchronization; final suite rerun, rather than treating the earlier 18/19 run as a pass |

The final forced-colors screenshot shows black source labels and a distinct highlighted selected route/tab. Axe’s remaining incomplete contrast entries are the decorative SVG text (background-image resolution) and the inherited support textarea (reported as partially obscured); they are disclosed rather than counted as numeric passes. The support address remains selectable, copied exactly and visible in the preserved browser screenshot.

No unresolved high-impact finding was observed in the implemented scope. The original request did not authorize a redesign of unaffected pages, invented source coverage, or a connected monitoring service; none was introduced.

## Retained evidence and limitations

- [390px first screen](artifacts/overview-mobile.jpg)
- [Desktop swarm and terminal](artifacts/swarm-desktop.jpg)
- [Visible mobile keyboard focus](artifacts/swarm-mobile-focus.jpg)
- [WebKit mobile swarm](artifacts/swarm-mobile-webkit.jpg)
- [Automated accessibility, measured colors and controls](artifacts/accessibility.json)
- [Actual public-source read](artifacts/live-read.json)
- [Taste checks](artifacts/taste-checks.json), [existing interactions](artifacts/interaction-results.json), [swarm interactions](artifacts/swarm-results.json)

Screenshots were rendered and inspected, not inferred from source. Disposable full-page/taste, forced-colors and slowed-animation screenshots live in `test/scratch/` and are not part of the submission. Small named final screenshots are retained above. A direct history-bundle attempt could not complete because the partial Git clone tried to fetch a promised object into read-only `.git/objects`. The complete working-tree payload (including named artifacts) is instead counted conservatively in `submission-size.json`; the uploader-generated Git bundle itself was not measured locally. No Git metadata or ignore rules were changed. Named `artifacts/` outputs are excluded by the environment’s Git exclude file; this current report is also included in root `VALIDATION.md` so the validation record travels with the source.

No locale/RTL, native zoom, assistive-technology session, physical-phone, production-host publication, continuous-backend deployment or payment was tested. The tip receiving networks remain unverified as before. Static hosting does not run the included persistent crawler; the animation is not a substitute for such a service.


---

# Historical validation from the previous delivery

The following record is preserved as prior work, not as new measurements for the swarm revision.

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
