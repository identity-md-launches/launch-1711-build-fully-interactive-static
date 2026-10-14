# Claus Crawl design system

## Overview

Claus Crawl is an evidence-led discovery dashboard for the Claus ecosystem. Its visual identity is the black Claus octopus against a restrained ice-blue network diagram, surrounded by a dark, quiet research workspace. The dashboard prioritizes searchable public records, dated coverage and traceable sources. It does not use a market terminal's price, token or trading cues.

The source of truth is `src/style.css`, route renderers in `src/main.ts`, `src/mascot.ts`, and the local SVGs in `public/`. The inherited Vite/TypeScript stack, static IIFE export and Claus manifest remain unchanged structurally. There is one intentional dark theme.

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

The artwork's network is explicitly described as an illustration in its accessible name; it is not a fabricated relationship graph. State is always also written in text: Recorded, Live read, Hypothesis, or Published evidence. Contrast measurements and coverage limits belong to the validation report.

## Typography

Two local/system font stacks, with no remote font or bundled font dependency:

- `--sans`: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for prose and controls. Inter is a local-if-present preference, not a claimed loaded asset.
- `--mono`: `ui-monospace, SFMono-Regular, Consolas, monospace` for IDs, slugs, addresses and short log lines.

The six-size scale at the normal 16px root is **12, 14, 16, 20, 28 and 40px** (`--xs`, `--sm`, `--base`, `--lg`, `--xl`, `--display`). Requested weights are 400 and 600. Body/UI text is 14px with unitless 1.5 line height; longer descriptions use 1.7–1.75. Section headings in panels are 16px, page titles 28px, and the overview mission 40px on large screens. At mobile widths the mission becomes 28px. Dense source metadata is 12px. Inputs and the address field are 16px on mobile.

Display tracking is -0.045em; page titles -0.03em; 20px section headings -0.02em. Body and data use natural spacing. Prose measures are generally 48–75ch. Complete IDs and the full tip address wrap without ellipsis. Metrics and chart counts use tabular numerals. Critical content remains selectable. Text enlargement is tested separately from native browser zoom.

## Layout

The desktop shell is a 224px navigation column plus a fluid content column; main content has a 1440px maximum width and 40px horizontal padding. The top bar is at least 76px. The main page is padded 36px at the top and 64px below. Spacing uses mostly 4, 8, 12, 16, 20, 24, 28, 32, 36 and 40px.

The overview has a compact introduction/character grid, a full-width search action, a source strip, four scoped metrics, a two-column launch/update and activity/evidence workspace, then project discovery. The main search action is visible on the first 390px screen. Dedicated project pages share the same shell and use side-by-side release and timeline panels followed by evidence sections.

Implemented breakpoints:

- **Above 1700px:** sidebar grows to 248px. This breakpoint was source-reviewed, not rendered during the measured viewport suite.
- **At 1200px and below:** sidebar becomes 200px, outer padding 28px, panels become denser, and secondary row detail is reduced. Full records remain available on project pages.
- **At 960px and below:** sidebar becomes a top navigation header; its support link moves into the top utility position. Navigation wraps; no sticky overlay covers content.
- **At 700px and below:** 20px outer padding, stacked search input/action, two-column metrics, one-column content panels and a 28px mission heading. The decorative network illustration is removed; the octopus remains in the brand. Overview, directory and activity stay in the top navigation; agents and source pages remain reachable through the footer and contextual links. The support page stacks its explanation above the wallet panel.
- **At 360px and below:** outer padding becomes 16px, decorative row initials are omitted where space is tight, and the QR explanation stacks. Names, IDs and the recipient address are not clipped.

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
| Activity chart | `activityDays`, `trendChart`, `.chart` | Seven UTC buckets of deduplicated returned events, visible values, a named group and screen-reader counts; no invented history or trend extrapolation |
| Project intelligence | `projectPage`, `.project-facts`, `.release-row`, `.timeline-row` | Stable ID, profile clock, public releases, sources, unknown creator/creation states and recognized chain evidence only |
| Findings | `findingHTML`, `.finding`, `.badge` | Hypothesis versus attributed observation, explanation, timestamp, project links and sources; confidence describes attribution or relationship uncertainty |
| Support | `support`, `copyAddress`, `#tip-address`, `.tip-panel` | Full read-only/selectable address, copy success message, manual selection fallback, local QR and unverified-network explanation; no transaction action |
| Export | `exportData` | Downloads JSON with source clocks, projects, findings and real log entries; no backend or credentials |

Controls generally target 42px desktop and 44px mobile; text links meet the measured 24px/spacing floor. Native focus uses a 2px `--focus` perimeter with 4px offset; search uses a 2px container outline. Hash navigation moves focus to the new page heading. The skip link focuses main content without changing the current route. Announcements use stable status regions; the focusable crawl transcript has a named log role without automatic live replay. Published author text is escaped before insertion.

## Motion

There is no autoplay illustration or simulated crawler activity. Buttons have 150ms background/color/transform transitions and a 0.96 press scale. During actual pending requests, the refresh icon rotates with a 1.5s cycle. All motion is inside `prefers-reduced-motion: no-preference`; reduced-motion requests retain the static loading label without spinning. No `transition: all` is used.

## Do / don't

- Reuse the semantic palette, six-size scale, row components and source-strip pattern for new Claus-native pages.
- Use one filled action for the task at hand; secondary actions remain outlined or textual.
- Keep the octopus black with cream eyes and curled arms. Do not introduce spiders, token-price graphics or fabricated network links.
- Name every data scope and observation time. Keep claims, source evidence and hypotheses distinct.
- Preserve entire addresses, IDs, source links and unknown states. A missing record never proves safety or absence.
- Keep runtime assets local and URLs relative. Add a hash route through `render`, retain keyboard focus handling, and recheck the static export and mobile reflow.
- Do not turn on wallet connections, embed credentials, or claim continuous monitoring when adding a page.
