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
