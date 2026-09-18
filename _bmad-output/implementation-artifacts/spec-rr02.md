---
title: 'RR-02 PostgreSQL and pg-boss operational proof'
type: 'chore'
created: '2026-09-18'
status: 'completed'
route: 'dispatch'
baseline_commit: 'd6b6fff26eb3cd21352255bee5d72b023371f946'
context: []
---

<frozen-after-approval>
## Intent

Prove the pinned PostgreSQL/Drizzle/pg-boss operational baseline with disposable infrastructure objects, restricted roles, migrations, queue lifecycle/failure and logical restore. Juan explicitly authorizes infrastructure implementation and local experiments, not business features or RR-03. Use existing runtime, no dependency upgrades, Docker/WSL installation or broad review. Stop at a genuine decision blocker. AD-12–18 remain proposed, including future RLS/outbox; no adoption by this proof.

## Boundaries

Never alter/drop classroom_dev, existing credentials or global PUBLIC privileges of existing databases. Create only uniquely named rr02_* disposable databases/roles, track exact owned names; preserve evidence on failures, avoid destructive cleanup by default. Bind local loopback, no provider calls, never log passwords/URLs/raw credential errors. Use environment credentials and sanitize subprocess output. Runtime NO SUPERUSER/CREATEDB/CREATEROLE/REPLICATION/BYPASSRLS; not owners or owner members. Queue maintenance may require a separately scoped privileged profile; normal worker never receives ownership to hide that fact. No academic tables, jobs or transactions across provider I/O.

## Acceptance

Given isolated proof databases, admin provisions no-login object owners and separate migration/API/worker login roles. Runtime allowed DML succeeds, forbidden DDL/role/database/owner SET ROLE fails; catalog assertions prove exact owner/default/public/search_path boundaries. Given checked-in tiny schema and Drizzle generate→reviewed SQL→migrate, first run and replay work, failed transactional migration leaves no partial object/journal advancement; no startup migrations or automatic down. Given pre-provisioned pg-boss, restricted worker starts with migrate:false, supervise:false, schedule:false; enqueue/work/complete, failure/retry, duplicate assumptions, stop/restart and timeout/crash redelivery are tested. An administrative queue profile precreates queues and explicitly runs maintenance; measure actual privileges, never pretend disabled maintenance is a complete operating model. Given missing/version-mismatched schema, connected infrastructure fails closed without migrating. Given invalid credentials/unreachable endpoint, errors are sanitized and connections close. Given logical backup to a file, restore into a separate disposable database preserves proof state, migration journal, queue state and ownership/ACLs; restart queue safely with synthetic payloads. This proves logical restore only, no PITR/provider/RPO/RTO. Existing typecheck/build/Vitest stay passing; Playwright may be skipped because no frontend/API behavior changes. Dependency graph unchanged means do not rerun RR-01 installation needlessly.
</frozen-after-approval>

## Code map / facts already investigated

- package-lock pinned Node24.21.0/npm11.19.0, pg8.23.0, Drizzle ORM0.45.2/Kit0.31.10, pg-boss12.33.1 **schema42** (not historical candidate41). Do not change dependency versions. Actual local node path `.local/runtimes/node-v24.21.0-win-x64`; prepend PATH. npm cache .local/npm-cache.
- PostgreSQL18.6 binaries `.local/runtimes/postgresql-18.6/pgsql/bin`, loopback54329. Existing admin connection line in `.local/postgres/connection.env`, password .local/postgres/password.txt; load without printing. Parent starts server. Admin classroom login owns existing dev DB; leave it untouched, use postgres admin DB for creating unique proof DBs.
- packages/database/src/index.ts creates bounded pg/Drizzle pool lazily; shared databaseUrl rejects query params. Add infrastructure-only files rather than alter web/API/idle worker behavior. Database/queue wrappers may live packages/database and apps/worker as appropriate. Queue package is already dependency of apps/worker, so avoid undeclared runtime dependency in database package.
- pg-boss dist/index.js:138–160 checks contractor when migrate:false; starts supervisor only if supervise:true and BAM only if migrate:true. contractor.js:237–245 requires exact schema version. manager.js:835 work defaults transactional:false; explicitly retain false to prevent callback-spanning DB transaction. boss.js supervise() includes stats partition DDL and reindex; investigate/prove a dedicated owner-profile maintenance pass, not worker ownership. All generated functions must be checked for SECURITY DEFINER; do not grant arbitrary privileged function access.
- Drizzle pg-core/dialect.js:44–80 creates journal schema/table before transactional pending-migration SQL+rows; journal creation may survive a failed first migration. It selects latest timestamp; do not claim automatic hash drift validation. Use reviewed immutable files and explicit release serialization/hash check or document required release guard. CLI config may set migration role via PGOPTIONS/connection options; a NOLOGIN app owner with migration member SET ROLE keeps object ownership stable. No drip of DB CREATE permission to runtimes.
- Parent primary-source research: https://pgboss.io/api/constructor, /api/workers, PostgreSQL18 ddl-priv/ddl-schemas/app-pgdump/app-pgrestore, https://orm.drizzle.team/docs/drizzle-kit-migrate. You can use installed sources as second check; parent owns report/sources. No repeated research required unless needed for actual API usage.

## Tasks

- [x] Add minimal reusable infrastructure configuration/lifecycle boundaries, roles/bootstrap SQL or safe generated SQL, Drizzle tiny proof schema/config/reviewed migrations; no feature schema.
- [x] Add bounded repeatable local RR-02 proof runner/scripts and tests. Unique run directories and exact DB/role names. Keep per-run sanitized JSON/log evidence and failed runs; no blanket retry until green. CLI failure must exit nonzero.
- [x] Run local role/DDL negatives, migration replay/failure, queue lifecycle/retry/duplicate/expiration/crash, logical dump/restore and runtime bootstrap checks. Unsupported/broken critical behavior must be reported rather than hidden.
- [x] Add focused npm commands/environment examples/README run instructions only as necessary. Keep runtime defaults idle. No commit/push or architecture changes; parent will update RR-02 report/evidence and gates.

## Verification / handoff

Return short exact outcomes, role grants actually used, any maintenance owner requirement and evidence paths. Capture package source/version fingerprints for proof. No broad multi-agent review. Parent will inspect source and write concise gate report. Follow task once; do not close RR-02 yourself if something critical is unproven.

## Implementation Notes


Completed 2026-09-18. Final proof rr02_1789733917336_f3f17b passed 11 groups; typecheck/build/Vitest6 passed. Parent focused acceptance narrowed queue grants and retained all five runs, including the corrected ACL-count assertion. No broad review, business feature, provider experiment or AD adoption. RR-02 report and evidence under architecture reviews; native server stopped after proof, data retained. No commit/push.
