# Claus integration report

Verified on 14 October 2026 by public HTTP reads, the official downloadable client, and inspection of this repository. No authenticated mutation, publication, contract deployment, token creation or transaction was performed.

## Existing project and deployment

The inherited app is Vite 7.3.1 + TypeScript 5.9.3, without a runtime framework or runtime dependencies. `vite.config.js` builds a classic IIFE with relative assets; `scripts/finalize.mjs` supplies the HTML and `scripts/check-export.mjs` enforces the Claus file types, manifest, metadata and size limits. These build settings, package manifest, lockfile and ignore file were preserved. The existing `claus-project/1` manifest, public connection origins, octopus artwork and `claus-crawl` publication slug remain in use. The source was refocused into a dashboard rather than replaced with a new scaffold.

The existing IdentityMD publication is `claus-crawl-explore-the-network.site.identitymd.eth`, previously `ipfs://bafybeidd6m7x2e7sssn4gyeenrzu6nfodfn7fq6ri2nq2bnoxiq7zfgapi`. This assignment delivers the next static export in `dist/`; it does not publish it.

## Verified sources

All listed GETs returned HTTP 200 unless stated otherwise. The snapshot contains actual responses, not invented demo data.

| Source | Verified content and use | Access / browser result |
| --- | --- | --- |
| [Build guide](https://claus.si/build.txt) | Registration, identity, publication, discovery, limits, SDK links | Public text |
| [Project UI documentation](https://claus.si/docs/project-uis) | Separate profile/release publication, immutable static releases, opaque-origin sandbox, allowed origins | Public HTML |
| [OpenAPI](https://claus-network-api.vercel.app/openapi.json) | Actual operation names, paths, input schemas and security declarations | Public JSON |
| [Capabilities](https://claus-network-api.vercel.app/v1/public/capabilities) | Current quotas, supported operations, workers and workflows | Public JSON; point-in-time capabilities only |
| [Project overview](https://claus.si/network.json?view=projects) | 32 project nodes plus coordinator, IDs, slugs, names, descriptions, status, profile revision and update time | No auth; browser CORS failed in a real test, official API fallback worked |
| [Full graph](https://claus-network-api.vercel.app/v1/public/graph) | Nodes, resources and explicit typed edges | No auth; browser worked. Equivalent website route: `https://claus.si/network.json` |
| [Public profile example](https://claus-network-api.vercel.app/v1/public/projects/agent-blackbox) | `projectId`, `slug`, `name`, `published`, `updatedAt`, `revision`, description, public agents, services, results, releases, signals, application and evidence | No auth; 32 raw profiles captured. Website alias: `https://claus.si/network.json?project=agent-blackbox` |
| [Activity](https://claus.si/api/network-activity) | `observedAt`, `complete`, `scanned`, events with ID, project ID, kind, time, link | No auth; 29 returned events. Browser CORS failed, so the UI retained the labeled snapshot |
| [Home inventory](https://claus.si/api/network-context) | Nine visible projects, context, public listings, interfaces, `graphComplete`, `detailsComplete`, `nextCursor`, scope and unknowns | No auth; browser worked |
| [Readable directory](https://claus.si/read/network) | Official human-readable alternative linked in the UI/docs | Documented alternative; not scraped by the crawler |
| [Official client archive](https://claus.si/downloads/claus-network.zip) | Inspected `interfaces/contract.mjs`, `interfaces/site.mjs`, public project implementation, rate admission, publishing example and documentation | Downloaded to `/tmp` for inspection; not vendored or executed as a publisher |
| `GET https://claus-network-api.vercel.app/v1/projects` | Protected owner/project listing | Explicit anonymous check returned **401**, `unauthenticated` |

Archive SHA-256: `3c323488df6ce3b317970579de95ddec5ddc25e0264df906e29e448e862f1913`.
OpenAPI response SHA-256: `b3aaa5ac7929b81bdec3ad250247a0a0ed7d5e7841fbab4ba59b8e65fe180139`.

Snapshot observations were at about **10:48 UTC**; profile reads span **10:50:09–10:50:28 UTC**. The snapshot file was assembled at **10:51:03 UTC**. Every source retains its own observation timestamp. These are inventory counts within the returned scope, not total ecosystem adoption, independent creators or active workers.

## Creation, publication and identifiers

The [build guide](https://claus.si/build.txt) states: **“The API, SDK, CLI and MCP use the same project model.”** It also states: **“No coin launch, NFT, browser wallet extension or funded wallet is required for basic project creation and static publication.”**

An owner signs an off-chain EIP-191 login challenge, exchanges it for a bearer session, checks their existing projects, and creates a private project with `POST /v1/projects` using a stable idempotency key. Public profile publication is a separate operation. A website uses a source snapshot, an immutable release with selected paths, release publication and profile publication. Existing owner/project authorization is required for these writes; the dashboard never performs them.

The [UI guide](https://claus.si/docs/project-uis) says: **“Newly published project profiles appear automatically in Home and Activity.”** It also says: **“The profile and its UI publication are separate: call project_publish as well as release_publish.”** The [build guide](https://claus.si/build.txt) says: **“The stable project ID and slug stay unchanged.”**

The app joins records on project IDs and uses slugs for hash routes. `revision` is a public-profile revision, not a semantic application version. Returned releases have content-addressed `sha256:` IDs, a release URL, creation time and optional expiry. The API does not provide a complete historical diff; withdrawn/expired releases may disappear. `updatedAt` is a publication/profile update time, not the private project creation time. The dashboard never substitutes it for creation.

## Discovery and monitoring

Graph pagination follows `nextCursor` using `after`; context uses its returned cursor the same way. This implementation caps pagination at 20 pages, deduplicates stable IDs and discloses partial results. The initial snapshot has no remaining cursors. Home context excludes internal references and held presentations, so its nine projects must not be conflated with the 32 registry records.

The [build guide](https://claus.si/build.txt) states: **“Each count states its scope and completeness; bounded public listings cannot reveal private identities or active workers.”** Its next sentence is: **“Failed or incomplete observations do not prove absence.”**

There is no verified global public subscription endpoint in this integration. `app_events` is an authenticated, scoped application event cursor, not a global launch stream. The safe supported alternative is bounded public polling, recording observation times and changes without inferring deletion from an absent/failed read.

`server/crawler.mjs` provides this alternative: an operator-run Node process with a five-minute minimum production interval, non-overlapping runs, exclusive state lock, atomic persistent state replacement, first-seen IDs, deduplicated activity, metadata differences and evidence findings. One real one-off run read **4/4** sources and persisted 29 events and 36 attributed findings/hypotheses. A short-interval automated test verifies scheduling. No always-on process is deployed or connected to the website. The static UI does one read per explicit refresh.

Claus capability data reports workers enabled but **`network: "denied"`, `persistent: false`**. Its workflows are finite recurring free-task steps with requester acceptance. Neither is treated as an autonomous internet crawler host. A separately operated Node service and durable volume are needed for continuous collection. Public polling requires no secret. Watchlists and notifications are explicitly later additions.

## Creators, relationships and external chain evidence

The public profile response and inspected `src/projects/index.mjs:138` implementation expose published project/agent information, but do not return an owner identity, owner address or original project creation time. Creator discovery across projects is therefore unavailable. Public agent names, matching descriptions and similar project names are not ownership proofs.

The graph supplies explicit source/target/relation edges. Only those edges are displayed as project relationships; shared registration with the coordinator is excluded as evidence of common control. Exact normalized name matches produce **low-confidence hypotheses**, never impersonation accusations.

Some Claus technical references return structured `evidence.reviews`, `evidence.decisions` and `evidence.deployments`. The official client implementation states: **“Evidence is written only by the trusted workflow, not profile input.”** Example: [Claus Balance Lens](https://claus-network-api.vercel.app/v1/public/projects/claus-balance-lens) includes a deployment with `verification: "verified"`, chain ID 11155111, address, transaction hash and source verification metadata. The UI shows these as **verified by the Claus evidence source**, with an explicit statement that this crawler did not independently reverify them on chain. Explorer URLs are constructed only for recognized chain IDs 1 and 11155111 and validated addresses/hashes from that evidence. No unrelated chain scanning occurs.

Published decision caveats are quoted with their completion timestamps and public source links. High confidence means confidence in attribution, not a security guarantee. Missing evidence never becomes a zero-risk score. No general malicious-activity feed, verified owner-wallet list or complete transaction-history API was verified for all Claus projects. Project-authored prose is not used to extract supposedly verified wallets/contracts.

## Limits, permissions and terms

The observed public capabilities include 25 projects per owner, 1,000 releases per project, 256 files per release, 1,000,000 UTF-8 bytes per file and 3,000,000 serialized JSON bytes per snapshot/release. The manifest supports at most eight exact public HTTPS connection origins. These are technical limits, not promised future entitlements.

The inspected client `runtime/server.mjs:132` uses a five-minute rate window for general API admission; observed policy values were 300 requests per peer and 3,000 globally, with separate authentication limits of 30 and 200. Managed app admission is separate. The OpenAPI's 429 response says **“Capacity exceeded; honor Retry-After”**. The reader honors `Retry-After` with an origin cooldown and avoids immediate retries; the operator scheduler has a five-minute minimum. Policies can change, and shared global quotas mean requests can fail below a local limit.

The inspected documentation establishes public read access and separately scoped authenticated writes. It does **not** establish an SLA or a broad content-redistribution license. No additional crawler-specific terms were verified; check current platform terms before operating a large public archive. Retain attribution, minimize load, and respect withdrawals/holds when refreshing. Descriptions remain untrusted project claims.

## Credentials and remaining limitations

- Frontend, capture script and public crawler: **no credentials or environment variables required** for public requests. The crawler requires an explicit state path (`--state` or `CLAUS_CRAWL_STATE`) outside the repository/export.
- Optional owner publication: existing authorized identity file and official client directory, using `CLAUS_NETWORK_IDENTITY_FILE` and `CLAUS_CLIENT_DIR`. These never enter the frontend. Exact commands are in the root README.
- Backend hosting, durable volume, process supervision and future notification transport are not provisioned. Native browser storage is not used because the Claus sandbox can deny it.
- Live browser reads depend on CORS and availability. The real browser observation was 3/4 sources live, with cached activity. The backend observation was 4/4 live.
- Creator attribution, complete lifetime history, website change diffs and independent security verification are unavailable or deliberately unsupported.
- Tip recipient was supplied by the requester. Receiving networks were not verified; there is no network selector, transfer request or wallet connection. The QR encodes only the exact address.
