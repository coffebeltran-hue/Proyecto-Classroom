# Wildcard 🃏 — independent recovered notes

Final independent pass, 2026-09-15. These are reviewer-local W identifiers for integration into ACR registry, not votes or consensus. No source documents, application code or infrastructure changed.

## Coverage and reconstruction

Read full user brief; complete .memlog, README, ARCHITECTURE-SPINE, ARCHITECTURE, DATA-MODEL, STATE-MACHINES, API, GITHUB, SECURITY, OPERATIONS, DELIVERY, EVIDENCE, REVIEW, DISCUSSION, PREPARATION-CHECKS and STACK-RESEARCH. Parsed entire OpenAPI: all 94 operation authorization/body/parameter/success-response contracts and all 101 schemas inspected in compact batches, including shared error/header/security definitions. Large initial outputs truncated and the missing sections were reread in smaller batches. Optional document-generator scripts were not treated as architectural evidence. No runtime correctness is asserted.

System reconstructed: PostgreSQL academic authority; GitHub owns mutable source; explicit durable request precedes asynchronous confirmation; snapshots follow confirmation with independent failure; grade events require teacher; queues/effects at least once; distinct runtime profiles; proposed composite FK/RLS and external reconciliation. AD1–11 remain adopted; AD12–18 remain proposals.

## W-01 — HIGH — revision sequence reverses student intent when confirmations arrive out of order

Category: submission ordering / academic UX. Related AD-2, AD-4, AD-5, proposed AD-14. Files: DATA-MODEL.md:42,147,153; STATE-MACHINES.md:81; openapi.json:16049 (CurrentGrade),17665 (Submission).

Preconditions: one acceptance, two legitimate explicit Submit commands with distinct keys/SHA, asynchronous validation; earlier request requires review or slower GitHub work. Events: request A received 23:58, SHA A; request B received 23:59, SHA B, intentionally superseding A. B confirms first and allocates revision 1. Teacher evaluates/publishes B. A later confirms after admissible review and allocates revision 2 under DATA-MODEL:147. Expected: student's latest submitted intent remains B; validating older A cannot manufacture a later student resubmission. Problem: documented allocation makes A largest revision; revision DESC index and CurrentGrade.latest_submission_revision/newer_submission_exists encourage treating A as newer than evaluated B. Even if builders choose receipt order for latest, the architecture then exposes contradictory revision and chronological ordering without defining it.

Impact: wrong latest-work selection, misleading newer-submission warning, potentially grading older work as resubmitted; immutable grade references prevent automatic grade corruption but do not repair ordering. Likelihood medium (normal delayed validation/review); detectability low without reversed-completion test, audit receipt times reveal it.

Existing defenses considered: request uniqueness prevents duplicate confirmation, acceptance lock prevents equal revision numbers, fixed evaluation prevents retargeting. None defines receipt-order revisions. Recommendation: allocate immutable request sequence during the already-locked intake; confirmed Submission inherits it (gaps allowed for rejected requests). Define latest confirmed as max receipt sequence and separately expose newest pending request. Alternatively preserve confirmation sequence but give it that name and a distinct receipt-order field; do not serialize all validation behind a permanently needs_review request.

Blocks implementation of submission ordering/projections until semantics fixed; does not require revoking AD-2/4/5. Proof: deterministic A-before-B intake, B-before-A confirmation, publication B before A resolution; B remains latest submitted intent and no false new-intent indicator; retries preserve numbers. Include same-SHA/new-key deliberate intent and rejected sequence gaps.

## W-02 — HIGH — quota reservation release has no wake-up contract for blocked captures

Category: preservation liveness / quotas. Related AD-6/7, proposed AD-16. Files: OPERATIONS.md:25,32,36; DATA-MODEL.md quota_accounts/quota_reservations catalog; DELIVERY.md operational concurrency tests.

Preconditions: 2 GiB free course quota, 50 accepted captures each actual archive 1 MiB, max reservation 100 MiB, enough workers to attempt reservations before uploads finish; institution quota not limiting. Events: first 20 reserve 2,000 MiB leaving 48 MiB; other 30 enter blocked_by_quota. First 20 complete, charge 20 MiB and release 1,980 MiB. There is no quota policy change or deletion. Expected: remaining captures resume using newly available capacity and all 50 fit. Problem: OPS:32 names resume on quota change/deletion; OPS:25 maps only QuotaPolicyChanged to unblock captures; OPS:36 releases unused bytes without wake-up. Following the written event contract leaves 30 blocked despite 2,028 MiB free.

Impact: unnecessary preservation delay, manual work, avoidable source_unavailable if GitHub access disappears before manual recovery. Severity HIGH for exposure of academic evidence, not a claim 30 snapshots must inevitably be permanently lost. Likelihood medium under concurrent deadline bursts and conservative reservations. Detectability medium via blocked-count/free-capacity mismatch; current alarms show blockage but cannot recover it.

Existing defenses considered: institution/course locks correctly bound committed+reserved bytes; no oversubscription claimed. Periodic scan_quota/holds/deletions is described as alerts, not an explicit wake-up mechanism; authorized retry endpoint allows recovery, reducing inevitability but not fixing liveness. Recommendation: after every effective capacity release (successful smaller capture, terminal attempt, expired/reconciled reservation, deletion, limit increase), durably enqueue a coalesced quota-capacity-available wake-up; bounded fair dispatcher reattempts blocked captures. Periodic reconciliation must also rediscover missed wakeups. This is finite state-change-triggered recovery, compatible with no infinite deterministic retry.

Blocks capture implementation contract; no adopted decision needs revocation. Proof: 50/2GiB scenario completes all fitting archives without policy edit/operator retry; kill between release and dispatch; stale worker cannot double-charge/release; non-fitting archives remain visibly blocked without hot loop.

## W-03 — MEDIUM — teacher rejection exists in state machine but cannot be expressed in resolution request

Category: API/state contract. Related AD-5, proposed AD-14. Files: STATE-MACHINES.md:61; API.md:29; openapi.json:15770 (ResolutionInput), POST /submission-requests/{id}/resolutions.

Preconditions: valid identity and existing SHA, but insufficient historical evidence; request in needs_review. Teacher elects to reject the unsupported request. Events: UI needs to issue the documented teacher rejection transition. ResolutionInput only accepts classification unresolved/on_time/late/exempt/not_applicable, reason, evidence_reference, expected_version and confirm=true; additional properties false. No rejection action or dedicated route exists. Expected: explicit audited teacher rejection. Problem: legal payload cannot distinguish rejection from unresolved or classification change; encoding rejection in reason or classification conflates deliberately separate axes.

Impact: stranded requests or implementation-specific inference; bounded operational/API inconsistency. Likelihood high whenever teacher rejects this case. Detectability high at UI/API integration, structural OpenAPI checks miss it. Existing guards prevent arbitrary state PATCH, appropriately; they make a proper explicit command necessary. Recommendation: explicit resolution decision enum (confirm_exception/reject/reclassify as appropriate), state-dependent classification and evidence checks, or dedicated rejection command; retain immutable outcome and original receipt. Blocks completion of submission review feature; not overall foundational work. Proof: reject needs_review with legal schema, persist audited terminal state, same-key replay, stale version conflict, and prevent reclassification alone from bypassing content/identity validation.

## Attacks that did not yield a finding

Temporal: a preview before receipt then force-push before receipt does NOT contradict the written proposed rule: STATE-MACHINES:68 explicitly chooses historical branch observation within TTL, not continuous availability. This is a decision Juan must judge (AD-14 MODIFY to make TTL evaluated at received_at explicit), not proof the system falsely guarantees current branch membership. A post-receipt-only observation is explicitly needs_review. Exact-deadline equality and DB lock-time sampling are explicit. Arbitrary client timestamp, changing key payload and head substitution are rejected. A late snapshot is not temporal proof.

Provisioning: deterministic name alone is explicitly insufficient; ambiguous provenance enters needs_operator; no random retry suffix and no automatic destructive compensator. This sacrifices liveness safely. Do not report duplicate creation as proven without defeating those checks. Template TOCTOU is caught by generated-tree comparison before access; mismatch quarantine is a real defense. RR-03 still must prove practical reproducibility and adoption evidence.

Permissions primary verification (2026-09-15): GitHub's [template generation documentation](https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template) lists installation-token support and Administration write plus Contents read; documented body fields contain no commit selector. GITHUB.md:25,34 are correct for this operation. Do not demand Contents write or Workflows write just because generated templates contain workflows; a separate write operation must justify that escalation. No sandbox installed and no provider request executed.

## Useful simpler alternatives for Juan (not adopted changes)

1. Keep the existing acceptance intake lock and allocate request order there (W-01); no ordered distributed queue is required.
2. Treat quota wait as durable capacity waiting, not a deterministic bad archive. One coalesced wake-up per quota account plus periodic bounded recovery solves W-02 without a broker or new microservice.
3. For pilot templates, use manually published same-org versioned repositories and require default branch/content-tree preflight. Preserve generated-tree verification. Avoid building an automatic template-copy engine that expands Contents/Workflows permissions before RR-03 shows it is needed.
4. For ambiguous lost-create outcomes, retain explicit operator-assisted provenance verification. If frequent, improve correlation evidence/organization creation policy before constructing a generic saga framework. Document operator inspection inputs and completion command; do not weaken adoption to matching names.
5. Preserve separate receipt/validation/classification/snapshot axes; removing those as overengineering would erase approved semantics. Reduce operational machinery and default choices, not evidence distinctions.

No new CHALLENGE TO ADOPTED DECISION is necessary for W-01–03: each can be repaired while preserving AD-1–11. Remaining GitHub capability proofs are integration gates, not unverified security findings. Final judgment belongs to Juan; these notes do not authorize implementation.
