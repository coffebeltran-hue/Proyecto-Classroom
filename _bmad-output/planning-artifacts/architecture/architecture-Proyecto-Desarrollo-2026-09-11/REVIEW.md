# Review preparation and implementation gate

Status: **documentarily repaired; targeted independent re-review pending; implementation NOT authorized**. Consolidated 2026-09-13; repaired 2026-09-17 under Juan authorization. This is the author's consistency report, not an independent review or an approval of proposed policies.

## Coverage and cross-document authority

| Requested area | Review artifact / canonical detail |
| --- | --- |
| Architecture spine, decisions, ADRs | [ARCHITECTURE-SPINE.md](ARCHITECTURE-SPINE.md), [ARCHITECTURE.md](ARCHITECTURE.md) |
| Physical architecture, monorepo, process boundaries | ARCHITECTURE.md |
| Physical ERD, entities, relationships, constraints | [DATA-MODEL.md](DATA-MODEL.md) |
| State machines and user-visible semantics | [STATE-MACHINES.md](STATE-MACHINES.md); serialized enum names in OpenAPI |
| RBAC, threat model, multi-tenancy | [SECURITY.md](SECURITY.md) |
| GitHub permissions, App/OAuth/installations, webhooks | [GITHUB.md](GITHUB.md) |
| API routes, payloads, errors and concurrency | [API.md](API.md), [openapi.json](openapi.json) |
| Jobs, inbox/outbox, reconciliation, snapshots, retention | [OPERATIONS.md](OPERATIONS.md) |
| Observability, deployment, failures and recovery | OPERATIONS.md and [DELIVERY.md](DELIVERY.md) |
| Tests, E2E, delivery stages and Definition of Done | DELIVERY.md |
| Technical evidence, assumptions, risks, recommendations, remaining questions | [EVIDENCE.md](EVIDENCE.md), [research record](reviews/STACK-RESEARCH.md) |
| Approval history and supersession | [.memlog.md](.memlog.md), [DISCUSSION.md](DISCUSSION.md) |

Cross-document review covers entity/table/API mappings, independent state axes, tenant/course role scope, GitHub permission levels, route semantics, event/job ownership, source-of-truth boundaries, AD identifiers, MVP/V1/Future scope, retention, grading and submission semantics. The physical catalog governs database constraints; OpenAPI governs wire names; approved AD semantics override proposed mechanics. Neither API schemas nor diagrams alone express every transactional invariant.

## Corrections made during consolidation

- Reconciled historical open questions with approved withdrawal AD-9, dedicated pilot AD-10 and stack/process boundaries AD-11. Retention and numeric grading remain AD-7/AD-8. Chronological memlog entries remain intact with an explicit supersession entry.
- Preserved existing AD numbering: AD-1 through AD-11 approved; previously referenced AD-12 through AD-18 consolidated as proposals. No engineering recommendation was promoted to approval.
- Separated workflow path in a template from repository-specific workflow ID; made organization ownership explicit in repository relationships.
- Reconciled identity intake without a roster match, active binding history, correction authorization, and restricted prebinding access. Historical acceptance binding is not silently replaced by correction.
- Added physical records for incidents without receipts, previews, scoped grants, durable roster imports, notices and publication idempotency. An incident never fabricates a received timestamp.
- Reconciled event-to-job mappings and operation projections; receipt validation, academic classification, preservation, deletion and current grade remain independent axes.
- Defined decimal strings, stale-publication conflicts, original-response idempotency replay and student-safe withdrawal history in the API. A later revision never inherits or removes a published grade.
- Marked provider choice, temporal-preview policy, reverse identity uniqueness and detailed scope/defaults as recommendations. Documentary version research remains distinct from executed compatibility proof.

## Historical preparation evidence and limits — 2026-09-13

The architecture-spine linter passed with zero findings. OpenAPI 3.1.1 passed `openapi-spec-validator`. The repeatable [package checker](reviews/validate-package.py) verifies required artifacts, local Markdown file targets, balanced fences, schema references, unique operation IDs and path parameters. Its captured result is [PREPARATION-CHECKS.json](reviews/PREPARATION-CHECKS.json).

That original contract contained 82 paths, 94 operations and 101 schemas; the repaired 2026-09-17 contract contains 85 paths, 97 operations and 112 schemas. [build-contract.py](reviews/build-contract.py) only generates that document; neither helper is application code. No runtime, migrations, GitHub integration, infrastructure, browser E2E, rendered Mermaid or independent adversarial tests were executed. A valid OpenAPI document is not proof of authorization enforcement or business correctness.

## Next gate: targeted independent adversarial re-review

The original review completed with PASS WITH REQUIRED FIXES (6 HIGH, 5 MEDIUM). Its artifacts are preserved unchanged. Targeted re-review of the corrected package is pending. Reviewers must challenge at least: temporal proof at receipt under force-push/outage; tenant and cross-course identity correction; GitHub privilege and frozen-template assumptions; replay/outbox effects after crashes; publication/withdrawal/purge races; quotas and hostile archives; backup deletion and restore tombstones; decimal and historical scale integrity; and student-safe data projections.

Acceptance of this gate requires independent findings with severity, affected invariant/artifact, concrete failure scenario and disposition. Critical/high findings must be resolved or explicitly accepted by the responsible user with documented consequences; corrections require another consistency pass. Reviewers must distinguish a documented external research gate from an actual proven capability.

OQ-10–OQ-13 and RR-01–RR-08 remain open as detailed in EVIDENCE.md. They do not prevent review of this package, but their stated gates still block the dependent implementation baseline or pilot activities. In particular, dependency/queue compatibility and submission temporal proof are not established, and recoverable-backup disappearance within an extra 30 days is not promised.

Passing the targeted re-review does not authorize implementation. Juan's separate implementation authorization remains required.

## Authorized repair verification — 2026-09-17

[REPAIR-CHANGELOG.md](reviews/repair/REPAIR-CHANGELOG.md) records the applied ACR-001–011 changes, Juan-approved AD-5/7 clarifications and exact artifacts. [REPAIR-CHECKS.json](reviews/repair/REPAIR-CHECKS.json) captures current structural checks. The original PREPARATION-CHECKS and independent INPUT-MANIFEST remain historical input evidence; original hashes are expected to differ for authorized architecture repairs but every independent review artifact remains unchanged.

Author-side spine rubric, seam and evidence checks accompany the structural pass; these are not the targeted Anti-Consensus re-review and cannot operationally close a finding. That future re-review should rerun only repaired counterexamples and inspect new interface/lock interactions, preserving prior reviewer findings and disagreements.

Scope for targeted re-review: identity activation/roster authority; per-account unknown remote attempts; canceled/start journal and stale restore workers; reopen/policy course fence; sequence/latest projections; request discovery/version/resolution API; quota sweep liveness; independent alerts; approved ingress clock/policy uncertainty and institutional deleted-code exception. R-01's historical-preview semantics remain proposed and must not be called adopted eligibility. No new blanket stack, microservice, broker or evaluator review is needed absent a concrete changed assumption.

Every ACR has documentary repair coverage; runtime/provider correctness remains unproven. The statement “addressed in design” means the required contract exists and was structurally checked, not that independent re-review or experimental proof passed. OQ-10–13/RR-01–08 remain open. Stop before implementation, migrations, infrastructure, GitHub resources, experiments or deployment.
