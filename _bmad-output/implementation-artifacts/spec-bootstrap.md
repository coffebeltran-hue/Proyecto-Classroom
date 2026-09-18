---
title: 'RR-01 and executable workspace bootstrap'
type: 'chore'
created: '2026-09-17'
status: 'done'
route: 'dispatch'
baseline_commit: '901cb71bbfa96f5548446764e77bb1236cd757af'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="Juan explicitly authorized RR-01 and automatic bootstrap on success in this session">

## Intent

Create a reproducible executable foundation for the approved classroom platform. Verify the dependency baseline first, then build only frontend/API/idle-worker/database/GitHub boundaries and smoke tests. Stop before business features.

## Boundaries & Constraints

Preserve modular monolith, separate API/worker, PostgreSQL and planned pg-boss, Octokit adapter and future private storage. AD-1–11 adopted; AD-12–18 proposed; R-01 unadopted; OQ-10–13 and RR-02–08 retain gates. No academic schema, migrations, queue startup, GitHub calls/resources, credentials, production infrastructure or first product slice. Preserve architecture/reviews/history and unrelated dirty files. User explicitly says proceed without another approval for this bounded work; no commit, push or staging unrelated changes.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected behavior | Error handling |
| --- | --- | --- | --- |
| Liveness | GET /health/live | 200 process-only health; no false DB/queue readiness | Unknown path 404 |
| Configuration | Invalid port/URL when relevant | Reject before listening/connecting | Name invalid field; never log secret value |
| Worker | Start idle, then stop | Runs without queue/DB/GitHub effects; closes on signal | Non-idle unsupported mode rejected |
| Database | Local development URL | Explicit connection check performs SELECT only and closes pool | Failure exits nonzero without credentials in logs |

</frozen-after-approval>

## Code Map

- Existing root README.md contains only project title; replace with runnable instructions.
- Architecture package under `_bmad-output/planning-artifacts/architecture/architecture-Proyecto-Desarrollo-2026-09-11` is authoritative; no need reread all. Review passed documentary repair only.
- `.local/rr01/registry.json`, package.json and package-lock.json contain exact verified candidate manifests. Probe uses TS6.0.3, React19.3.0, Vite8.3.0/plugin6.1.1, Fastify5.12.5, Drizzle0.45.2/Kit0.31.10, pg8.23.0/types8.23.1, pg-boss12.33.1, Octokit5.0.5, Vitest5.0.1, Playwright1.63.0, types/node24.13.5, React typings19.3.0, tsx4.23.13. Exact versions, no ranges for third-party direct dependencies.
- Project-local runtime `.local/runtimes/node-v24.21.0-win-x64` verified against official SHA256. Pin Node24.21.0 and npm11.19.0 bundled runtime; prepend runtime path in tool commands. Isolated cache `.local/npm-cache` avoids damaged global cache. Primary reviewer handles PostgreSQL portable setup/evidence outside code handoff.

## Tasks & Acceptance

- [x] Root package.json/package-lock.json/.npmrc/.node-version/tsconfig: minimal npm ESM workspaces, strict peers/engines, exact pins, portable scripts.
- [x] apps/web: React/Vite small foundation screen with truthful API liveness status; localhost dev proxy, no fake product flows.
- [x] apps/api: Fastify factory separate entry point, process-only liveness, bounded validated environment, graceful close. No unnecessary Fastify plugins.
- [x] apps/worker: idle executable and single smoke exit flag, signal cleanup; no pg-boss.start or jobs.
- [x] packages/database: pg Pool + Drizzle wrapper, bounded connection config; explicit read-only check command, no connect on import.
- [x] packages/github: internal narrow compilation boundary using Octokit; construction/import causes no provider calls or required credentials. No proxy routes.
- [x] packages/shared only if real shared config/health contract usage; omit empty domain package until domain work exists.
- [x] .env.example/.gitignore/compose.yaml/README: no secrets; ignore caches/env/builds; PostgreSQL18.6 loopback-only Compose, persistent local volume and configurable password required from env; document starts/stops and no destructive commands by default.
- [x] Vitest/config/tests: API liveness/404, config rejection and idle worker behavior; shared imports exercised. Playwright config starts minimal dev harness and tests actual rendered page/API status. Use package browser, no provider credentials.
- [x] Install/typecheck/build/test/run checks and report exact failures. No new dependency comparisons or broad reviews.

Acceptance: Given pinned runtime and clean checkout, npm ci installs without engine/peer suppression; typecheck and build succeed. Given no provider credentials, API and idle worker start independently and health is truthful. Given local PostgreSQL, explicit database check connects and closes without DDL. Given browser installed, Playwright starts the dev harness and smoke passes. Invalid config fails safely. Missing local prerequisites must be recorded honestly, never treated as completed proof.

## Implementation Notes

Existing working tree contains approved documentary work and two unrelated deleted brainstorming assets; preserve all. No clean-tree or plan reapproval pause: Juan explicitly authorized continued bounded work. No new irreversible provider operations. RR-01 probe audit exposes four moderate reports in Drizzle Kit's deprecated esbuild-kit → esbuild0.18 chain; development-only tooling, no esbuild serve/Studio command allowed. Preserve advisory evidence and do not run audit fix --force or silently override package internals. Final production dependency audit must be separate.

## Verification

Use npm ci, npm run typecheck, npm run build, npm test, npm run test:e2e, explicit API/worker executable proof and npm run db:check. Keep test configuration outside business packages as appropriate. Package imports must work from emitted Node ESM output, not only TypeScript path aliases. No academic migrations or RR-02 queue proof.

## Spec Change Log

## Review Triage Log


### Completed proof and focused review

RR-01 and native executable bootstrap passed; details in architecture reviews/IMPLEMENTATION-PREPARATION.md. User resource constraint overrode broad review layers: primary agent inspected source and acceptance evidence; no repeated architecture review. Fixed actual .env loading/Drizzle execution and private-package version metadata for SBOM; all relevant checks passed. Docker execution remains explicitly unverified; native PostgreSQL provides local connection proof. No unrelated changes staged/committed. API/worker/browser test processes and local PostgreSQL proof server stopped.
