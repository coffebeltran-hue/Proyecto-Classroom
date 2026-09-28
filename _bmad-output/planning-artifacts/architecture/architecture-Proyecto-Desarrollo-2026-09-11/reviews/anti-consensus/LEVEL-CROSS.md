# Level — cross-review

2026-09-17. Read Wildcard and Splinter notes, DECISION-CHALLENGES draft and WILDCARD-CROSS; Killjoy notes were not yet present at the check. This is claim calibration, no vote or authorization. Original documents and independent notes unchanged.

## Strongest defensible claims and gates

| Item | Level assessment | Narrow gate |
| --- | --- | --- |
| W-01 reversed confirmation order | HIGH supported: the actual algorithm allocates revision on confirmation, whereas user intent arrived earlier. Fixed grade references prevent grade retargeting, so avoid calling this automatic official-grade corruption. Receipt order and confirmation order can coexist if explicitly named; request-sequence allocation is one simple repair. | Submission ordering and current-grade projection contract before implementing those features. |
| W-02 / S-04 refund wake-up | MEDIUM is the best demonstrated severity: capacity becomes available but documented automation does not necessarily wake blocked captures. Manual retry and alerts mitigate this; no bounded human response or successful automatic refund sweep is established. HIGH is a defensible contingent preservation-risk judgment but should be retained as dissent, not treated as proved loss of evidence. | Preservation integration acceptance: bounded automatic wake/sweep after every effective release, including reclaimed reservations. No global implementation veto. |
| S-01 cancellation after exported intent | HIGH supported for recovery protocol. The precise missing fact is durable cancellation/supersession independent of restored DB; quarantine is explicitly allowed and can prevent destructive loss, so do not state inevitable deletion. Mandatory quarantine with no way to recover valid cancellation can still produce serious evidence unavailability. | Before destructive purge/recovery implementation; reversible modules are separable if separately authorized. |
| S-02 reopen versus purge | HIGH supported as missing atomic ordering of course eligibility and claim. OPS:43 requires suspension, so this is not permission to implement stale deletion; it is an underdetermined algorithm. Shared lock is not mandatory: validated generation or serializable conflict/retry can establish the same property. | Before concurrent reopen/purge implementation. Define claim winning point and reopen response when purge already won. |
| S-03 capture/purge | Correctly not promoted: reachable capture admission against an already-purge-eligible snapshot has not been established. Keep as invariant/test requirement rather than counted HIGH. | Capture and purge transition test matrix, not independent blocker on current evidence. |
| W-03 and LV-02 | Both MEDIUM and concrete: missing rejection action and missing read-side CAS version are separate fields/semantics on one resolution feature. They may be one consolidated finding with two independently testable acceptance criteria; do not count the same consequence twice without explaining distinct repairs. | Before completing submission-review API/UI. |

## AD-5: expose the unresolved academic boundary, not a proven violation of an unambiguous timestamp definition

ARCHITECTURE-SPINE.md:59 protects against processing delay determining lateness; :60 requires backend UTC received time persisted before acknowledgement. DATA-MODEL.md:147 explicitly samples after locks. Neither source precisely defines network arrival as the adopted receipt instant. The predeadline arrival/postdeadline lock-release schedule is real; its policy classification is unresolved. Retain a prominent CHALLENGE TO ADOPTED DECISION heading if needed to request Juan's decision, but explain that the challenge concerns whether the proposed boundary narrows adopted intent, not proof the approved text already selected raw HTTP-arrival time.

Best classification is HIGH policy/contract ambiguity if the final register counts it: normal backend waiting can change the academic result under the proposed rule. Gate only receipt-time/deadline semantics before intake implementation. Candidate repairs must address trusted time, persistence failure, retry, and concurrent effective-deadline changes together. Do not prescribe ingress timestamps alone as a finished solution: they can conflict with policy versions selected after locks unless the temporal policy is specified. Wildcard's boundary distinction should remain visible in the final disagreement record.

## AD-7: narrow the challenge to intentionally permitting a NEW publication after verified byte deletion

ARCHITECTURE-SPINE.md:70 promises later publication extends referenced evidence by at least 12 months; DATA-MODEL.md:149 explicitly permits publication after verified deletion with acknowledgement. Acknowledgement is not a retention extension and is not Juan's approval of an exception. The draft's challenge is justified and requires an explicit disposition; preserve the important counterpoint that AD-6 already allows confirmation with failed/unavailable preservation, so do not broaden this into a claim that any grade without an available snapshot violates policy.

The demonstrated defect is an unauthorized policy exception/contradiction, not a new deletion exploit: bytes were legitimately deleted before the operation. MEDIUM is supportable for the contract inconsistency itself; HIGH only if asserting the resulting official publication carries a materially false retention commitment. Gate the post-purge publication rule and its UI/API before implementing that branch, not all grading or preservation. Prohibiting that operation or explicitly authorizing truthful unavailable-evidence publication are policy alternatives for Juan; retaining metadata cannot be presented as restoring source bytes.

## Self-challenge retained

LV-03 is an explicit-equivalence gap, not an established identity exploit: a reasonable builder might treat all reactivation as correction under global invariants. Fixing that interpretation in the contract is sufficient; evidence does not warrant CRITICAL. LV-04 also must not imply no external reconciliation exists: the actual counterexample is an already-issued own grant completing after newer revoke/read. Existing convergence mitigates duration, but the assertion that an old generation cannot grant remains too strong without unresolved-call accounting and truthful pending/unknown status.

## Voice for Juan

No llamaría pérdida demostrada de evidencia a una captura que todavía puede reintentarse, pero sí exigiría que la recuperación automática tenga una condición y un plazo comprobables. Las dos fronteras que necesitan tu decisión explícita son cuándo cuenta como recibida una entrega y qué promete una nueva publicación si su código ya fue eliminado legítimamente.
