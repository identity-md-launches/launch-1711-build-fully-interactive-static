# Claus Crawl design system

## Overview

Claus Crawl is an evidence-led discovery dashboard for the Claus ecosystem. Its visual identity is the black Claus octopus against a restrained ice-blue network diagram, surrounded by a dark, quiet research workspace. The dashboard prioritizes searchable public records, dated coverage and traceable sources. It does not use a market terminal's price, token or trading cues.

The source of truth is `src/style.css`, route renderers in `src/main.ts`, the swarm controller in `src/swarm.ts`, `src/mascot.ts`, and the local SVGs in `public/`. The swarm is an addition to the existing dashboard, with a source-map illustration beside a dated activity terminal. The inherited Vite/TypeScript stack, static IIFE export and Claus manifest remain unchanged structurally. There is one intentional dark theme.

## Colors

Canonical semantic tokens are defined in `src/style.css:1`. The source uses hex values consistently.

| Token | Value | Implemented role |
| --- | --- | --- |
| `--bg` | `#0a1017` | Page background and address field |
| `--sidebar` | `#0c131b` | Navigation background |
| `--surface` | `#101923` | Panels and inputs |
| `--hover` | `#162330` | Hovered rows and secondary surfaces |
| `--text` | `#e5edf4` | Primary text |
| `--muted` | `#a0b0bf` | Descriptions, source dates, secondary labels |
| `--faint` | `#92a5b6` | Slugs, placeholders, small metadata |
| `--line` | `#253340` | Structural dividers and panel boundaries |
| `--accent` | `#b1d9ef` | Primary action, links, selected controls, crawler disc |
| `--accent-ink` | `#10222e` | Text on the ice-blue action |
| `--accent-soft` | `#1a2c39` | Selected navigation, badges, project initials |
| `--focus` | `#d2ecff` | Keyboard focus outline |
| `--warning` | `#e4c18b` | Uncertainty and network confirmation text |
| `--ink` / `--cream` | `#000` / `#fff2d8` | Values matching the inherited character artwork |

The existing `--error` value is `#ffb9ae`; current recoverable messages use warning text rather than an error surface. The illustration uses `#294253` lines and `#7da6bf` nodes. Chart bars use ice blue for publications and `#526c81` for other events, with text counts and a legend. Input borders use stronger `#415464` / `#425564`; these are structural control boundaries, not text colors.

The hero artwork is described as an illustration in its accessible name. The new swarm is labeled “Demo motion · real records”; its decorative SVG is hidden from assistive technology and its module descriptions and real request states are supplied in ordinary text. Neither illustration is a project relationship graph. Swarm routes reuse `#415464`, grid dots use `--line`, selected trails use `--accent`, and the selected crawler has a solid ice-blue halo with a `--focus` stroke. Other halos have 0.2 fill opacity. The black/cream character geometry is reused from `octopusBody` without a new image asset. State is always also written in text: Recorded, Live read, Hypothesis, or Published evidence. Contrast measurements and coverage limits belong to the validation report.

## Typography

Two local/system font stacks, with no remote font or bundled font dependency:

- `--sans`: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for prose and controls. Inter is a local-if-present preference, not a claimed loaded asset.
- `--mono`: `ui-monospace, SFMono-Regular, Consolas, monospace` for IDs, slugs, addresses and short log lines.

The six-size scale at the normal 16px root is **12, 14, 16, 20, 28 and 40px** (`--xs`, `--sm`, `--base`, `--lg`, `--xl`, `--display`). Requested weights are 400 and 600. Body/UI text is 14px with unitless 1.5 line height; longer descriptions use 1.7–1.75. Section headings in panels are 16px, page titles 28px, and the overview mission 40px on large screens. At mobile widths the mission becomes 28px. Dense source metadata is 12px. Inputs and the address field are 16px on mobile.

Display tracking is -0.045em; page titles -0.03em; 20px section headings -0.02em. Body and data use natural spacing. Prose measures are generally 48–75ch. Complete IDs and the full tip address wrap without ellipsis. Metrics and chart counts use tabular numerals. Critical content remains selectable. Text enlargement is tested separately from native browser zoom.

## Layout

The desktop shell is a 224px navigation column plus a fluid content column; main content has a 1440px maximum width and 40px horizontal padding. The top bar is at least 76px. The main page is padded 36px at the top and 64px below. Spacing uses mostly 4, 8, 12, 16, 20, 24, 28, 32, 36 and 40px.

The overview has a compact introduction/character grid, a full-width search action, a source strip, refresh controls, the swarm/terminal work surface, four scoped metrics, a two-column launch/update and activity/evidence workspace, then project discovery. The main search action is visible on the first 390px screen. Dedicated project pages share the same shell and use side-by-side release and timeline panels followed by evidence sections.

Implemented breakpoints:

- **Above 1700px:** sidebar grows to 248px. This breakpoint was source-reviewed, not rendered during the measured viewport suite.
- **At 1200px and below:** sidebar becomes 200px, outer padding 28px, panels become denser, and secondary row detail is reduced. Full records remain available on project pages.
- **At 960px and below:** sidebar becomes a top navigation header; its support link moves into the top utility position. Navigation wraps; no sticky overlay covers content.
- **At 700px and below:** 20px outer padding, stacked search input/action, two-column metrics, one-column content panels and a 28px mission heading. The older decorative hero illustration is hidden; the new animated swarm remains visible below search on phones, alongside the octopus brand mark. Overview, directory and activity stay in the top navigation; agents and source pages remain reachable through the footer and contextual links. The support page stacks its explanation above the wallet panel.
- **At 360px and below:** outer padding becomes 16px, decorative row initials are omitted where space is tight, and the QR explanation stacks. Names, IDs and the recipient address are not clipped.

The swarm uses a 1.2:1 map/terminal grid with 22px inset spacing. It stacks at 700px and below, and also from 961–1200px where the retained sidebar leaves less room. From 701–960px it fits side by side because navigation is above the page. Mobile swarm padding is 16px and the agent select becomes 16px text. The decorative map uses a responsive 540×280 SVG viewBox. The terminal scrolls within 176px on desktop or 196px on mobile; its controls remain outside the scroll area. All text and links wrap.

Rendered reflow checks cover 320, 390, 760 and 1440 widths on all principal routes. There is no horizontal scrolling. At 760px, 200% root-text enlargement was checked on overview, support and a contract-evidence project. RTL is not a product requirement and was not rendered; most layout spacing uses logical properties.

## Elevation & depth

Surfaces are flat: tonal backgrounds and 1px structural borders, with no panel shadows or gradients. Panels use 8px radii; primary/secondary actions use 5px; badges 4px; project initials 9px; circles are reserved for the octopus disc and small status markers. The QR is black on an opaque white background with a four-module quiet zone.

The illustration caption has a solid page-colored backplate so its contrast does not depend on the SVG beneath it. Standalone project-back and support-back links are underlined. The only high stacking layer is the keyboard skip link. There are no modals, fixed banners, popovers or nested cards. Source and release details use native `details`/`summary` elements.

## Components

| Pattern | Source / reuse points | States and behavior |
| --- | --- | --- |
| Shell/navigation | `index.html`, `.sidebar`, `.main-nav`, `.topbar` | Native hash links, current-page indication, mobile header, support in navigation/footer |
| Search | `searchBox`, `search`, `directoryResults`, `.search-box` | Visible contextual help and accessible label; Enter submits, Escape clears; search persists within the session; no form submission dependency |
| Project rows | `projectRow`, `.project-row`, `.project-label`, `.row-meta` | Whole-row native links, complete wrapping names/slugs, hover/focus, stable IDs on detail pages |
| Filters/pagination | `directory`, `directoryResults`, `.segmented`, `.pagination` | Native buttons with `aria-pressed`, native select, 12 rows per page, disabled boundary buttons, live result count and clear recovery |
| Source status | `sourceStrip`, `sources`, `.source-row` | Independent recorded/live timestamps, partial coverage, no simulated status, explicit unavailable-source fallback |
| Refresh | `refresh`, `refreshProject`, `.button`, `.feedback` | Loading label, disabled repeat activation, cancellation for collection, retry and previous records; no timed browser polling |
| Crawler swarm | `CrawlerSwarm`, `.swarm-panel`, `.swarm-scene` | Seven octopus actors, highlighted route and native Follow agent select, pause/resume, device motion preference, cleanup on route changes, no polling |
| Activity terminal | `CrawlerSwarm.update`, `.terminal-feed`, `.terminal-modes` | Recorded events / Crawl log buttons with pressed states; finite user-started replay, pause/restart, project/source links, incremental request results, scroll preservation and Jump to latest |
| Activity chart | `activityDays`, `trendChart`, `.chart` | Seven UTC buckets of deduplicated returned events, visible values, a named group and screen-reader counts; no invented history or trend extrapolation |
| Project intelligence | `projectPage`, `.project-facts`, `.release-row`, `.timeline-row` | Stable ID, profile clock, public releases, sources, unknown creator/creation states and recognized chain evidence only |
| Findings | `findingHTML`, `.finding`, `.badge` | Hypothesis versus attributed observation, explanation, timestamp, project links and sources; confidence describes attribution or relationship uncertainty |
| Support | `support`, `copyAddress`, `#tip-address`, `.tip-panel` | Full read-only/selectable address, copy success message, manual selection fallback, local QR and unverified-network explanation; no transaction action |
| Export | `exportData` | Downloads JSON with source clocks, projects, findings and real log entries; no backend or credentials |

Controls generally target 42px desktop and 44px mobile; text links meet the measured 24px/spacing floor. Native focus uses a 2px `--focus` perimeter with 4px offset; search uses a 2px container outline. Hash navigation moves focus to the new page heading. The skip link focuses main content without changing the current route. Announcements use stable status regions; the focusable crawl transcript and activity terminal have named log roles with automatic announcement disabled. The separate stable status region announces state changes only; it does not repeat the same announcement for every new row. Replay is started explicitly, while decorative movement starts only when motion is permitted. Scrollback is preserved as new rows append; Jump to latest returns to the tail. Published author text is escaped before insertion.

## Motion

`src/swarm.ts` owns one requestAnimationFrame loop. It changes each actor's outer SVG translation in viewBox coordinates, so motion does not depend on CSS motion paths or desktop-only markup. Seven deterministic routes have 5.0–6.08 second legs, smoothstep travel during the first 78%, and a short scan dwell during the remainder. Offset start phases and separate hub waypoints keep Claus visible. The selected agent's route and halo are highlighted; selection does not pretend to schedule a backend worker.

`src/style.css` adds 700ms alternating body steps (±1px and ±4°) and 900ms alternating arm flexes (±4°), with alternating arms offset by 450ms. These nested transforms do not replace the outer travel transform. The 1.5s refresh spinner still represents an actual pending read. Existing button transitions remain 150ms with a 0.96 press scale.

Pause motion freezes both JavaScript travel and CSS tentacles without hiding the artwork. Reduced-motion preferences suppress all decorative motion and the request spinner; the disabled control explains “Reduced motion.” The media preference is observed at runtime. Offscreen panels and hidden documents suspend the animation/replay clocks. Mount/unmount disconnects observers/listeners and cancels scheduled work; in-session agent selection, animation position and pause preference survive navigation. No storage permission is needed.

Recorded replay starts with two actual dated events and remains paused until requested. It appends one existing record every 1.4 seconds, stops at the end, and offers Replay from start. It never creates events, changes their timestamps, fetches on a timer, or claims live monitoring. The actual crawl log appends source results when each request settles. Device motion preferences do not prevent an explicitly requested textual replay. No `transition: all` is used.

Measured motion checks and screenshots in Chromium and WebKit are recorded in [the current validation](VALIDATION.md). The preserved seven-word mission line is existing Claus branding, rather than a new marketing headline.

## Do / don't

- Reuse the semantic palette, six-size scale, row components and source-strip pattern for new Claus-native pages.
- Use one filled action for the task at hand; secondary actions remain outlined or textual.
- Keep the octopus black with cream eyes and curled arms. Do not introduce spiders, token-price graphics or fabricated network links.
- Name every data scope and observation time. Keep claims, source evidence and hypotheses distinct.
- Preserve entire addresses, IDs, source links and unknown states. A missing record never proves safety or absence.
- Keep runtime assets local and URLs relative. Add a hash route through `render`, retain keyboard focus handling, and recheck the static export and mobile reflow.
- Do not turn on wallet connections, embed credentials, or claim continuous monitoring when adding a page.
