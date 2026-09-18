# Killjoy cross-review

Independent first pass is saved in KILLJOY-NOTES.md. Peer notes were read afterward. No original documents or implementation changed.

## Registry disposition

Eleven distinct findings is a defensible deduplicated registry given the described set. Missing discovery of unconfirmed requests, absent rejection decision, and absent resolution CAS token are distinct: fixing one does not fix the other two. Combine duplicated quota wake-up findings. Combine account-bootstrap and CAS corroboration from Level/Killjoy.

Account-bootstrap severity: I withdraw my initial HIGH and endorse MEDIUM after comparing demonstrated consequence with the user's severity definitions. A missing account UUID prevents completing the documented onboarding flow; it does not prove impersonation, authorization bypass or loss of already-created submissions. Preserve the original HIGH in first-pass history but do not present a live disagreement I no longer maintain. It still blocks that implementation contract.

Quota wake-up severity: MEDIUM is supportable because explicit manual snapshot retry and a scan job exist. The missing automatic refund/reclaim wake-up is real, but irreversible source loss requires an additional GitHub loss event and failure of manual intervention. Preserve Wildcard's HIGH as an impact assessment, not an extra issue. Gate: repair before capture integration/pilot, with 50 students/2 GiB regression; no need to ban foundational identity work on this account.

Request discovery: retain HIGH. Unlike a single schema field, the defined staff recovery path cannot find a whole class of durable but unconfirmed requests; delayed validation/outage can strand many requests. Do not call this irreversible evidence loss: DB rows survive. A scoped enumeration/read-side recovery contract fixes it without an event platform or infrastructure.

Alerts: MEDIUM, pilot gate. Product notices may remain in-app; incident detection must have an independent observer/delivery path. OQ-13 can choose the minimal hosting alarm and named owner. This is not an argument for an email subsystem.

## AD-5 post-lock clock boundary

Keep as an explicit policy question, not a proven violation. DATA-MODEL.md:147 states clock_timestamp after the necessary locks and says waiting is not erased; AD-5 calls the backend durable receipt authoritative and only promises processing delay does not automatically create lateness after that receipt. A packet reaching the API at 23:59:59.999 but obtaining a durable receipt after midnight is not secretly contradicted by the written chosen boundary. The distinction matters to Juan and load testing, but no formal arrival-time promise exists to break.

Required design disposition: state the user-visible definition of received_at and explain deadline contention; bound intake work and separate post-receipt work. RR-04/load proof should test 50 requests near cutoff and lock contention. If Juan intends HTTP ingress time, explicitly CHALLENGE/clarify AD-5 and change timestamp/persistence policy; do not silently relabel arrival as durable receipt.

## AD-7 publication after verified deletion

Keep as an explicit CHALLENGE TO ADOPTED DECISION / policy-compatibility question, not a confirmed race or loss defect. AD-7 promises publication extends referenced snapshot retention, but a snapshot already lawfully deleted cannot be recreated by a later publication. DATA-MODEL.md:149 explicitly proposes acknowledgement of unavailable content after verified deletion; EVIDENCE R-10 marks the exception as a recommendation. Thus the engineering design has disclosed its exception rather than proven it satisfies the adopted promise.

Required decision before implementing that edge: Juan chooses whether publication after verified deletion is forbidden, permitted with explicit acknowledged absence and a narrowed retention promise, or requires recapture when still obtainable with a distinct provenance record. Never imply recapture restores the deleted original object or earlier availability. Preserve official evidence metadata and audit whichever route wins. No new runtime experiment can decide the normative academic policy for Juan.

Do not inflate it into a twelfth defect just to increase count; include it prominently in adopted-decision challenges and implementation-gate policy dispositions. If the final report treats the unresolved exception itself as a finding, say explicitly that it is a policy contradiction needing a decision, not experimentally demonstrated unauthorized deletion.

## Stopping/gate advice

The report can finish now with concrete eleven-finding registry, five remaining substantive HIGH peer findings plus request-discovery HIGH, MEDIUM bootstrap/CAS/rejection/quota/alerts, and explicit AD-5/AD-7 questions. Check the arithmetic against the actual registry rather than this prose if membership differs. None of AD-12–18 becomes adopted by recommendation. Fix relevant architecture contracts first; separately authorized dependency/provider experiments and implementation remain separate actions. Repeated peer agreement is no substitute for the missing proofs.
