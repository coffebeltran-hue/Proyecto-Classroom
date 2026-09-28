# Targeted Anti-Consensus documentary re-review

Date: 2026-09-17. Independent reviewers: Level — Claim Checker; Splinter — Consensus Challenger. This bounded re-review evaluates the repaired contracts against the original counterexamples; it does not repeat architecture discovery.

## Final targeted verdict

**PASS — DOCUMENTARY REPAIRS VERIFIED**

**11 CLOSED IN DESIGN; 0 STILL OPEN IN DESIGN; 0 new HIGH/CRITICAL regressions. No ACR is operationally closed.** This is the independent review's recommendation for Juan, not implementation authorization or adoption of proposed ADs.

Reused the original [findings](../anti-consensus/FINDINGS.md), [attack matrix](../anti-consensus/ATTACK-MATRIX.md), [gate](../anti-consensus/IMPLEMENTATION-GATE.md), historical [repair proposal](REPAIR-PROPOSAL.md), [change map](REPAIR-CHANGELOG.md) and [recorded checks](REPAIR-CHECKS.json). Reviewed only the affected contract portions. Prior structural validation is reused evidence, not a runtime test or a validation rerun in this round.

Level checked ACR-001/002/006/008/009/010 and AD-5. Splinter checked ACR-003/004/005/007/011 and AD-7. Both checked new mutation read prerequisites; the coordinator checked retained decision/research status. No material disagreement required separate persona reports.

## ACR dispositions

References below are package-relative file:line locations in the reviewed version. “Reachable” asks whether the original documentary contract gap survives, not whether future code has passed its tests.

| ACR | Original counterexample still reachable? | Repair consistent across affected artifacts? | New contradiction introduced? | Documentary disposition | Evidence | Remaining operational proof |
| --- | --- | --- | --- | --- | --- | --- |
| ACR-001 | NO | YES | NO | CLOSED IN DESIGN | DATA-MODEL.md:145; SECURITY.md:89; API.md:74; openapi.json:15912 | RP-T01: multi-course initial/reapproval authority, revoked predecessor, enrollment/role races, RLS and context reads. OQ-12 historical rights remain denied until resolved. |
| ACR-002 | NO* | YES | NO | CLOSED IN DESIGN | OPERATIONS.md:77,79; GITHUB.md:78,80; SECURITY.md:91; STATE-MACHINES.md:48; openapi.json:19681 | RP-T03 / RR-03: delayed PUT after DELETE, worker crash, invitation/collaborator cleanup and uncertain settlement. |
| ACR-003 | NO | YES | NO | CLOSED IN DESIGN | OPERATIONS.md:83,85,86,89; DATA-MODEL.md:188; STATE-MACHINES.md:142; API.md:99 | RP-T04 / RR-05: cancel/start crash boundaries, journal-success/DB-ack loss, older-DB replay, copy inventory and old-environment fencing. |
| ACR-004 | NO | YES | NO | CLOSED IN DESIGN | DATA-MODEL.md:160,186; OPERATIONS.md:47,93; STATE-MACHINES.md:99; API.md:101; openapi.json:17567 | RP-T05 / RR-05/07: reopen-first and purge-first DB barriers, migration fence, recovery and load. |
| ACR-005 | NO | YES | NO | CLOSED IN DESIGN | DATA-MODEL.md:149,151; STATE-MACHINES.md:64,81; API.md:82; openapi.json:16741 | RP-T06 / RR-04: reversed confirmation/publication order, rejected gaps, retries, same-SHA/new-key and latest projections. |
| ACR-006 | NO | YES | NO | CLOSED IN DESIGN | API.md:86,87,89; STATE-MACHINES.md:117; SECURITY.md:97; openapi.json:8502,8673 | RP-T07: fresh-session discovery of durable states, cursor/filter refresh and tenant/course negative tests. |
| ACR-007 | NO | YES | NO | CLOSED IN DESIGN | OPERATIONS.md:32,95; DATA-MODEL.md:190; DELIVERY.md:103 | RP-T09 / RR-02/06: 50-capture refund scenario, release/scan crash, double settlement, lease reclaim and fair admission. |
| ACR-008 | NO | YES | NO | CLOSED IN DESIGN | API.md:72; GITHUB.md:76; openapi.json:15830 | RP-T02: fresh-login intake, account-change race and original replay. |
| ACR-009 | NO | YES | NO | CLOSED IN DESIGN | API.md:93; DATA-MODEL.md:151; openapi.json:19923,19959,19962 | RP-T08: chained read/resolve, teacher/worker CAS races and immutable acknowledgement replay. |
| ACR-010 | NO | YES | NO | CLOSED IN DESIGN | API.md:95; STATE-MACHINES.md:121–124; openapi.json:19964,20089 | RP-T08: explicit guarded resolution variants, terminal rejection, invalid actor/SHA denial and one confirmation under concurrency. |
| ACR-011 | NO | YES | NO | CLOSED IN DESIGN | OPERATIONS.md:73,101; ARCHITECTURE.md:109; EVIDENCE.md:74; DELIVERY.md:106,112 | RP-T12 / RR-07 and OQ-10/13: named owner/route/targets and independent API/DB/worker/notice/telemetry failure drills. |

*ACR-002 does not assert late remote grants are impossible. The repaired contract prevents false completed-cleanup claims while older own grants remain unresolved, retains durable attempts and requires recurring cleanup/escalation. The original hidden-exposure/premature-completion gap is closed in design; actual remote exposure and convergence still require RR-03 evidence.

## AD-5 targeted regression

**AD-5 REPAIR: PASS**

Evidence: DATA-MODEL.md:149,153,155; API.md:78,80; STATE-MACHINES.md:66,68; openapi.json:19630; EVIDENCE.md:64,112.

The complete bounded server-bound request supplies a provisional trusted backend UTC sample before internal pool/lock/queue waits; authoritative authentication/authorization precedes durable acceptance. No surviving commit means no receipt. Internal waiting preserves the committed ingress sample. Client/commit/TCP/first-byte times confer no authority. Clock/policy ambiguity remains needs_review, not automatic late. R-01 preview/TTL remains unadopted. No blocking contradiction found; RR-04 and relevant RR-07 proof remain.

## AD-7 targeted regression

**AD-7 REPAIR: PASS**

Evidence: SECURITY.md:95; DATA-MODEL.md:158,181,182,184; API.md:103,105; STATE-MACHINES.md:144; openapi.json:15523,16624,19769.

Ordinary publication after verified deletion is blocked. Exact scoped institutional authorization permits the teacher to publish; institution authority does not become grading authority. Scope, authorizer, publisher, reason, remaining basis, student-safe explanation and audit persist. Deleted code remains unavailable with no retroactive twelve-month byte promise. Post-deletion recapture remains outside MVP. Active purge conflicts and cannot use this exception as a bypass. No blocking contradiction found; RP-T11/RR-05 and grant/publication race/replay/projection tests remain.

## Required cross-cutting checks

| Check | Result and evidence |
| --- | --- |
| New API writes have discoverable prerequisites | PASS. Identity context/current binding versions: API.md:74; openapi.json:17777,17821,17878. Cancellation: scoped Snapshot.deletion_operation → Operation read, API.md:99,113; SECURITY.md:101. Exception: current draft exposes eligible exact own-teacher grant, API.md:115; openapi.json:18811,18886. |
| Required CAS versions are obtainable | PASS. Current request row_version: API.md:89,93; openapi.json:19923,19959. Cancellation deletion_operation_version is distinct from queue/operation projection version: openapi.json:19397,19499,19606. Draft/context versions remain readable and revalidated. |
| No obvious documented lock inversion | PASS. DATA-MODEL.md:160 establishes profile/authority → classroom → policy/acceptance/current-grade → request/snapshot → deletion-operation. Quota accounting is separate institution → course, without reverse retention locking; OPERATIONS.md:93,95. |
| No PostgreSQL transaction across provider I/O | PASS. DATA-MODEL.md:160; OPERATIONS.md:77,85,86,93; API.md:95 explicitly use short transactions and external phases. |
| AD-12–18 remain PROPOSED | PASS. ARCHITECTURE-SPINE.md:92–125,146. |
| AD-17 remains conditional on RR-03 | PASS. ARCHITECTURE-SPINE.md:117–120; REPAIR-CHANGELOG.md:11; EVIDENCE.md:97. |
| R-01 remains unadopted | PASS. EVIDENCE.md:64,112; ARCHITECTURE-SPINE.md:60,105. |
| OQ-10–13 and RR-01–08 remain open | PASS. EVIDENCE.md:84–102,114; REVIEW.md:47,59. |
| No Redis, microservices or new broker introduced | PASS. ARCHITECTURE-SPINE.md:20,90; repaired protocols reuse PostgreSQL/pg-boss; independent monitoring is operational detection, not a broker. |
| Implementation remains unauthorized | PASS. ARCHITECTURE-SPINE.md:146; REVIEW.md:59. |

## New blocking regressions

None found within the requested scope. No additional improvements or speculative risks were promoted into findings. Original severity counts and reviewer disagreements remain historical evidence, unchanged; documentary closure does not erase them.

## Remaining proofs and implementation gate

The table above preserves each ACR's runtime tests. Existing gates remain: RR-01 reproducible dependency baseline; RR-02 queue/DB restricted-role and recovery behavior; RR-03 real GitHub integration/access/template proof; RR-04 temporal eligibility/clock/policy proof; RR-05 recoverable-copy deletion and journal recovery; RR-06 hostile archives/quota/capture proof; RR-07 hosting/alerts/load/recovery. RR-08 is Future only. OQ-10–13 remain open. R-01 must be dispositioned before its dependent confirmation eligibility is implemented; OQ-12 continues to gate unresolved historical-access paths.

**Recommendation:** leave this bounded architecture repair review and move next to Juan's explicit authorization of a scoped RR-01 dependency-baseline experiment and implementation preparation. This report does not adopt AD-12–18, authorize that experiment, or authorize application implementation. Subsequent integration/pilot/destructive-operation gates retain their existing proofs and approvals.

## Resource use and preservation

Exactly two independent reviewers, one targeted pass each; no Wildcard/Killjoy, broad review, web research, dependency installation, build, migration, runtime/provider experiment or provisioning. Exact credit consumption and a hard credit cap are not exposed by this environment, so no claim of staying within 100/120 credits is made.

Only this report is created. Existing architecture, OpenAPI, memories, repair inputs and original Anti-Consensus files are preserved. The recorded structural checks were reused rather than rerun. Stop under Juan's early-stop rule: all 11 counterexamples closed in design and both adopted policy repairs pass.

