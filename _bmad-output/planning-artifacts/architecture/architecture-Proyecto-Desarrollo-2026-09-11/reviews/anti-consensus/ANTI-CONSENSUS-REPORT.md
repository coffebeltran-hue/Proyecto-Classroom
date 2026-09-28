# Anti-Consensus Club — independent architecture review

Completed 2026-09-17 for Juan. Scope: the 19 original inputs fingerprinted in [INPUT-MANIFEST.json](INPUT-MANIFEST.json), including the complete architecture package, all 94 OpenAPI operations/101 schemas and documentary helpers. This is a design review, not a running-system penetration test, benchmark or implementation authorization.

## A. Assessment

**PASS WITH REQUIRED FIXES**

**Recommendation: FIX ARCHITECTURE FIRST.** The approved architectural direction can continue, but the affected identity, submission and destructive-recovery contracts must be repaired before their implementation. The result does not mean the current package can be implemented unchanged. No finding established that the approved stack must be replaced or that Redis/microservices are necessary.

This recommendation belongs to the independent review for Juan's later decision. AD-1–AD-11 remain adopted; AD-12–AD-18 remain proposed. No app code, migrations, GitHub resources or cloud infrastructure were created. Original architecture documents and their memlogs were not edited.

## B. Severity counts

| Severity | Distinct findings |
| --- | ---: |
| Critical | 0 |
| High | 6 |
| Medium | 5 |
| Low | 0 |
| Info | 0 |
| **Total** | **11** |

Counts refer to the canonical [FINDINGS.md](FINDINGS.md) register, not overlapping reviewer observations. Absence of a Critical finding is not proof of security. Conditional authorization/race schedules are labeled as such; no executed exploitation is claimed.

## C. Top 10 risks

Ordered by severity and potential impact; likelihood/defenses remain in each full finding.

1. **ACR-001 HIGH — identity reapproval scope:** approving a previously revoked profile through the ordinary course path may bypass correction-equivalent authority over other courses.
2. **ACR-002 HIGH — late external grant:** an already-issued GitHub grant can finish after a later revoke, despite local generation checks; downloaded private code cannot be recalled.
3. **ACR-003 HIGH — lost cancellation on restore:** independent tombstone replay lacks the cancellation fact allowed after export, risking incorrect deletion or unresolved quarantine.
4. **ACR-004 HIGH — reopen/purge ordering:** course reopen and snapshot purge have no concrete shared serialization protocol despite the required retention invariant.
5. **ACR-005 HIGH — inverted latest submission:** asynchronous confirmation order can make older student intent the largest/newest revision after a later revision was graded.
6. **ACR-006 HIGH — stranded review requests:** durable unconfirmed requests cannot be enumerated through the canonical API; a count and UUID-only GET do not provide recovery.
7. **ACR-007 MEDIUM — capacity refund liveness:** fitting captures can remain quota-blocked after reservations release because re-admission triggers are incomplete. Wildcard retains HIGH risk judgment; final rating uses demonstrated recoverable delay.
8. **ACR-008 MEDIUM — identity bootstrap:** first linking request requires a local GitHub account UUID that no preceding student response supplies.
9. **ACR-009 MEDIUM — resolution CAS:** current request read omits the concurrency token required by resolution input.
10. **ACR-010 MEDIUM — missing rejection command:** teacher rejection is a state transition but not expressible distinctly from academic classification in the API.

The remaining **ACR-011 MEDIUM** concerns incident alerts delivered only through the same failed application/database. It blocks pilot operations, not domain design.

## D. Adopted decisions questioned

- **AD-5 — receipt boundary clarification:** post-lock timestamp sampling can put pre-deadline backend arrival after the cutoff. The approved text does not unambiguously designate socket arrival as receipt. Juan must decide whether the protected processing delay includes lock waiting. Any deliberate narrowing of his intended protection is a **CHALLENGE TO ADOPTED DECISION**, not an implementation detail to approve silently.
- **AD-7 — CHALLENGE TO ADOPTED DECISION:** publishing after verified content deletion cannot create another twelve months of byte preservation. The proposed acknowledgement is a disclosed but unapproved policy exception. Decide whether to forbid that edge or explicitly permit publication with unavailable historical evidence and a qualified retention obligation. Recapturing the SHA, if later allowed, would be new provenance, not restoration of the deleted capture.

These two normative matters are not counted as additional defect findings. All adopted decisions were attacked individually in [DECISION-CHALLENGES.md](DECISION-CHALLENGES.md). Identity/ordering/recovery defects can be repaired without revoking AD-3/4/6/7/9/10/11.

## E. Proposed decisions: review recommendations only

| Proposal | Disposition |
| --- | --- |
| AD-12 tenant ownership | MODIFY |
| AD-13 durable effects | MODIFY |
| AD-14 evidence/states | MODIFY |
| AD-15 publication/purge | MODIFY |
| AD-16 bounded evidence | MODIFY |
| AD-17 frozen templates | ACCEPT, conditional on RR-03 proof; **not adopted** |
| AD-18 identity lineage | MODIFY |

Detailed problem solved, gaps, complexity and required evidence are in the decision report. No proposal is accepted because its author recommended it; AD-17's before/after content check was credited as a real fail-closed defense, with practical reproducibility still unproved.

## F. Blockers by stage

| Stage | Required closure |
| --- | --- |
| **Implementation of affected contracts** | ACR-001–006 and ACR-008–010; AD-5/AD-7 policy dispositions where applicable; explicit user authorization; RR-01 before freezing technical baseline |
| **Integration** | ACR-002 external convergence proof; ACR-007 capacity recovery; RR-02 real PostgreSQL/pg-boss grants/recovery; RR-03 GitHub sandbox; RR-04 submission timing proof; RR-06 hostile capture/concurrency |
| **Pilot** | OQ-10–13 operational/institutional closure as scoped in gate; ACR-011 independent alerting; actual org/App policies; RR-07 load/recovery/runtime controls; no unresolved relevant authorization/evidence defects |
| **Production/destructive lifecycle** | RR-05 recoverable-copy/deletion journal proof; executed ACR-003/004 crash/replay races; retention/purge controls and authorized release. Extra 30-day backup disappearance remains unverified |
| **Future only** | RR-08 protected authoritative evaluator; must not contaminate MVP or become a trust bypass |

See [IMPLEMENTATION-GATE.md](IMPLEMENTATION-GATE.md) for item-by-item OQ/RR owners, method, success criteria and local gate scope. A blocked destructive subsystem does not logically forbid separately authorized reversible experiments; this review itself authorizes neither.

## G. Experimental evidence still needed

No runtime proof was produced by this review. Required later evidence includes: exact dependency install/typecheck/build; real runtime DB roles/RLS/FKs and pg-boss migration/maintenance; reversed completion and stale-CAS tests; delayed external grant/revoke and invitation cleanup; template drift/create-timeout sandbox; capacity refund/lease/crash schedules; hostile archives and checksum/object-identity failure; canceled tombstone and reopen/purge restore tests; provider recoverable-version/backups inventory; independent incident alert and 50-student deadline/load rehearsal.

Documentary permission checks corroborated template generation's Administration write + Contents read, collaborator Administration write and membership Members read. No Contents/Workflows write escalation was justified. Earlier primary-source checks corroborated the cited Node/pg-boss/Vitest releases; that does not prove combined compatibility or claim those patches remain latest. Source references and limits are retained in reviewer notes and attack matrix.

## H. Recovery, independence and disagreement

This review resumed the interrupted work. At the latest recovery point Wildcard's complete notes survived; Level/Splinter findings survived as substantive messages and were completed by targeted checks; Killjoy's missing independent review was then completed. The original manifest and preliminary attack matrix were reused. No saved first-pass finding was silently discarded or rerun from zero. [RECOVERY.md](RECOVERY.md) records earlier and later checkpoints.

Four independent first-pass contexts contributed: [Wildcard](WILDCARD-NOTES.md), [Level](LEVEL-NOTES.md), [Splinter](SPLINTER-NOTES.md), [Killjoy](KILLJOY-NOTES.md). Their [cross-review files](WILDCARD-CROSS.md), [Level rebuttal](LEVEL-CROSS.md), [Splinter rebuttal](SPLINTER-CROSS.md) and [Killjoy rebuttal](KILLJOY-CROSS.md) preserve scope, timing and objections. Some early rebuttals predated another notes file; final consolidation includes all four. This is an evidence-based synthesis, not a vote or manufactured consensus.

The strongest objections to our own findings were applied: capture/purge bypass S-03 lacked reachable preconditions and was not counted; quarantine prevents asserting inevitable destructive loss for ACR-003; no proven cross-tenant takeover is claimed for ACR-001; grade references do not automatically retarget under ACR-005; manual retry mitigates ACR-007. Killjoy withdrew initial HIGH for ACR-008. Wildcard's HIGH assessment of quota risk remains in the record rather than being erased.

## Deliverables and validation limits

- [Full findings](FINDINGS.md): stable ACR-001–011 with schedules, source locations, impact, likelihood, detectability, recommendations, gates and required proof.
- [Attack matrix](ATTACK-MATRIX.md): 52 attack families, failure matrix, 50-student load reasoning, permission reconstruction and effect classification.
- [Decision challenges](DECISION-CHALLENGES.md): individual evaluation of all 18 ADs, no approval changes.
- [Implementation gate](IMPLEMENTATION-GATE.md): required repairs plus OQ-10–13 and RR-01–08 dispositions.
- [Input manifest](INPUT-MANIFEST.json) and final [verification report](REVIEW-CHECKS.json): original hashes, local links and count/coverage checks.

Structural checks verify the documents, not their implementation. Required next action is **FIX ARCHITECTURE FIRST**, followed by a targeted independent recheck and Juan's explicit decision on any implementation scope.
