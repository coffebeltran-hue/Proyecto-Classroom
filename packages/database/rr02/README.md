# RR-02 disposable operational proof

This fixture is infrastructure only. Application startup stays idle and does not run migrations. It does not adopt proposed architecture decisions or create academic tables.

Use the pinned local Node runtime and already running PostgreSQL 18.6 on loopback. From the repository root in PowerShell:

```powershell
$env:PATH = "$PWD/.local/runtimes/node-v24.21.0-win-x64;$env:PATH"
npm run rr02:proof
```

The runner reads `.local/postgres/connection.env` without printing it. Alternatively set `RR02_ADMIN_URL` in the environment to an administrative loopback connection. `RR02_PG_BIN` optionally specifies the existing PostgreSQL binary directory. No installation or provider access occurs.

Each run creates uniquely named `rr02_*` databases and roles, recorded in `.local/rr02/<run>/evidence.json` before provisioning. All are retained, including on failure. Credentials for disposable roles exist only in process memory and the child environment. There is no automatic cleanup. Administrators can use the exact recorded names for a separately authorized cleanup. Existing `classroom_dev`, credentials and existing database PUBLIC privileges are untouched.

`npm run rr02:generate` generates SQL from `schema.ts`. The checked-in initial SQL was reviewed: it creates only `rr02_proof` and a two-column `marker` table. Generation does not migrate. The proof uses Drizzle's Node migration API under the migration login with `SET ROLE` to the no-login owner, serialized by an advisory lock. It proves first application, replay, and rollback of an injected failing second migration. Drizzle may create its journal before the transaction and does not validate historical hash drift. Reviewed migration files must remain immutable; an actual release must compare their recorded hashes before migration and use the same serialization convention. Evidence fingerprints the SQL and installed sources; this fixture is not a general release migration service.

The API and worker logins have no ownership, owner membership, privileged role attributes, database CREATE/TEMP, or schema CREATE. Both receive proof-table DML. The worker receives SELECT on `pgboss.version` and `pgboss.queue`, DML on `pgboss.job` and `pgboss.job_common`, and EXECUTE only on `pgboss.job_now()`. Both owners have global default function EXECUTE revoked from PUBLIC. There are no automatic future queue table/function grants: new dedicated job partitions require reviewed explicit grants. Proof-table default DML grants are scoped to `rr02_proof`. These grants are an operational baseline, not queue-per-tenant authorization.

The separate maintenance login assumes the no-login queue owner, precreates queues, explicitly runs `supervise`, and performs forced index rebuilds. Its temporary database CREATE grant is revoked after schema construction; ownership of the queue schema suffices for the tested maintenance. Runtime workers force `migrate:false`, `supervise:false`, `schedule:false`, and callbacks use `transactional:false`. A worker must not be promoted to owner to enable maintenance. This proves a separate administrative credential/profile and explicit maintenance execution; no deployed service or scheduling design is selected. Disabling maintenance alone is incomplete.

The bounded runner checks role/catalog boundaries, lifecycle/retry, ordinary duplicates and opt-in singleton suppression, stop/restart, a forcibly killed child during a work callback, expiration/redelivery, handler timeout/retry, sanitized connection failures, and exact-schema fail-closed startup. The deadline is three minutes; failures exit nonzero and preserve evidence. Synthetic callbacks perform no provider I/O. At-least-once redelivery requires idempotency for future real effects; timeout does not cancel arbitrary side effects.

`pg_dump` writes a custom-format file; `pg_restore` restores into a different disposable database in the same cluster with preexisting proof roles. State, journal, queue rows, object ownership/ACLs and default ACLs are compared, then a restored synthetic job runs. This proves logical restore only, not role bootstrap into a new cluster, PITR, providers, RPO or RTO. Raw subprocess output is discarded; only exit code and byte count are retained to avoid credential leakage.
