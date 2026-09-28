---
title: 'RR-03 secure GitHub sandbox boundary'
type: 'chore'
created: '2026-09-18'
status: 'in-progress'
route: 'dispatch'
baseline_commit: '885ce136a24c3e6bfc93612461dbf6a9d95aea0f'
context: []
---

<frozen-after-approval>
## Intent

Continue Juan's explicitly authorized RR-03 only: secure App/installation/user authority, authentic durable webhook intake, restricted local persistence and defensible real sandbox proofs. Financial ceiling 200 credits (unobservable); minimize work. Stop immediately when another manual GitHub/tunnel/browser action is required, retaining progress. No broad reviews/Party Mode or repeated RR01/02 work.

## Boundaries

Sandbox organization/App classroom-rr03-juan, App4990040, client Iv23i5WlsPocsfDvGbK, installation162753561. Juan now confirms Contents READ and selected rr03-allowed, with rr03-denied unselected; initial metadata-only configuration had no repository selection. Verify rather than trust these hints. Credentials in ignored root .env and .local/rr03/app.private-key.pem; never print them, Authorization headers, OAuth codes or raw errors. Keep tokens memory-only, rely on reported expiry not string shape. Ignore URLs in provider payloads for arbitrary fetching. Require fixed api.github.com and verified account/install IDs.

No academic users/sessions/identity linkage, permissions inference, business jobs, GitHub repo writes/provisioning, production resources, broker, RLS or AD adoption. Preserve RR02. Unique disposable rr03 databases, NOLOGIN owners and separate migration/API runtime roles. Never alter classroom_dev. Proposed AD13 intake mechanisms are experimental, not adopted. App authentication does not prove user org-admin authority; OAuth/user installation verification remains separately necessary. Checkpoint report is parent-owned.

## I/O matrix

| Scenario | Expected |
| --- | --- |
| App JWT + real installation | Verify App, account durable ID/type and installation App ID before token mint; only selected repo scope/contents read |
| Allowed/unselected private README | Real allowed read and denied access; persist only sanitized IDs/status/digests |
| Valid raw webhook | Verify SHA256 constant-time before JSON parsing; bounded body; durable unique app+delivery with digest before 2xx |
| Missing/malformed/incorrect signature, bad JSON | Fail safe; no receipt/side effect; official test vector passes |
| Duplicate same delivery | Exact replay no duplicate infrastructure effect; changed bytes/event under same ID conflicts |
| Lifecycle hints | Suspend/delete invalidate capability; unsuspend/selection hints require current API verification, never academic changes |
| OAuth proof | Strong expiring single-use browser-bound state, PKCE where supported, callback code exchange/user lookup; identity known, academic linkage false |
| Failures | Sanitized codes/rate metadata, bounded retry/timeouts; no DB transaction over network; mocks labeled simulated |

</frozen-after-approval>

## Code Map

- packages/github/src/index.ts only constructs private Octokit; octokit5.0.5 already exports App/Octokit and bundled auth/webhook dependencies. Keep all actual GitHub clients here behind narrow explicit authority methods, no public generic request/token proxy.
- apps/api/src/app.ts Fastify liveness only; keep product app unchanged. Implement separate localhost:3002 proof server/routes /rr03/oauth/start, /rr03/oauth/callback, /rr03/webhooks/github; callback URL already registered, webhooks disabled until ready. No product login UX. Reject unexpected Host/Origin on local control routes; never expose token endpoints/status secrets through future tunnel.
- packages/database/rr02 and scripts/rr02-proof.mjs establish owner/migration/grants and Drizzle generated reviewed SQL path. Reuse pattern in rr03 fixture, not broad schema or repeated RR02 test suite. PostgreSQL18.6 native binaries .local/runtimes/postgresql-18.6/pgsql/bin, port54329, admin URL .local/postgres/connection.env. scripts/local-postgres.ps1 Start requires sandbox escalation; may start only for RR03, preserve data.
- Node .local/runtimes/node-v24.21.0-win-x64; prepend PATH. Existing Vitest/typecheck/build scripts. Read actual pinned SDK source as second evidence, no new versions/global tools. Database package holds infrastructure persistence; proof server can be local script using existing pg/Fastify/Drizzle.

## Tasks & Acceptance

- [ ] packages/github/src/*: controlled credential loader/App/install/user adapters, raw signature verifier, bounded state/token lifecycle; no business API. Add focused tests under tests/unit.
- [ ] scripts/rr03-provider-proof.*: FIRST verify real App/install, mint repository-limited token, inspect allowed/unselected private repos/readme. Persist sanitized per-step evidence with source/version fingerprints and IDs; preserve failures. Network sandbox escalation only for these fixed GitHub operations. Never create/modify external settings. If real authority/config fails requiring Juan, STOP immediately and report, no mock substitute.
- [ ] packages/database/rr03/* and scripts/rr03-*: tiny generated/reviewed migration and restricted fixture for install IDs, delivery digest/status; prepared statements, unique dedup, no raw sensitive payloads. Prove concurrent duplicate, mismatch, DB-down nonack, privilege negatives once. Credential paths ignored, no production KMS claim.
- [ ] Separate proof server: raw bytes HMAC before parse, exact user flow and persistent intake. Provide ready-to-run local commands and scoped webhook tunnel strategy; do NOT install/select paid/global tooling or enable webhooks. When ready for manual tunnel/browser OAuth, stop all implementation work and send parent exact minimum action. OAuth state/credential storage can be ephemeral for proof; restart fails closed.
- [ ] .env.example/package scripts/README only relevant updates. Do not edit architecture or independent reviews. Parent owns reviews/RR-03.md/evidence consolidation.

Given configured real credentials, when provider proof runs, then App/install/repo authority is API-verified and failure evidence survives. Given authentic repeated webhook, when durable transaction commits, then one intake exists and no business effect occurs; no network spans that transaction. Given absent credentials/invalid signature/expired state, then no implicit authority or secret leak occurs. Given ready local server, when further external activation is needed, then preserve checkpoint and request Juan, not more coding.

## Verification

Focused tests/integration first, then typecheck/build/existing Vitest once; Playwright only if real browser behavior requires it. Reuse passing proofs; no install if dependency graph unchanged. Pin source hashes for three-way docs/source/executable evidence. Parent handles official documentation and final report; agent returns short evidence paths, exact changes, tests and manual blockers. No commit/push. User authorization supersedes redundant skill approval/review gates; no broad review.

## Implementation Notes

2026-09-18: authenticated GET /app in provider_1789748156128_834003 confirmed App4990040/slug classroom-rr03-juan, returning public client ID Iv23li5WIsPocsfDyGbK. Original transcribed Iv23i5WlsPocsfDvGbK was incorrect. Parent corrected only that public local .env value from verified evidence, without changing App identity, keys or external configuration. This factual correction supersedes the copied client ID above, not the user's intended App or permission scope. No user action is needed for this reversible local correction; continue from evidence.

2026-09-18 checkpoint: provider_1789748288518_2e6e6a verified App/installation/account and minted read-only token scoped to one repo, but rr03-allowed ID1375855376 is public. STOP for Juan to make both proof repos private, maintaining only allowed selected. No README/denial proof, local tests/build, DB fixture, OAuth or webhook implementation completed. Preserve evidence and resume only missing work; corrected client ID is now configured.

2026-09-18 explicit narrow authorization supersedes no-repeat-OAuth only for user-token revocation experiment. Implement standalone proof scripts/tests; reuse registered callback and durable webhook listener. Acquire once, GET /user baseline200, hold exact same token memory-only, await Juan's manual personal revocation, then probe same token bounded up to60s. Evidence only status/time/non-sensitive metadata; discard on success, timeout or shutdown. No product adapter behavior change, no refresh/token persistence, no broad tests/reviews. Pause before browser authorization with exact run steps, and before manual revoke with baseline evidence ready. Collaborator/invitation and template permissions remain a later manual gate; do not change them now.

Latest explicit user authorization: Administration write approved while Contentsread/Metadataread and selected rr03-allowed remain. Controlled account coffebeltran-maker is authorized for minimal invitations/access. Live preflight pins account331091390, repository1375855376, org330894124, installation162753561. Bounded collaborator proof must clean every pending invite/grant it creates and verify effective denial before asking Juan to remove Administration. Stop at manual acceptance/template setup/permission changes. No business feature, new broad scope, RR04 or commit/push. Template flag currently false; ask Juan before altering repo configuration. Preserve existing evidence and run only missing experiments.

Template-ready resumption: Juan has marked rr03-allowed as template and added .github/workflows/rr03-marker.yml, workflow_dispatch-only echo marker. Authorized isolated template reproduction only: one private uniquely named generated repo, before/after source commit/tree and generated content equality, including marker blob digest. No Actions execution, no repo scope expansion or extra permissions automatically; stop if new generated repo selection requires user. Keep generated evidence/repo instead of unauthorized destructive cleanup; account access already removed and invitations zero. Final Administration rollback must be manual then verified. Preserve every failed/uncertain creation result; never blindly retry POST generate.
