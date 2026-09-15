# Validation, delivery and Definition of Done

This is a plan, not executed tests or authorization to build. All implementation begins only after independent adversarial review, disposition of blocking findings and explicit user authorization.

## Sequence and acceptance gates

| Gate / increment | Deliverable | Required proof |
| --- | --- | --- |
| G0 Package preparation | Complete linked documents, current approvals, OpenAPI, physical constraints | Cross-document and structural checks in REVIEW |
| G1 Independent adversarial review | Independent findings, input reconciliation, proposed-contract challenges | Review outcome and resolved/deferred findings; not passed in this package |
| G2 Authorization and technical baseline | User authorizes next work; dependency/provider spikes scoped | RR-01..RR-04 evidence before depending on their assumptions |
| I1 Identity/course foundation | Login, institutional boundary, dedicated org, staff, roster, teacher-approved linking | Real DB/RLS and negative role/tenant tests; real GitHub auth |
| I2 Assignment and provisioning | Versioned template/invite/acceptance/access | One logical repo under duplicate clicks/crashes; actual student access |
| I3 Submissions | Durable requests, preview evidence, confirmation/review, independent revisions | Boundary time, failed persistence, delayed GitHub, no fake evidence |
| I4 Evaluation | Formative runs, drafts, publications/withdrawals | Exact SHA, decimal, concurrency and private-note tests |
| I5 Evidence/operations | Snapshots, quotas, holds, retention, purge, restore | Exact-SHA capture and no resurrection; provider proof |
| I6 Pilot preparation | Complete E2E, observability, security review and code review | Named owners, support/SLO agreement, real staging integration, rollback/restore rehearsal |
| G3 Deployment and post-deployment | Controlled release plus real smoke checks | No production deployment without separate authorization and release checks |

Do not interpret increments as silos: tests/security/persistence/UX/integration accompany every feature. Groups and their required E2E are V1, not a hidden MVP implementation. Teams/rubrics and advanced notifications precede V2 LMS/institutional administration/reporting. Future authoritative evaluation is separately threat-modeled.

## Testing strategy

- Unit: exact decimal lexical parsing/half-up percentage, policy versions, effective deadlines, state transitions, classification/validation separation, archive manifest interpretation. No test that merely restates a getter as evidence of a business invariant.
- Integration: real selected PostgreSQL, migrations from empty/prior version, unique/composite FK/check/constraint triggers, forced RLS with actual runtime logins, shared transaction publication/retention, inbox/outbox and idempotency races.
- Provider adapters: deterministic stubs for every documented failure plus real dedicated GitHub sandbox for App, permissions, private template, collaborators, push webhook and Actions reports. Mocks alone do not meet Done.
- API: OpenAPI schema conformance, request precision and unknown fields, CSRF/OAuth boundaries, x-authorization interpreted as tests, duplicate keys, cursor stability, safe error responses, separate student/staff views.
- E2E: Playwright matching browser/image version, Teacher/Student/TA/Admin accounts, mobile/keyboard/error states. Seed only synthetic institution/student data.
- Operational: 50 concurrent accepts, multiple workers, lost responses and kill points, quotas/reservations, pool saturation, backlog fairness, provider limits, primary/version/backup deletion and isolated restore.

## Mandatory scenarios and evidence assertions

| Test ID | Trigger / flow | Must demonstrate | Trace |
| --- | --- | --- | --- |
| E2E-01 | Teacher login → install/connect organization → create class | Verified installer, private repo/Actions checks; no unrelated org adoption | AD-10/11 |
| E2E-02 | Import roster with valid/duplicate/bad rows → preview → apply | No partial hidden apply; identifiers unique; student cannot enumerate roster | AD-3 |
| E2E-03 | Student login → request identity → teacher approves/rejects | Knowing code/invite does not link; conflicting concurrent approval creates one active binding | AD-3 |
| E2E-04 | Teacher task version → template → deadline/max → publish invite | Published config immutable; readiness/capacity warnings meaningful | AD-8/10 |
| E2E-05 | Student accepts twice → provisioning → invitation pending → access granted | One acceptance/repo; repo-created not access-granted | AD-2/13 |
| E2E-06 | Push → webhook → formative Actions → dashboard | Run/attempt/SHA correct; no automatic submission/official grade | AD-1/2 |
| E2E-07 | Preview → Submit at/before/after deadline | Durable receipt, deadline/policy snapshot, no client clock authority | AD-5 |
| E2E-08 | GitHub delays until after deadline / stale or unavailable observation | Processing delay not automatic lateness; needs_review not confirmed punctual | AD-5/14 |
| E2E-09 | DB fails before commit / response lost after commit | No invented receipt vs original receipt recovered idempotently | AD-5/13 |
| E2E-10 | Teacher reviews exact submission/tests → draft → publish → student views | Private draft/notes; exact decimal original scale and published feedback | AD-1/8 |
| E2E-11 | Student submits R3 after publication for R2 | R3 independent, visible indicator; no inherited grade/regrading | AD-4 |
| E2E-12 | Withdraw A while another teacher publishes B | Stale withdrawal conflicts; B remains current; replay creates one withdrawal | AD-9/15 |
| E2E-13 | Withdraw → no grade → explicitly republish same value | No zero/old fallback; full history and unchanged retention floor | AD-9 |
| E2E-14 | Capture exact submitted SHA after branch changes | Correct content; no current-head substitution or timing backproof | AD-6 |
| E2E-15 | Quota exceeded / oversized archive / LFS/submodules | Confirmed submission intact; blocked/partial explicit, no truncation/infinite retries | AD-6/7 |
| E2E-16 | Course archive vs academic_close; later grade; hold review date | Archive not close; max retention extension; review does not release hold | AD-7 |
| E2E-17 | Grace expires → hold/publication race → purge | Fence behavior, no premature deletion, immutable metadata | AD-7/15 |
| E2E-18 | Restore old DB/object backup after recorded deletion | Current independent tombstones prevent resurrection before access reopens | AD-7 |
| E2E-19 | Teacher corrects wrong account/identity | Lineage/audit; scope across courses; old session loses access; external revoke may remain pending | AD-3/18 |
| E2E-20 | Tenant A guesses Tenant B IDs through every route/export/download/job | No foreign data or side effect; DB-level direct FK/RLS tests also fail | AD-10/12 |
| E2E-21 | TA reads/grades with and without capability | No publication/withdrawal by TA; no student access to draft/internal notes | AD-1/9 |
| E2E-22 | Template/repo gone, installation removed, outside permission changed | Safe stale/inaccessible states; no 404 deletion assumption or silent association | AD-10/17 |
| E2E-23 | Worker killed after external effect before DB commit | Reconcile known provenance; ambiguous collision needs operator | AD-13 |
| E2E-24 | CSV export contains formula-leading strings | Safe cell export and current authorization on expiring download | R-08 |
| E2E-25 | Grade input 7.250, negative, exponent, null, 0, >max | Excess precision rejected; null not zero; score bounds; percentage derived only | AD-8 |
| E2E-26 | Keyboard/mobile onboarding, errors, pending capture and withdrawn grade | Accessible focus/labels/status and no misleading combined state | STATE-MACHINES |

Each test records fixture IDs, input/clock control, assertions, result and failing evidence. Tests are planned, not passed by writing this table.

## Deployment proposal

Development/test/staging/production have separate DBs, object namespaces/credentials and GitHub Apps/orgs. API/worker container images are reproducible from one lockfile with a pinned Node base digest; browser image matches Playwright. Non-root, read-only filesystem, bounded temporary storage/capabilities/network, workload identity and secrets manager apply as SECURITY specifies. No local developer production tokens.

Release sequence: lint/typecheck/unit/integration/API/E2E/build and image/advisory scan → immutable image/SBOM → backup checkpoint → one audited migration job (academic then pg-boss schema) → compatibility/readiness check → worker rollout with graceful drain/lease recovery → API rollout → staging/production smoke checks as authorized. Migrations are expand/contract, no automatic destructive down-migration. Old worker message versions drain or remain supported before removal. Runtime migration principals absent from application containers.

Readiness checks schema version, DB connectivity, queue readiness and required secret availability; liveness only process health. GitHub outage should degrade integration readiness/capabilities, not cause endless restarting of an otherwise healthy academic API. Storage outage blocks capture/download, not receipt intake if DB is healthy. Restore mode withholds evidence access until tombstone replay and checksum/reference reconciliation complete.

Post-deployment smoke: teacher login/course access, synthetic roster/assignment acceptance, confirmed receipt, safe formative run, draft/publication/student view, withdrawal on synthetic record, snapshot access and correct health/metrics. No destructive smoke tests on real student evidence. Failure rollback restores application image only if schema/message compatibility holds; otherwise forward fix under operator control. DB restore is not a routine rollback of a deployment.

## Definition of Done

A feature is Done only with applicable frontend, API, authorization, exact persistence, validation, error behavior, automated checks, real GitHub integration, documentation and audit/telemetry. Required checks:

1. Approved requirement and AD trace; subordinate recommendations accepted at package review.
2. No mocks/in-memory/localStorage as academic source of truth.
3. All relevant negative role/tenant and concurrency tests pass under real runtime principals.
4. Decimal, receipt, publication/withdrawal and retention invariants survive restart and retries.
5. No secrets/code in logs; snapshot parser cannot execute content.
6. Migrations replay/upgrade and restore procedures tested; pg-boss schema and runtime privileges compatible.
7. Source/provider semantics demonstrated with real sandbox when feature uses GitHub.
8. State/empty/error/loading/mobile/accessibility acceptance verified.
9. Operational owner, alert/runbook, rate/quota behavior and recovery evidence exist.
10. Independent code/security review at implementation stage; unresolved blocking findings prevent release.

The documentation package itself is Done-for-review when every README link exists, AD statuses reconcile, named contracts align, OpenAPI structural checks pass and remaining questions/research have owners/gates. That does not pass G1 or authorize implementation.
