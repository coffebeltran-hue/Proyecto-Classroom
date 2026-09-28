# Splinter — targeted completion notes

This completes the interrupted independent challenger pass, using the surviving full-package review and targeted source checks. No application, infrastructure, or original architecture files were changed. Items below are candidate records for the coordinator to assign final stable ACR IDs; they are not votes or an approval of proposals. The written defenses are credited; implementation defects are not asserted as experimentally demonstrated.

## S-01 — HIGH — exported deletion intent cannot express subsequently permitted cancellation

- Category / related decisions: recovery and evidence retention; AD-7 implementation contract and proposed AD-15. Files: OPERATIONS.md:47–49; DATA-MODEL.md:68–69; STATE-MACHINES.md:99; EVIDENCE.md:58.
- Description: a tombstone is exported before destruction; cancellation is permitted before irreversible deletion with verified bytes. The independently restored record has no documented cancellation/supersession protocol. This is a missing recovery contract, not evidence that all restores necessarily delete canceled objects.
- Preconditions: exported purge intent; bytes still present; authorized operator cancels before destructive effect; cancellation and any subsequent hold lie beyond the restored DB backup.
- Schedule: (1) claim generation g and export its tombstone; (2) cancel g after verifying bytes; (3) add a legitimate preservation obligation after cancellation; (4) lose current DB; (5) restore older DB and current independent journal. Journal carries g, but no specified independently durable cancellation or superseding obligation. The restore instruction permits purge/quarantine followed by generation reconciliation, without specifying how to recover the missing cancellation.
- Expected: cancellation remains effective after recovery and legitimate preserved content remains usable. Problem: destructive replay can erase valid evidence; conservative quarantine instead leaves unresolved availability. “Reconcile all generations” does not supply a lost fact.
- Impact / likelihood / detectability: irreversible loss if replay deletes, otherwise recoverable outage; low frequency (cancel + restore) but severe; low detectability when journal appears authoritative. HIGH is the conservative severity for the unresolved recovery protocol; do not claim inevitable CRITICAL loss because quarantine is explicitly allowed.
- Existing defenses: export-before-delete, independently restored journal, isolated restore, verification before access, and restricted cancellation are appropriate. None defines durable cancellation ordering.
- Recommendation: either forbid cancellation after durable export, or append ordered generation-scoped cancellation/supersession records to the same independent journal before acknowledging cancellation. Replayer must distinguish prepared intent, irreversible-started, verified and canceled; unresolved history must quarantine rather than delete.
- Blocks implementation: yes for destructive purge/recovery protocol; independent reversible modules can proceed only under a separately authorized scope.
- Proof: cancel after export at each crash point; restore DB predating cancel with current journal; prove canceled object remains and cannot be deleted by replay; prove uncanceled deleted object never becomes accessible. Include journal failure during cancellation.

## S-02 — HIGH — reopening retention requires an unspecified shared serialization point

- Category / decisions: concurrency and retention; AD-7 promise, proposed AD-15. Files: OPERATIONS.md:25,43,47; DATA-MODEL.md:79; STATE-MACHINES.md:99; openapi.json:3577 (reopen route).
- Description: reopening expressly suspends eligibility, while its retention job is asynchronous. Purge explicitly locks snapshot and checks hold/latest publication; no shared course generation/lock is specified. This is an algorithm gap against an explicit required invariant, not permission to ignore that invariant.
- Preconditions: expired snapshot pending purge; reopen command and purge claim execute concurrently; retention recalculation delayed.
- Schedule: (1) purge reads old course/eligibility; (2) reopen commits course projection and outbox event; (3) purge locks only snapshot and claims using old eligibility; (4) deletion runs before close_course_retention. A fresh course read without locking also permits read-before-reopen/claim-after-reopen.
- Expected: a reopen committed before purge claim suspends that claim. Problem: specified snapshot-only serialization cannot establish that order. Conversely, if purge already won, reopen must disclose unavailable or in-flight evidence rather than imply it is preserved.
- Impact / likelihood / detectability: evidence loss from a reopened course; medium under operational reopen near expiry; low before deletion, detectable afterward from audit ordering.
- Existing defenses: OPS:43 explicitly forbids the outcome, and OPS:47 rejects new retention. Those are required predicates but do not specify how course-level change participates atomically. Hold/publication fencing works for its named participants and is not bypassed in this schedule.
- Recommendation: define course retention generation/lock shared by reopen, policy migration and purge claim; deterministic lock order; commit course eligibility fence synchronously, bulk projections afterward. Define outcome when destruction already started.
- Blocks implementation: yes for reopen/purge concurrency contract. This can repair AD-7 without revoking it.
- Proof: barrier test at course read/snapshot lock/reopen commit/claim commit; every successful post-reopen claim must reject, or establish an explicit earlier winning purge. Repeat across policy migration and multiple snapshots.

## S-03 — NOT PROMOTED — capture generation versus deletion generation

Sources: OPERATIONS.md:15–16,36–37,47; DATA-MODEL.md:63,68; API.md:41; STATE-MACHINES.md:85–99. Capture has lease/generation fencing; purge has a different generation. A unified transition rule would improve clarity. However, the identified schedule requires admitting capture/retry against evidence already available or purge-eligible. The text does not establish that admission is allowed, and one logical snapshot per submission plus restricted retry states are relevant defenses. Do not report a proven bypass or standalone HIGH finding without establishing a reachable admission path. Verification requirement: define eligibility for purge while capture is pending/failed and reject capture commit/retry when a deletion fence has won. Test late upload/adoption against each deletion phase. This is currently a targeted contract/test question, not a counted finding.

## S-04 — MEDIUM — capacity release has no explicit blocked-capture wake-up

- Category / decisions: liveness/quotas; AD-6/7 and proposed AD-16. Files: OPERATIONS.md:25,32,36–37,71–73; DATA-MODEL.md:65–66; ARCHITECTURE-SPINE.md:70.
- Preconditions: 2 GiB free logical quota, institution nonbinding, 50 captures of 1 MiB each, reservation maximum 100 MiB, enough concurrency to reserve before completion.
- Schedule: 20 reserve 2,000 MiB; 30 block with 48 MiB free; 20 complete using 20 MiB and refund 1,980 MiB; 2,028 MiB now free. No deletion or configured quota change occurs.
- Expected: remaining 30 eventually resume. Problem: documented triggers are quota change/deletion; named event is QuotaPolicyChanged; ordinary refund/lease reclamation has no explicit wake-up. If “quota change” is intended to include free-capacity changes, specify that durable event rather than assuming it.
- Impact / likelihood / detectability: unnecessary delay and staff intervention; medium likelihood at bursts; high detectability from blocked counts plus free capacity. Source disappearance could worsen impact but is an additional contingency, so MEDIUM rather than automatic HIGH.
- Defenses: institution→course locking prevents logical oversubscription; manual retry/alert allows recovery; periodic scan_quota exists but its unblock-on-refund semantics are not specified. Do not assert permanent loss or absence of all recovery.
- Recommendation: coalesced durable capacity-available trigger after effective refund, reservation reclamation, deletion or limit increase; periodic reconciliation rediscovering missed signals; bounded fair admission, not endless deterministic retries.
- Blocks implementation: no global gate; required preservation acceptance criterion before integration readiness.
- Proof: run above schedule with no staff command/limit change/delete; all 50 captures finish within a defined recovery bound; replay release twice and expire a lease without over-admission.

Cross-review: S-04 duplicates WILDCARD-NOTES W-02; merge into one final ACR item, preserving the severity disagreement and manual-recovery defense. S-01 and S-02 strengthen AT-39 and AT-37 respectively. No claim that adopted retention policy must be revoked: these attack mechanisms proposed to enforce it.
