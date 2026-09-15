# Preimplementation architecture package

Prepared for Juan and the delivery team; original run 2026-09-11, consolidation resumed and completed 2026-09-13. No application code, infrastructure, database or GitHub resources have been created. Implementation requires a separate user authorization.

## Read this package

1. [Architecture invariants](ARCHITECTURE-SPINE.md): approved decisions AD-1–AD-11 and proposed engineering contracts AD-12 onward.
2. [Physical architecture and ADR rationale](ARCHITECTURE.md): processes, dependency ownership, monorepo and deployment boundaries.
3. [Physical data model](DATA-MODEL.md): tables, types, PK/FK/cardinality, constraints, indexes and transactional rules.
4. [State machines and UX](STATE-MACHINES.md): independent lifecycle axes, transitions, actors and failure behavior.
5. [Security and RBAC](SECURITY.md): permissions, trust boundaries and tenant isolation.
6. [GitHub integration](GITHUB.md): App/OAuth, installation model, per-operation permissions, source ownership and recovery.
7. [Async processing and preservation](OPERATIONS.md): inbox/outbox, pg-boss, reconciliation, capture, quotas, deletion and restore.
8. [API contract](openapi.json): OpenAPI 3.1 design artifact; [API semantics](API.md) describes concurrency and authorization rules.
9. [Validation and delivery](DELIVERY.md): test scenarios, roadmap, deployment and Definition of Done.
10. [Evidence and open items](EVIDENCE.md): researched versions, assumptions, recommendations and release gates.
11. [Review preparation and gate](REVIEW.md): consistency checks, their limits and the pending independent adversarial gate.

The older [DISCUSSION.md](DISCUSSION.md) is historical working material, superseded by this package where recommendations evolved. The append-only [.memlog.md](.memlog.md) preserves decision history. This package never promotes a recommendation to user approval.

## Status vocabulary

- **DECISION / ADOPTED:** explicitly approved by Juan (AD-1–AD-11).
- **FACT:** supported by the cited primary source or local validation evidence.
- **RECOMMENDATION / PROPOSED:** concrete design selected for review; not separately approved by the user.
- **ASSUMPTION:** a premise that could change the design.
- **OPEN QUESTION:** unresolved product or operational input, with owner and revisit gate.
- **RESEARCH REQUIRED:** an experiment or external guarantee not yet established.

The design package can be complete for review while deployment gates remain open. Documentary compatibility is not an executed integration test. The review report distinguishes those states explicitly.

## Product scope and traceability

Vision: teachers operate a programming course from verified roster to published assessment, with GitHub hosting code and the platform owning academic records.

| Capability | MVP treatment | Governing contracts |
| --- | --- | --- |
| Institution and dedicated GitHub org | One pilot institution, extensible tenant ownership; minimal admin functions | AD-3, AD-10, SECURITY, GITHUB |
| Courses, staff and roster | Multiple courses, Teacher/TA capabilities, manual/CSV roster, teacher-confirmed identity | DATA-MODEL, SECURITY |
| Individual assignment | Versioned private template, invitation, recoverable repository provisioning | AD-2, AD-11, GITHUB |
| Submission | Durable exact-SHA requests, evidence validation, independent revisions | AD-2, AD-4, AD-5 |
| Formative Actions | Student/teacher visibility, attempts and SHA, no official grading authority | AD-1, GITHUB |
| Evaluation/publication | Decimal score/max, private draft, immutable publication/withdrawal | AD-4, AD-8, AD-9 |
| Evidence preservation | Exact-SHA private snapshots, completeness, quotas, retention and deletion | AD-6, AD-7 |
| Individual extensions and CSV export | RECOMMENDATION included in proposed MVP, not an additional adopted scope decision | API, DELIVERY |
| Teams, reusable groups, rubrics, advanced notifications | V1; no group tables or partially working group endpoints in MVP | EVIDENCE |
| LMS/LTI, full institutional admin, analytics, public API/CLI | V2/Future; internal API remains independent from UI | ARCHITECTURE |
| Authoritative autograding, protected tests | Future independent trust boundary, never an MVP switch | AD-1, SECURITY |

The full-product group E2E requirement applies at V1, not as a claim that the MVP supports groups. Public/internal student repositories, Git hard cutoff, automatic official scoring, Redis and microservices are outside this proposed MVP.
