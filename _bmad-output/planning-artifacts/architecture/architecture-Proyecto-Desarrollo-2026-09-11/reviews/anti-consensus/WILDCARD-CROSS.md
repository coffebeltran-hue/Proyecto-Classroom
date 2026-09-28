# Wildcard — cross-review only

2026-09-17. Original WILDCARD-NOTES.md remains authoritative and unchanged. Read SPLINTER-NOTES.md; LEVEL-NOTES.md was unavailable at this check. These are independent dispositions, not votes, consensus, adoption, or implementation authorization.

## W-02 / S-04: same defect, severity disagreement retained

Accept Splinter's duplicate identification and explicit manual-recovery defense. Reject treating `scan_quota` as an established automatic liveness defense: its refund-to-unblock semantics remain unspecified. Manual retry reduces inevitability and can reduce exposure if operational response is bounded; no such bound was supplied. I retain HIGH for the preservation contract because a normal concurrent capture burst leaves confirmed evidence awaiting an unspecified human response while the external source remains mutable. Source disappearance is a contingency, so I do not claim inevitable loss; Splinter's MEDIUM characterization correctly describes the demonstrated immediate outcome of delay and staff intervention. Record both rationales, one finding. My gate remains local to capture integration, not a global implementation veto. A documented bounded automatic sweep that admits blocked captures after all capacity releases could satisfy the remedy without a new event type. The existing alert-only scan does not yet establish that remedy.

## S-01: accept HIGH, narrow the claim to lost cancellation knowledge

Accept: generation reconciliation cannot reconstruct a cancellation omitted from the independently durable journal. The strongest counter-defense is allowed quarantine; it prevents destructive replay if mandatory for ambiguous histories, but does not recover the canceled object's legitimate usability. Thus HIGH is supportable for the unresolved destructive recovery protocol, not proof every restore loses evidence. Favor generation-scoped independently durable cancellation before acknowledgement, with ambiguous replay quarantined; forbidding cancellation after export is a policy alternative Juan must select, not an implied technical necessity. Include failure between journal append and DB cancellation acknowledgement, and repeated replay, in the proof.

## S-02: accept HIGH as a serialization gap, not a demonstrated implementation bypass

Accept: an asynchronous reopen event plus snapshot lock cannot order a synchronous course-level eligibility change unless both participants share a serialization mechanism. OPS's invariant is a real defense requirement, not an algorithm proving it. Do not insist on one specific lock implementation: shared course generation with atomic validation, equivalent serializable transaction/conflict retry, or a common lock can establish the order. Define purge's winning linearization point and disclose an already-won destructive claim on reopen. Require the barrier schedule; do not promote this into a challenge to AD-7.

## Coordinator lead: AD-5 versus DATA-MODEL:147

Rechecked ARCHITECTURE-SPINE:57–60 and DATA-MODEL:147. AD-5 prevents processing delay determining lateness, requires backend UTC received time durably persisted before acknowledgement, and makes receipt at/before deadline candidate on-time. DATA-MODEL explicitly samples after required locks and refuses retrospective removal of pre-intake lock time. Therefore a backend-arrival-before-deadline / lock-release-after-deadline schedule yields a late receipt under the proposal.

My original pass explicitly credited lock-time sampling as written; I preserve that finding history. This is a real semantic tension worth elevating now, but I classify it first as **proposed receipt-boundary clarification**, not an automatic **CHALLENGE TO ADOPTED DECISION**. AD-5 does not precisely locate backend receipt relative to intake locks; it clearly excludes later validation delay but leaves this boundary insufficiently explicit. Ask Juan to adjudicate whether the adopted protection includes backend lock waiting. If yes, fix the proposed sampling protocol while preserving AD-5. If a proposal deliberately excludes lock waiting despite that adopted intent, label that proposal CHALLENGE TO ADOPTED DECISION and require the explicit exception. Do not silently narrow “processing delay” by implementation wording, and do not claim HTTP arrival itself is already a durable accepted request. Proof must cover predeadline arrival/postdeadline lock release, persistence failure, same-key retry, and concurrent policy changes while preserving a trustworthy immutable receipt.

## Voice for Juan

Sigo viendo alto el riesgo de dejar capturas bloqueadas esperando una intervención sin plazo, aunque el reintento manual impide afirmar que la pérdida sea inevitable. También quiero que fijemos qué significa recibir a tiempo: el bloqueo interno de la base de datos no puede decidir esa frontera académica sin que tú la hayas aceptado explícitamente.
