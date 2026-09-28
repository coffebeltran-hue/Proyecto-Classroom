# Implementation preparation — executable baseline

2026-09-17. Juan authorized RR-01 and automatic initial bootstrap on success. **RR-01: PASS. Bootstrap: PASS using native local PostgreSQL. Docker/Compose execution: NOT VERIFIED on this machine.** No business feature has been started.

## RR-01

Pinned Node **24.21.0**, npm **11.19.0**, PostgreSQL **18** (native18.6). TypeScript6.0.3, React/DOM19.3.0, Vite8.3.0/plugin6.1.1, Fastify5.12.5, Drizzle ORM0.45.2/Kit0.31.10, pg8.23.0, pg-boss12.33.1, Octokit5.0.5, Vitest5.0.1, Playwright1.63.0. Exact typings/support packages, compatibility constraints, primary sources and licenses are in [RR-01.md](RR-01.md).

The root lockfile freezes the workspace graph. SHA256: `e7f8f02867ad56f38bb4ab20c7443faf0c45c3473cccef4acb267ceaba16c15b`. [CycloneDX SBOM](rr01-evidence/workspace-sbom.json) contains183 components for the installed platform. [Runtime online audit](rr01-evidence/runtime-audit.json): zero reported vulnerabilities. [Full online audit](rr01-evidence/workspace-audit.json): four moderate reports, all from the development-only Drizzle Kit/esbuild chain; no high/critical reports. This is point-in-time registry evidence, not an absence-of-vulnerabilities guarantee. No forced downgrade or override was used.

## Bootstrap proof

| Check | Result | Evidence |
| --- | --- | --- |
| Reproducible install | PASS | Strict `npm ci --offline` under pinned Node/npm, scripts enabled,207 packages; no engine/peer suppression. Offline audit output is not advisory evidence. |
| Typecheck | PASS | [log](rr01-evidence/typecheck.log); server/shared and web configurations. skipLibCheck is enabled; this checks consumed application interfaces, not every third-party declaration. |
| Build | PASS | [log](rr01-evidence/build.log); emitted Node ESM and Vite production bundle. |
| API startup | PASS | [compiled API HTTP proof](rr01-evidence/api-emitted.log); actual GET /health/live, process-only response. |
| Worker startup | PASS | [log](rr01-evidence/worker.log); emitted executable in idle smoke mode, no DB/queue/GitHub work. Timer cleanup is also unit-tested. |
| PostgreSQL connection | PASS | Native PostgreSQL18.6, loopback54329, development database; [Drizzle SELECT proof](rr01-evidence/database.log), pool closed. Refused connection additionally exited1 with sanitized message and no password output. No academic DDL or migrations. |
| Vitest | PASS —3/3 | [log](rr01-evidence/unit.log): health/404, configuration rejection, idle cleanup. |
| Playwright | PASS —2/2 | [log](rr01-evidence/e2e-installed.log): actual React/API liveness and unavailable API state using package Chromium. |
| GitHub boundary | Compilation/construction PASS only | Emitted @classroom/github import and factory construction succeeded. No provider call or credentials; RR-03 stays open. |
| Docker/Compose | CONFIGURED; NOT EXECUTED | compose.yaml selects PostgreSQL18.6, loopback port, required local password and persistent volume. Docker/WSL absent; no system installation or license acceptance. Verify on a Docker-enabled host before relying on this path. |

Recovered setup failures: the initial global npm cache/network access failed; isolated project cache and authorized network access resolved installation. A build attempted before installation finished saw missing declarations; the post-install build passed without a dependency workaround. npm SBOM initially rejected unversioned private workspaces; all are now0.0.0. Browser binaries were initially missing; the authorized pinned download and subsequent test run passed. Windows restricted-token launch/cleanup required scoped unsandboxed process operations. Color-environment warnings and optional missing .env notices are retained in logs; they did not affect the assertions. No warning was treated as a passing test.

## Files created or updated

```text
package.json, package-lock.json, .npmrc, .node-version
tsconfig.json, vitest.config.ts, playwright.config.ts
.gitignore, .env.example, compose.yaml, README.md
apps/
  web/       React/Vite foundation screen and API-status check
  api/       Fastify factory + separate executable
  worker/    Idle lifecycle + separate executable
packages/
  shared/    Used configuration and liveness contracts
  database/  pg/Drizzle construction and explicit SELECT check
  github/    Private Octokit construction boundary
scripts/     Build and local PostgreSQL start/stop/status helper
tests/       Vitest and Playwright smoke coverage
```

No empty domain package or generic utility collection. No lint/format dependency was added for this small baseline. Root README contains install/start/stop instructions, exact local runtime PATH and browser-cache environment commands. Copy .env.example and fill only local development values. No secrets are committed.

Native binaries, browser files, npm cache and development database live under ignored .local. The PostgreSQL proof server was stopped after verification; its data remains. API/worker/browser test processes were stopped. Existing Anti-Consensus/repair evidence and unrelated working-tree changes were preserved; no commit or push was made.

## Architecture deviations

**NONE in application architecture.** Native PostgreSQL was used as an environment-specific local proof because Docker is absent; Compose support is provided but not claimed tested. No Redis, broker, microservice, distributed transaction, authoritative evaluator or provider call inside a database transaction was introduced.

Only focused source/acceptance checks were performed; no broad multi-agent review or renewed architecture review. A local refusal to start PostgreSQL inside the sandbox is not a statement about production restricted-role behavior.

## Remaining gates and next slice

- RR-02: actual PostgreSQL/pg-boss roles, schema ownership, queue lifecycle/migrations/recovery. pg-boss is installed but not started.
- RR-03: GitHub App/OAuth/installations, permission and provider proofs. No integration resources exist from this bootstrap.
- RR-04: temporal eligibility and receipt/clock/policy experiments; R-01 remains unadopted.
- RR-05: storage provider and recoverable-copy purge/journal/restore proof.
- RR-06: archive parsing, quotas, capture and recovery proof.
- RR-07: container/hosting, independent alerts, load and restore objectives; Docker execution remains outstanding locally.
- RR-08: Future only. OQ-10–13 remain open; OQ-12 gates unresolved historical access. AD-12–18 remain PROPOSED.

**Recommended first vertical slice:** GitHub sign-in → current-user/session read → signed-in frontend → logout, with an explicit “academic identity not linked” state and no academic authorization inferred from GitHub membership. First authorize the narrow RR-03 sandbox/auth work and disposition the applicable proposed session/identity contracts; do not implement around missing provider authority. Full roster/linking/submissions remain later slices.

**STOP:** executable foundation is complete within this scope. No first substantial business feature, cloud resource, academic migration or queue/provider integration is authorized by this report.

## Current infrastructure gate — 2026-09-18

Juan subsequently authorized bounded RR-02 infrastructure implementation and disposable local experiments. [RR-02 PASS](RR-02.md) supersedes the earlier pending queue-baseline bullet: PostgreSQL 18.6/pg-boss 12.33.1 schema 42 passed restricted-role, migration/replay/rollback, queue maintenance/lifecycle/crash/retry and same-cluster logical restore checks. Typecheck/build and Vitest 6/6 passed; frontend/API behavior was unchanged and Playwright was deliberately not repeated. Dependency graph unchanged; no repeat RR-01 installation.

This does not wire business jobs into the idle worker or adopt AD-12–18. Separate owner credentials and explicit maintenance execution were proved, not a hosting scheduler. Real upgrade, production/PITR, load, provider and ACR proofs remain pending. RR-03–07/OQ-10–13 open, RR-08 Future, R-01 unadopted. Next recommended gate is separately authorized RR-03; no business feature or provider resource was started.

### RR-03 checkpoint — 2026-09-18
FACT: [RR-03](RR-03.md) records real App/install/private scope, browser OAuth, live ping/dedup and suspension/reactivation/personal-revocation receipts plus local restricted persistence/tests. Status PARTIAL: old-token negative/race and broader template/collaborator integration remain unproved. No ACR operational closure, AD adoption or business implementation authorization follows. Earlier pending-provider statements are historical; use the report's final bounded result. No RR04+ started.


### RR-03 token-negative checkpoint — 2026-09-18
FACT: same installation token observed200 before revocation, DELETE204, transient200 after, then401 about4.55s later in the bounded run. Immediate rejection failed and remains recorded. [RR-03 report](RR-03.md) retains both runs and reproducible script. Status PARTIAL: old user token unavailable; acquiring a new one requires an explicit exception to the current no-repeat-OAuth instruction and a memory-only probe before manual revocation. Broader ACR002/AD17 provider proofs remain unexecuted. No automatic downstream gate or implementation authorization.

### RR-03 user-token probe ready — 2026-09-18
Juan authorized the limited new OAuth acquisition exception. Isolated static-token probe prepared;6 new simulated tests, typecheck and launcher syntax passed. Real test awaits browser acquisition and then a separate manual revocation checkpoint. No permission changes required for this step. [RR-03](RR-03.md) contains exact run instructions and15min hold/60sec observation bounds. RR-03 remains PARTIAL, no downstream authorization.

### RR-03 same-user-token rejection proved — 2026-09-18
Real baseline200 then provider401 on the same memory-only user token after manual revocation is recorded in [RR-03](RR-03.md). Process exited and dropped token;240ms measures request observation, not revocation propagation. No further OAuth required. Whole gate PARTIAL: collaborators/invitations and template reproduction await scoped Administration-write permission and controlled test resources. No AD adoption or RR04 authorization.

### RR-03 invitations — pending manual acceptance
Real read-invitation create/list/cancel and final noaccess passed; one new controlled read invitation333732138 now awaits coffebeltran-maker acceptance for effective-access removal proof. [RR-03](RR-03.md) records evidence and cleanup obligation. Template flag remainsfalse; no template resources generated. Keep Administrationwrite until tests/cleanup finish, then request user rollback and verify. RR03 PARTIAL.

### RR-03 collaborator cleanup verified
Live accepted readpermission verified; collaborator removal204 followed by404/permissionnone and zero pending invitations for coffebeltran-maker. Evidence in [RR-03](RR-03.md). Basic invite/grant/removal proof complete, no claim of full late-effect/crash protocol proof. Template setup remains manual prerequisite; Administration rollback follows remaining template work. RR03 PARTIAL.

### RR-03 template checkpoint
Source template/marker validated; one private generation attempt returned422 for rr03-generated-1789779803890. No destination ID or content-equivalence proof. [RR-03](RR-03.md) preserves initial whitespace precheck and provider failure. Waiting for owner verification of exact target existence before any further create attempt; no automatic permission expansion. RR03 PARTIAL.

### RR-03 existing target recovery
Juan confirms generated target exists; fresh selected-scope token lists only source and cannot read target404. Waiting for addition of only rr03-generated-1789779803890 to selected repositories; no extra permission level or new creation. Resume read-only comparison against saved source manifest. RR03 PARTIAL.

### RR-03 target selected but reproduction unproved
Target1376587196 is visible/private but commit read409 prevents comparison. Additional diagnostic generation was rejected by automatic approval review as outside the single-generation authorization; no second request ran. RR03 PARTIAL pending explicit diagnostic scope or ending with permission rollback. See [RR-03](RR-03.md).

### RR-03 diagnostic01 failed — stopped
Exactly one explicitly authorized extra generate returned422: cloning credential lacks permission to view clone repository. Sanitized status/message/errors and source IDs are in [RR-03](RR-03.md) / rr03-evidence/template-diagnostic-01.json. No target comparison, retry, permission expansion or third creation. Scope/token-restriction diagnosis remains unproved; RR03 PARTIAL. Manual Administration rollback and effective verification remain pending; no next gate authorized.

### RR03 final user-token attempt: still PARTIAL

The single authorized generation for rr03-user-template-final-01 returned201 (private ID1376607049), but immediate commit reads returned409 "Git Repository is empty." No delayed readiness polling or tree/workflow comparison completed; permanent emptiness is not established. Evidence: [template-user-final-01.json](rr03-evidence/template-user-final-01.json); interpretation/inventory: [RR-03.md](RR-03.md), final authorized user-token checkpoint. User token discarded; no retry/new OAuth, permission expansion, repository selection change, deletion or workflow dispatch. Original target1376587196 remains observed empty; diagnostic target existence is unresolved by credential-scoped404. Preserve original422 evidence. Template reproduction and final cleanup/permission rollback remain incomplete; no whole-gate PASS, AD17 adoption, ACR002 operational closure or RR04 authorization.

### RR03 delayed template content verification PASS

[Provider readback](rr03-evidence/template-user-final-readback.json) verifies final target commit/tree, complete manifest and marker SHA256 equal to the retained source snapshot. Prior user-token201 followed by transient409 is now a successful bounded reproduction proof. No new generation/OAuth or repository changes. Read-only installation token revoked204. Overall RR03 still PARTIAL pending target cleanup, diagnostic-target owner inventory and manual Administration rollback/effective verification; this does not prove installation-token generation or close ACR002 operationally. See latest RR-03 checkpoint.

### RR03 owner cleanup and permission rollback completed

Owner reports all three test targets deleted. [Fresh full-default-token verification](rr03-evidence/permission-rollback-final.json) proves only Contentsread/Metadataread, exactly rr03-allowed selected, allowed200/denied404, administrative invitation read403 and token revoke204. No remaining owner cleanup/permission action. This checkpoint PASS does not establish installation-token template generation or delayed-grant/crash recovery; architecture-wide RR03 remains PARTIAL with those explicit technical evidence limits. Delegated user-token reproduction remains PASS. Stop; no RR04 or implementation authorization.
