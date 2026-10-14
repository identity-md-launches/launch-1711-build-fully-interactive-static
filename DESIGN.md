# Claus Crawl design system

## Overview

Claus Crawl is a compact public project scanner for people exploring Claus Network. A dark terminal, lime connections, numbered sections, and a black ink octopus carry the interface. The main action comes before the graph; the graph and streaming transcript share one desktop workspace. The octopus is the active crawler, with eight articulated SVG arms, an asymmetric head, and cream eyes. Source: `src/mascot.ts`.

This is a single-page tool, not a token scanner or wallet application. Density and monospace data take their cue from CrawlScan; the character comes from Claus. The finished source is `index.html`, `src/main.ts`, `src/style.css`, `src/data.ts`, and `src/types.ts`.

## Colors

Canonical tokens are defined in `src/style.css:1`.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0b100e` | Page, terminal, and reading background |
| `--surface` | `#101813` | Input, map, node-label backplates |
| `--surface-hover` | `#17241b` | Selected mode and selected project row |
| `--text` | `#ecf1e9` | Main text and headings |
| `--muted` | `#a2b0a4` | Descriptions, timestamps, source labels |
| `--faint` | `#859388` | Section numbers, placeholders, row numbers |
| `--line` | `#2b3a2f` | Structural dividers and grid dots |
| `--accent` | `#c2f970` | Primary crawl button, visited nodes, current edges |
| `--ink` | `#000` | Character primitive; SVG paths use the same literal black |
| `--cream` | `#fff2d8` | Character eye primitive; SVG paths use the same literal cream |
| `--warning` | `#eec182` | Source fallback and partial-data messages |
| `--error` | `#ffb4a8` | Inline recoverable input errors |
| `--focus` | `#dbffa7` | Two-pixel keyboard outline |

The primary action and visited nodes use dark `#10170d` text. The map's stationary green disc is `#b6eb6b`, surrounded by `#293c1d` and `#3d522b` rings. Waiting connections are `#3b503c`, visited connections `#7aa547`, and recorded service edges `#7b8b77`. Color is accompanied by “visited”/checkmarks, text labels, progress values, and log entries. The coordinator label has a solid surface backplate so its text cannot overlap the bright disc.

There is one intentional dark theme. Rendered contrast evidence and limitations belong to `artifacts/validation.md`.

## Typography

Two stacks are used; no remote font is loaded:

- Prose/headings: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Inter is a local-if-present preference; system fallback is expected and no bundled Inter font is claimed.
- Terminal/data: `ui-monospace, SFMono-Regular, 'Cascadia Code', 'Segoe UI Mono', monospace`.

The six-size scale is 12, 14, 16, 20, 32, and 48 CSS pixels at the normal 16px root. Tokens are `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, and `--text-display`. Weights are 400 and 600. The title is 48px on desktop and 32px at 760px and below. Body is 14px with 1.5 line-height; descriptions use 1.65. Terminal data is 12px with 1.5–1.65 line-height. Input text becomes 16px at 760px and below to avoid mobile input zoom.

Title tracking is -0.045em at 48px and -0.035em at 32px; other text has natural tracking. Long slugs and descriptions wrap instead of truncating. Detail descriptions have a 68ch maximum; method text has a 46ch measure. Fixed-width monospace digits keep counters stable. Useful text remains selectable.

## Layout

`main` and the footer have a 1296px maximum outer width and 48px inline padding. The header has a 1440px maximum width. Spacing primarily uses 4, 8, 12, 16, 20, 24, 28, 32, 40, and 48px. Related controls use small gaps; numbered sections use wider vertical separation and thin structural dividers.

- Above 1080px: the workspace uses a 1.8:1 map/log grid. Results use a 1:1.1 list/detail grid. The map is 362px high.
- At 1080px and below: horizontal padding is 32px; workspace ratio becomes 1.5:1; the nonessential introductory note disappears.
- At 760px and below: padding is 20px; map and log stack, as do list and detail. The map is 340px high and log is 220px high. Method columns become rows. The navigation keeps the Claus Network destination.
- At 420px and below: padding is 16px; header is 64px; the title breaks onto two lines. The shortcut strip keeps one project shortcut and Run demo, while all projects remain in the directory. Source text is compact. The crawler is 88px rather than 102px.
- Above 1500px: introductory spacing expands to 60px/48px. This breakpoint was source-reviewed; rendered checks covered up to 1440px.

The graph uses percentage positions with six visible project nodes, a coordinator at 50%/47%, and actual graph edges. Each node is a button with a complete wrapping slug. The log scrolls independently and exposes a Follow toggle. No fixed overlay covers controls. Reflow was measured at 320, 390, 760, and 1440px; native device/zoom limits are in validation.

## Elevation & depth

The interface is flat. No box shadows or gradients are used for panels or text. Background tones and 1px borders establish hierarchy. The node map uses a radial-dot CSS background. The green disc and dashed circle frame the black character without turning its body green.

Map layering is local: connection SVG, central disc, node buttons, and the pointer-transparent octopus. The skip link appears above the header only when focused.

## Shapes

Inputs and the primary action use 5px radii; workspace edges use 6px; outlined secondary actions use 4px. Small node cores are 28px squares with 5px radii. The brand tile uses a 7px radius in the header. Circles are reserved for the coordinator and character treatments. Ordinary project results are divided rows, not nested cards.

## Components

| Pattern | Source | States and behavior |
| --- | --- | --- |
| Scanner input + crawl | `index.html`, `src/main.ts:startCrawl`, `.search-input`, `.primary` | Visible label, Enter submission without a form, inline error, Escape clears search, disabled while reading, Stop remains available |
| Source selector | `setMode`, `.mode-controls` | Native toggle buttons with `aria-pressed`; live selection does not silently refresh until a crawl |
| Octopus + map | `src/mascot.ts`, `renderMap`, `move`, `.crawler`, `.map-node` | Visits only recorded coordinator edges; checkmarked visited nodes; recorded service edges are dashed; missing edges produce an inspection log without an invented walk |
| Scan transcript | `addLog`, `.log` | Appended real steps, timestamps, warning text, keyboard-scrollable log, Follow control, copy/select fallback |
| Project directory | `renderList`, `.project-row`, `.result-tabs` | Featured/all/scanned, search filtering, selected row, empty state with recovery, keyboard focus preserved during row updates |
| Project detail | `renderDetail`, `.signal-box`, `.evidence-grid` | Name, slug, status, public description, canonical links, source-attributed counts, events, recency verdict, unknown fields, repeat crawl |
| Source disclosure | `renderSources`, `.source-details` | Native details/summary, source table, cached/live dates and completeness, links to public references |
| JSON report | Export handler in `src/main.ts` | Disabled until a completed result exists; includes source clocks, requested mode, results, events, and transcript |

Controls use native buttons and links. Most text actions are 36–44px high; every measured target meets the 24px-or-spacing rule. Keyboard outlines are 2px with 4px offset; the input wrapper has a 2px outline with 2px offset. Mobile project selection moves focus to the detail heading. The completed-scan status announces a concise result; the whole detail pane is not a live region.

## Motion

Outbound travel takes 850ms; return travel takes 600ms, using `cubic-bezier(.4,0,.2,1)`. Every movement has a corresponding `walk` or `return` log entry. Arms and head move only during those trips, using a 320ms alternating cycle. Idle Claus is still. Stop cancels the animation and fetch controller. Changing to reduced motion finishes the current trip; subsequent visits use instantaneous position changes with the same textual steps. The reduced-motion stylesheet disables transitions and keyframes. Button press scale is 0.96 otherwise.

## Do / don't

- Reuse the six-size scale, semantic colors, section-heading alignment, and plain rows.
- Keep the sole filled action focused on crawling; use text or outlined controls for secondary actions.
- Keep Claus black with cream eyes and rounded curling arms. Do not substitute a spider or generic network icon.
- Keep graph movement tied to evidence-bearing scan steps. Never animate invented activity, balances, or network connections.
- Preserve complete names and slugs, source timestamps, cache labels, and missing-data states.
- If adding a local page, reuse the header, width/padding rules, and type tokens; keep links relative and export the page explicitly. Recheck the static-host file/origin limits.
