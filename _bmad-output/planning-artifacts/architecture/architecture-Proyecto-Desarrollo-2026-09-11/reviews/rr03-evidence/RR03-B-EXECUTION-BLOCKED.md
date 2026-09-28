# RR-03 B / ACR-002 — execution blocked before scenarios

2026-09-27 Colombia / 2026-09-28 UTC. **B = BLOCKED. RR-03 = PARTIAL.** A reproduction and cleanup/rollback remain PASS; historical evidence was not reopened. No GitHub requests, tokens, OAuth, template generation, collaborator flows, webhook tests, settings changes, RR-04, commit or push.

## Observed result and stop condition

Three attempts to start the directed local harness were recorded. No scenario began: every evidence file has `checks: []`, `processEvents: []`, `transactionObservations: []`, `negativeControls: []`.

| Evidence, relative to reviews/rr03-evidence | Result |
| --- | --- |
| rr03b_1790556436912_6e99dd.json | Setup FAIL: connect ECONNREFUSED 127.0.0.1:54329 |
| rr03b_1790556533027_fd4c31.json | Setup FAIL: connect ECONNREFUSED 127.0.0.1:54329 |
| rr03b_1790556551601_c4cbc6.json | Setup FAIL: `could not open file "base/5/1249": No such file or directory` |

FACT: the existing local PostgreSQL service was initially unavailable. The existing pg_ctl binary/data directory was used to start it on loopback 54329. The first Windows Start-Process -Wait also waited on the service descendants; that waiting command was interrupted, and the next connection was refused. A subsequent start waited on pg_ctl itself and the harness received the missing-file error. The server log showed recovery from a prior unclean shutdown and readiness before the catalog error. Cause of the missing file is UNKNOWN; no claim of established corruption, OneDrive fault, or attribution to a particular operation.

FACT: after the error, no database repair, deletion, cluster reinitialization, additional harness execution or database inspection was performed. Local process listing showed postgres processes still running. No claim is made that the service has been returned to its initial stopped state. No proof is available that fixture creation completed; `fixture` metadata is absent. Partial setup effects, if any, are UNKNOWN and must not be blindly deleted. Preserve the run prefixes above for a future authorized inspection.

The user's STOP condition applies: risk of affecting existing RR-01/RR-02/A fixtures. The existing cluster is shared with those fixtures, so repairing or further operating it is outside this block. Existing fixtures were not intentionally edited, dropped or migrated by the harness; their present integrity was not revalidated.

## Implementation created, not runtime-validated

- `scripts/rr03-b/provider.mjs`: independent loopback HTTP provider; separate remote state; controllable apply/reply barriers, pending invitation/member, absent reads, errors, lost responses, DELETE; no access to reconciler tables or code. Controller alone controls faults; worker accesses only HTTP.
- `scripts/rr03-b/worker.mjs`: PostgreSQL subjects/attempts/watch/outbox/audit; short transactions, generation checks/CAS; durable prepare/dispatch before mutation; stale completions; opaque outcome tracking; compensated removal; restart discovery and recurring watch; loopback-only requests.
- `scripts/rr03-b/run.mjs`: isolated DB/worker-role provisioning, real forked workers, explicit process kills/restarts, deterministic barriers, scenario assertions, independent pg_stat_activity observer, audit snapshots and negative controls.

The code is an experimental harness, not product functionality or adoption of proposed AD-13/18. It is inspectable but UNVERIFIED in execution. Syntax checks are not evidence of correctness. Fixtures are designed to remain for inspection; credentials are passed to workers by private IPC and not saved in evidence. Only local PostgreSQL connection configuration is read; GitHub .env/PEM are not read by B.

## Durable model implemented in fixture DDL

`subject`: key identifying tenant/repository/account, desired GRANTED/REVOKED, generation, version, independent academic flag, observed JSON/time, cleanup.

`attempt`: immutable identity/subject/generation/action; prepared, possibly_issued, succeeded, unknown or definitive_no_effect; creation/update timestamps. This state cannot be settled merely by observed absence.

`watch`: active recurring reconciliation and exhausted-task count. `outbox`: work acceleration independent of discovery. `sweep`: durable keyset cursor. `audit`: append-only logical event IDs, sequence, subject, attempt/generation detail, process ID and timestamp; worker has no UPDATE/DELETE grant on audit.

Revocation updates desired/generation/academic/cleanup and appends audit/outbox/watch atomically. Completion records its own outcome and uses generation CAS; a duplicate known completion is not replayed into desired state. Pending unknown grants prevent observed_absent cleanup. This describes the implementation, not a passed test result.

## One-to-one scenario map

All are implemented as directed checks in `run.mjs`. **Every scenario below is NOT RUN**, not PASS or assertion FAIL. Only infrastructure setup failed.

| Plan | Implementation/check | Intended assertion |
| --- | --- | --- |
| B01 | check B01 / unsafeIntent | No provider mutation without durable intent |
| B02 | check B02 / concurrent workers | One dispatch winner for same attempt |
| B03 | check B03 / late invitation + crash after stale completion | Central sequence, invitation cancellation, audit, convergence |
| B04 | check B04 / late member | Late active access removed, academic authority unchanged |
| B05 | check B05 / held reply and duplicate | Stale CAS and completion dedup |
| B06 | check B06 / six crash variants | Before intent commit, prepared, pre-I/O, in-flight, remote-success/pre-completion, revoke-before-queue; durable restart |
| B07 | check B07 / controlled abort | UNKNOWN, repeated absence, subsequent late effect, continued pending safety |
| B08 | check B08 / DELETE crash | Crash after removal/pre-ack and repeated removal/reconcile |
| B09 | check B09 / 401,403,503 | Blocked with watch, recover after transient error |
| B10 | check B10 / exhausted budget | DB discovery after queue disappearance and restart |
| B11 | check B11 / old,new,other tenant | Subject isolation |
| B12 | check B12 / observation/regrant/in-flight DELETE | CAS on stale observation, crash before cleanup CAS, old removal cannot certify new generation |
| B13 | check B13 / repeated completion/reconcile | Idempotence and one logical completion |
| B14 | check B14 / observer evidence | No open worker DB transaction at GET/PUT/DELETE |
| B15 | check B15 / deliberate mutants | Invariant failure when intent guard, CAS or sweep is bypassed; transaction assertion and independent observer catch BEGIN→I/O→COMMIT |

The negative controls are intentionally broken fixture variants. They must be distinguished from normal successful protocol behavior when executed. Their detection has NOT yet been observed.

## Triple verification: current state

| Requirement | Existing normative contract | Inspectable implementation | Executable layer |
| --- | --- | --- | --- |
| Durable intent before I/O | REPAIR-PROPOSAL ACR-002; OPERATIONS access protocol | worker prepare/dispatch/io | B01/B02/B06 NOT RUN |
| Generation and stale completion | same; GITHUB access repair | worker revoke/complete; subject CAS | B03/B05/B12/B13 NOT RUN |
| Crash/restart/discovery | FINDINGS ACR-002; TARGETED-REVIEW ACR-002 | child fork/kill, worker startup/scan, durable attempts | B06/B08/B10 NOT RUN |
| Invitations and access compensation | GITHUB access repair | provider GET/DELETE model; worker reconcile/remove | B03/B04/B08/B11 NOT RUN; prior real primitive proofs retained |
| Honest uncertainty/settlement | OPERATIONS and REPAIR-PROPOSAL ACR-002 | unresolved grants block observed_absent; watch persists | B07/B09/B10 NOT RUN |
| DB/network boundary | OPERATIONS short transactions | worker tx/io guard; provider pg_stat_activity observer | B14/B15 NOT RUN |
| Audit/no academic authority from provider | REPAIR-PROPOSAL ACR-002 | append-only audit; independent academic field | central sequence/B04/B11 NOT RUN |

Documentation and code layers exist. The third layer is absent, so operational closure is not justified.

## Validation actually executed

Pinned Node 24.21.0 `--check` for all three new MJS files: PASS. Three directed harness invocations: setup FAIL as above; zero test scenarios executed. Typecheck, additional affected-unit runs and build were not reached because B did not pass. No Playwright or unrelated suites. New files are outside the workspace TypeScript include list; a future workspace typecheck alone would not validate these MJS files. Future verification must also check the harness itself explicitly.

## Limits and provider evaluation

No successful crash/restart, stale CAS, reconciliation, idempotency, transaction-observer or audit-reconstruction evidence exists from this execution. No production claim or whole-gate PASS.

The simulator controls scheduling and separates remote state from workers; it cannot establish GitHub propagation, internal settlement guarantees or organization policy behavior. Existing collaborator/invitation proofs remain reusable but do not replace the missing local adversarial proof. No new GitHub mutation is justified by the current local infrastructure blocker. Adapter correspondence must still be evaluated after local success; whether any additional real-provider property remains is NOT YET DETERMINED.

## Next authorized decision needed

STOP. Recommended next scope: a completely separate temporary PostgreSQL cluster/port using existing pinned binaries, outside the existing cluster and its data directory, for B only. This is a proposal, not performed or automatically authorized past the explicit STOP. Do not repair the old cluster as part of B without a separate decision. Once isolation is approved and working, resume the same 15 scenarios, preserve every failure, fix only bounded harness issues, then run the prescribed validation and evaluate adapter correspondence.

Estimated next-step cost: MEDIUM for isolated infrastructure plus directed harness execution/debugging. Exact credits UNKNOWN. RR-01 PASS, RR-02 PASS, A PASS remain historical accepted results; present cluster health is a separate unresolved observation. **B BLOCKED; RR-03 PARTIAL.**
