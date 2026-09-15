# Review preparation and implementation gate

Status: **ready for independent adversarial review; implementation NOT authorized**. Consolidated 2026-09-13. This is the author's consistency report, not an independent review or an approval of proposed policies.

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

## Preparation evidence and limits

The architecture-spine linter passed with zero findings. OpenAPI 3.1.1 passed `openapi-spec-validator`. The repeatable [package checker](reviews/validate-package.py) verifies required artifacts, local Markdown file targets, balanced fences, schema references, unique operation IDs and path parameters. Its captured result is [PREPARATION-CHECKS.json](reviews/PREPARATION-CHECKS.json).

The contract contains 82 paths, 94 operations and 101 schemas. [build-contract.py](reviews/build-contract.py) only generates that document; neither helper is application code. No runtime, migrations, GitHub integration, infrastructure, browser E2E, rendered Mermaid or independent adversarial tests were executed. A valid OpenAPI document is not proof of authorization enforcement or business correctness.

## Next gate: independent adversarial review

Pending. Reviewers must challenge at least: temporal proof at receipt under force-push/outage; tenant and cross-course identity correction; GitHub privilege and frozen-template assumptions; replay/outbox effects after crashes; publication/withdrawal/purge races; quotas and hostile archives; backup deletion and restore tombstones; decimal and historical scale integrity; and student-safe data projections.

Acceptance of this gate requires independent findings with severity, affected invariant/artifact, concrete failure scenario and disposition. Critical/high findings must be resolved or explicitly accepted by the responsible user with documented consequences; corrections require another consistency pass. Reviewers must distinguish a documented external research gate from an actual proven capability.

OQ-10–OQ-13 and RR-01–RR-08 remain open as detailed in EVIDENCE.md. They do not prevent review of this package, but their stated gates still block the dependent implementation baseline or pilot activities. In particular, dependency/queue compatibility and submission temporal proof are not established, and recoverable-backup disappearance within an extra 30 days is not promised.

Passing a future review does not authorize implementation. Juan's separate implementation authorization remains required.
