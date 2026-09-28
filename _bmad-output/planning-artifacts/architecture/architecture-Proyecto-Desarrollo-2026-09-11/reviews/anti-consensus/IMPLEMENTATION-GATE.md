# Independent implementation gate

This document is a review recommendation for Juan. It does not authorize code, migrations, provider resources or deployment, and it does not adopt AD-12–AD-18. The final assessment and severity counts are recorded in [ANTI-CONSENSUS-REPORT.md](ANTI-CONSENSUS-REPORT.md); concrete defect closure is tracked by stable IDs in [FINDINGS.md](FINDINGS.md).

## Gate meanings

- **BLOCKS IMPLEMENTATION:** the affected domain/API invariant must be specified consistently before implementing it. This does not forbid a separately authorized, isolated technical experiment.
- **BLOCKS INTEGRATION:** proof is required before dependent modules are treated as a functioning end-to-end capability.
- **BLOCKS PILOT:** no real institution/student data or users should depend on the capability before closure.
- **BLOCKS PRODUCTION:** destructive lifecycle or production operation cannot be enabled without its specific proof, even if other pilot functions are available.
- **CAN DEFER:** may remain outside the current increment with explicit scope and no pretend guarantee.

Passing document checks or this independent review is never Juan's implementation authorization.

## Final recommendation and required fixes

**PASS WITH REQUIRED FIXES — FIX ARCHITECTURE FIRST.** The modular-monolith direction is viable for continued design progression; the current affected contracts must not be implemented unchanged. No requirement to abandon the approved stack was established. This is not an unconditional pass or a vote by the personas.

| Required fix | Finding | Closure before |
| --- | --- | --- |
| Reapproval/initial multi-course identity authority and lineage | ACR-001 | Identity implementation |
| True local-versus-external revocation completion and uncertain old-call recovery | ACR-002 | Revocation semantics implementation; provider proof before integration |
| Independently durable cancellation/supersession and fail-safe replay | ACR-003 | Purge/restore implementation; execution proof before destructive production |
| Shared course/policy eligibility serialization against purge | ACR-004 | Reopen/purge implementation |
| Receipt sequence versus confirmation sequence and latest-work projections | ACR-005 | Submission implementation |
| Discoverable scoped unconfirmed-request review/recovery collection | ACR-006 | Submission/review implementation |
| Refund/reclamation wake-up or bounded admitting sweep | ACR-007 | Capture integration/pilot |
| Session-derived account or documented safe account bootstrap | ACR-008 | Identity intake implementation |
| Readable mutable request concurrency token | ACR-009 | Resolution implementation |
| Explicit teacher rejection command distinct from classification | ACR-010 | Resolution implementation |
| Independent incident observer/delivery and named owner | ACR-011 | Pilot operations |

Policy disposition also precedes affected implementation: clarify AD-5 receipt/lock-wait boundary, and decide AD-7 publication after verified deletion. Neither a reviewer nor the worker can approve those semantics for Juan. AD-12–AD-18 recommendations in DECISION-CHALLENGES remain unadopted.

## Open questions classified independently

| Item | Classification | Reason / required closure |
| --- | --- | --- |
| OQ-10 provider/account/region/budget/operator | **BLOCKS PILOT**; provider-specific integration also waits on selection | Provider-neutral domain and local tests can be designed first. Workload identity, network, object version/delete behavior and recovery guarantees cannot be accepted without the selected account/configuration. Named institution/operator owner, region/residency requirement and approved budget required before provisioning. |
| OQ-11 org/App owners and actual policies | **BLOCKS PILOT**, and live GitHub integration needs an authorized sandbox owner | Dedicated-org architecture is already AD-10; its name is not a domain-design blocker. Before integration signoff verify App administrator, private creation, base permissions, collaborators, Actions policy/budget, webhook and incident ownership. |
| OQ-12 PII/appeals/access after withdrawal or correction | **BLOCKS PILOT** for real data; unresolved authorization outcomes **BLOCK IMPLEMENTATION** of the affected access paths | A privacy schedule may be deferred while using synthetic data. Who may see historical code/grades after identity replacement is a domain authorization rule and cannot be left for frontend interpretation. Separate those two scopes; do not invent country-specific legal duties. |
| OQ-13 SLO/RPO/RTO/support | **BLOCKS PILOT**; precise numerical targets **CAN DEFER** until measured technical baseline | Capacity pools/queues require a provisional budget and an operator, not arbitrary unlimited concurrency. Pilot needs numerical objectives, recovery drill and an alert route that survives API/DB outage. No availability guarantee can be claimed without these. |

No open question is closed merely because it has an owner. None reopens approved stack, dedicated organization, withdrawal, decimal grading or pilot retention.

## Research gates and success criteria

| ID | Must demonstrate | Method | When / gate | Suggested responsible owner | Success criterion |
| --- | --- | --- | --- | --- | --- |
| RR-01 | Exact artifacts, engines/peers, driver, Fastify plugins, TypeScript/tool compatibility, licenses and known advisories | Versioned primary manifests + authorized lockfile/build/typecheck/test/SBOM experiment | **BLOCKS IMPLEMENTATION baseline freeze** | Amelia / dependency maintainer | Reproducible clean install/build on selected Node, no ignored engine/peer conflict; documented advisory/license disposition and immutable artifact identifiers. Current version existence is insufficient. |
| RR-02 | Selected PostgreSQL and pg-boss runtime grants, migration/queue/maintenance behavior, restart/restore | Real DB with exact runtime roles; empty/prior-version upgrade and crash tests | **BLOCKS INTEGRATION** of durable jobs; design of ownership/reclaim protocol blocks its implementation first | Amelia + Winston/operator | Queue lifecycle/maintenance works without unplanned runtime DDL; duplicate deliveries do not duplicate domain effects; domain outbox is recoverable after queue loss/rebuild; restore/failover respects committed evidence. |
| RR-03 | GitHub login/install identity, exact permissions, immutable-template generation, uncertain create recovery, external access revocation, webhook gaps and report association | Primary endpoint docs plus dedicated disposable sandbox; synthetic users/repos | **BLOCKS INTEGRATION**; prerequisite policies before pilot | GitHub integration owner + institution App admin | Minimal manifest succeeds; forbidden paths fail; generated content matches published template; ambiguous create is not blindly adopted; stale grant and pending invite converge to current desired access; lost events recover. |
| RR-04 | Temporal observation semantics under TTL, force-push, backlog, clock/lock delay and outage | First explicit policy decision/tabletop, then controlled clocks and provider stub/sandbox | **BLOCKS IMPLEMENTATION** of confirmation eligibility; experiment blocks integration | Academic policy owner + Winston/Amelia | Receipt/observation/persistence/confirmation/capture timestamps have distinct meanings; no post-receipt-only inference; TTL evaluated at specified time; delayed processing does not change original punctuality; out-of-order confirmations preserve intended order. |
| RR-05 | Recoverable-copy inventory, backup/replica behavior, exact-version purge, independently replayable journal, cancel/reopen races | Written provider/config evidence plus destructive tests only on synthetic data and isolated restore | **BLOCKS PRODUCTION purge** and any pilot deletion promise; safe retain-only pilot requires explicit scope/owner approval | Storage/DB operator + institutional retention owner | No verified deletion while recoverable copies exist; canceled intent never deletes valid evidence on restore; no resurrection; journal completeness verifiable. Extra 30-day backup disappearance remains unproved until documented and tested. |
| RR-06 | Archive provenance, complete declared scope, parsing limits, physical/logical accounting, orphan cleanup and capacity recovery | Hostile archive fixtures, LFS/submodules, quota concurrency, killed transfers/workers | **BLOCKS INTEGRATION** of capture and **BLOCKS PILOT** evidence reliance | Preservation owner + security reviewer | No execution/extraction escape; real bytes/entries bounded; wrong digest/object rejected; all fitting 50-student captures resume after refunds; stale/deleted-generation writes cannot become evidence or evade deletion inventory. |
| RR-07 | Host/container identities, secret separation, image/browser compatibility, resource pools, independent alerting, load and recovery objectives | Image/SBOM scans, restricted-runtime tests, failure/load/restore rehearsal | **BLOCKS PILOT**; production controls before deployment | Operator + Amelia | Separate API/worker profiles enforced with actual grants; bounded pools under burst; DB/GitHub/storage failures visible and recoverable within agreed targets; API failure still alerts an operator. |
| RR-08 | Protected tests and authoritative evaluator trust boundary | Separate threat model plus sandbox/provenance/exfiltration experiments | **CAN DEFER** to Future; blocks only future authoritative grading | Future assessment/security owner | Untrusted source cannot control evaluator policy/test authority or obtain credentials; result binds source/tests/evaluator/policy; explicit future approval before official automation. |

## Experimental evidence package required later

Each experiment must retain version/configuration identifiers, synthetic fixture IDs, attempted schedule, actual outcomes, assertions and failure evidence. Mock-only provider tests cannot close RR-03. A linter, valid JSON schema or a link to documentation cannot close concurrency, authorization or recovery experiments. No such execution was performed by this review.

## Minimum next actions

1. Juan reviews the proposed disposition of the numbered findings and adopted-decision challenges.
2. Revise only the affected architecture contracts after authorization to make those documentary changes; preserve AD status and previous evidence.
3. Independently recheck corrected counterexamples and cross-document/API consistency. A prose promise alone cannot close a protocol gap.
4. Obtain explicit authorization for any dependency/provider experiments and, separately, implementation scope.
5. Do not turn RR-08 into an MVP evaluator subsystem, or add Redis/microservices to solve the identified state-machine defects.

No proposed simplification may erase receipt/validation/classification/preservation/evaluation/publication boundaries required by AD-1–AD-9.
