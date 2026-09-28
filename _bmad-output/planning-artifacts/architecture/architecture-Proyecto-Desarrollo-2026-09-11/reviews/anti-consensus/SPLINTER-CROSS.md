# Splinter — cross-review

2026-09-17. Read WILDCARD-NOTES, WILDCARD-CROSS, LEVEL-NOTES and DECISION-CHALLENGES draft. KILLJOY notes were not saved in the directory at this check. This is a challenge pass, not a vote, consensus or authorization. Original architecture files remain untouched.

## Quota severity: preserve the disagreement, do not manufacture stronger evidence

W-02/S-04 is one defect. Wildcard is right that periodic scan_quota is not documented automatic recovery and no human-response bound exists. My MEDIUM assessment is for the demonstrated immediate consequence: fitting captures remain blocked until intervention, an explicitly visible and recoverable operational failure. HIGH requires an argument that this constitutes significant preservation unavailability or materially increases source-loss exposure; Wildcard supplies that risk argument, not a proof that loss inevitably follows. Either final severity must state those facts. Never use a hypothetical scan as an established defense; never use hypothetical future repository deletion as an observed loss. Repair is cheap and required before capture integration regardless of severity. A bounded sweep that wakes blocked captures is sufficient; an additional event type is not intrinsically required.

## Reapproval: the transition class, not the endpoint name, must govern authority

LV-03 identifies a legitimate gap because active uniqueness cannot protect a revoked predecessor. Its strongest limiting defense is the institution-wide identity protection described for correction. If that applies to all binding changes, the bypass is forbidden in intent, just as reopen/purge loss is forbidden in intent. Accordingly label HIGH as a missing concrete transition/authorization rule with a conditional exploit, not a confirmed cross-course takeover. Do not escalate to CRITICAL without establishing the new account inherits B's access automatically. Include initial approval into an already multi-course profile in the policy decision; merely checking for a predecessor may leave the same scope question unresolved. Proof must distinguish three subjects: authenticated requester, profile owner and teacher's course scope; a correctly authenticated wrong claimant is still possible when the human approval is wrong. No new SSO requirement follows.

## Late remote grant: strong schedule, weaker completion guarantee

LV-04 correctly defeats the sentence that an old generation cannot grant after revocation; GitHub does not receive the local fencing token. A local check before and after the call is insufficient when the original worker dies. Preserve HIGH for unauthorized external-access interval, even if later reconciliation removes it: recovery cannot undo downloaded code. However, the remedy must not promise finite certainty that no remote request can ever finish when the provider offers no such bound. Require durable uncertain attempts, visible pending/unknown revocation and recurring effective-access/invitation reconciliation; distinguish local authorization revoked immediately from external cleanup complete as observed. Serialize newly issued effects where possible, but holding a DB lock across a network request does not make the provider transactional. The simulator proves local recovery behavior; actual provider/invitation tests establish only the tested external semantics. No architecture should claim that both prove instantaneous revocation.

## API gaps: retain their narrow demonstrated consequences

LV-01 is MEDIUM bootstrap contract incompleteness. Session-owned-account checks explicitly prevent turning an arbitrary UUID into a demonstrated impersonation exploit. Deriving the account server-side is simpler than adding a new selection endpoint when multi-account selection is not required.

LV-02 and W-03 are distinct repairs on one review workflow: missing read concurrency token and missing rejection command. They may share one user-visible blocked workflow but should not hide one another. Keep immutable POST acknowledgement separate from mutable GET status. A hard-coded version or overloaded classification string is not a repair. Proof must combine readable current version, explicit rejection, stale conflict and replay without duplicate outcomes.

## AD-5 boundary challenge: identify who must decide and what is actually promised

The draft is right to surface predeadline arrival/postdeadline lock release. It should not present durable-ingress timestamp storage as a trivial implementation fix: arrival can precede durable receipt, and early sampling must retain policy/version and retry semantics without manufacturing accepted requests after failed persistence. AD-5's no-processing-delay language and post-lock sampling need explicit reconciliation. Label the adopted-decision challenge as a request to adjudicate the receipt boundary; do not claim AD-5 unambiguously approved socket-arrival time. If Juan says lock waiting is excluded from the adopted protection, record that explicit boundary; if not, repair the proposed intake protocol. This question matters independently of later GitHub validation, which is already separated correctly. Test intentional lock contention crossing the deadline, not just slow provider validation.

## AD-7 and publication after deletion: do not demand impossible preservation or prohibit silently

The draft appropriately challenges the proposed acknowledgement exception: absent bytes cannot acquire a real new twelve-month preservation term. Clarify the policy choices as (a) disallow official publication when required source evidence has been permanently deleted, or (b) explicitly approve publication using remaining historical/other evidence, with unavailable content and the exception visible. Neither can be selected by review consensus. Do not imply re-fetching the same SHA restores the same archive, capture provenance or historical availability. A later recapture, if ever allowed, is a new evidence event and cannot erase the earlier verified-deletion record. This is a true policy disposition; S-01/S-02 are repairable enforcement gaps and should not be counted as separate challenges to the adopted retention policy itself.

## S-01/S-02: narrow both conclusions through their strongest defenses

S-01: mandatory quarantine on ambiguous replay prevents destructive false positives but cannot reconstruct a cancellation missing from every surviving source. Make cancellation independently durable before acknowledging it, or explicitly disallow cancellation once export commits. The latter changes allowed operator behavior and requires deliberate selection. Replay crash tests must include journal append succeeding while DB acknowledgement fails.

S-02: a common mutex is one solution, not the finding. Any isolation/generation protocol establishing the course/reopen versus purge linearization is sufficient. A reopen after an earlier winning purge cannot retroactively promise existing bytes. Require the interface to disclose that condition, and do not pretend asynchronous recalculation itself establishes order.

## Additional guard against overclaiming

W-01 proves ambiguity between receipt order and confirmation order. Its HIGH impact remains conditional on using largest revision as latest intent; immutable evaluation references prevent automatic grade retargeting. Preserve that qualification. A rejected or still-pending latest request also means “latest intended,” “latest confirmed” and “currently graded” cannot be compressed into one number. An intake sequence plus explicit projections solves the issue without globally ordered validation.

S-03 remains unpromoted: no demonstrated admissible capture-against-purge path. A required invariant/test is appropriate; a standalone exploited race is not yet supported.

## Voice for Juan

No me preocupa que el documento prometa proteger la evidencia; me preocupa dónde se decide quién ganó una carrera y qué hechos sobreviven a un desastre. También pondría un límite a nuestra propia crítica: el reintento manual no garantiza recuperación a tiempo, pero una demora visible tampoco demuestra por sí sola pérdida de evidencia. Quiero que el informe conserve esa diferencia y que las excepciones académicas las decidas tú, no un detalle del worker ni esta mesa.
