# Claus Crawl monitor

A separate, read-only Node process for public Claus observations. It is not included in `dist/` and is not running continuously on behalf of site visitors.

Use Node 24.14 or newer within Node 24. No npm dependency or private credential is needed at runtime. From the repository root:

```sh
export CLAUS_CRAWL_STATE=/var/lib/claus-crawl/state.json
node --experimental-strip-types server/crawler.mjs --once
```

Create the parent directory with permissions for the service account first. Keep state outside the repository, static export and public web root. `--state /absolute/path/state.json` overrides the environment variable.

To run sequentially every five minutes until SIGINT/SIGTERM:

```sh
node --experimental-strip-types server/crawler.mjs --interval-ms 300000
```

Alternatively, configure an operator-owned scheduler to run the `--once` command every five minutes. Use an absolute Node executable and repository working directory in that scheduler. Do not run both the loop and cron against the same file. No scheduler was installed in this assignment.

The state is `claus-crawl-monitor/1` JSON. It contains the latest normalized dataset and per-source observation clocks, first-seen times, up to 10,000 deduplicated events, up to 10,000 attributed findings, run counts and the last run log. Metadata findings retain changed field names and before/after values. First-seen means first seen by this file's history, not creation. The first successful run establishes the baseline. There is no inferred deletion or private identity matching.

A successful collection writes a `.next` file beside the external state file, then atomically renames it. A `.lock` file prevents overlapping collectors. A crash may leave a stale lock; confirm no process is using the state before removing it. A malformed existing state fails closed and is not overwritten. Preserve/back up the file if you need older history; this is a single-operator store, not a multi-tenant database.

Every source failure is kept separate. Previously observed records are retained as cached, with their original clocks; unavailable data is never counted as a verified absence. Profiles are read sequentially, capped at 100 per run. Graph/context pagination is capped at 20 pages each. Public requests omit credentials, reject redirects and undeclared origins, time out after 15 seconds, bound response bytes and honor rate-limit cooldowns. Scheduling adds no parallel collection runs. Retention limits and partial coverage are explicit; there is no recovery guarantee for events missed between polls.

To refresh the **bundled frontend snapshot**, use the separate explicit capture operation, review its result and rebuild:

```sh
node --experimental-strip-types scripts/capture-snapshot.mjs --out src/data/snapshot.json
npm run typecheck
npm test
npm run build
```

The capture operation requires complete top-level public feeds and validates each raw profile. Missing individual profiles are recorded in `profileErrors`; the UI has an unavailable-profile state. A top-level failure leaves the existing snapshot unchanged. Capturing a new observation can change test fixture counts, so update any snapshot-specific count assertions only after checking actual returned data. Do not mix test fixtures with this production snapshot.

The website does not fetch the private monitor state. Connecting a shared backend later requires an intentionally public, sanitized read API, verified CORS, updated manifest allowlist, deployment and a clear freshness policy. Keep credentials and state private. Never label the static export continuously monitored merely because this program exists.

Tests:

```sh
node --experimental-strip-types --test tests/crawler.test.mjs
```

These cover persistent restart, deduplication, changed metadata, failure retention, corrupt-state refusal, locking, cancellation and a real 10ms test schedule. The production CLI rejects intervals below five minutes; the test schedule calls the exported scheduler directly with fixtures, making no rapid network requests.
