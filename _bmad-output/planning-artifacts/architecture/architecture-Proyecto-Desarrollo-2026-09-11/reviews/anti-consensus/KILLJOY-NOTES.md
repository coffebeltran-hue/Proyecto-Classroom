# Killjoy Loop Stopper — independent first pass

2026-09-17. This checkpoint was written before reading any other reviewer notes. Read the full user brief and all 17 mandatory source artifacts; parsed the complete OpenAPI (82 paths, 94 operations, 101 schemas), inspected all operation authorization/input/output mappings and all schemas. Recovered truncated document portions with targeted reads. No application, original architecture, infrastructure or provider resource was changed. Findings below are documentary counterexamples, not observed production incidents. Temporary IDs ACR-901 onward reserve a distinct range for final editor reconciliation.

## Reconstructed design and stopping rule

The modular monolith persists academic authority in PostgreSQL; separate workers reconcile GitHub and object effects. Receipt, technical validation, timing resolution, preserved bytes and grades are deliberately separate. Its outbox and queue are not redundant merely because both persist jobs: business evidence outlives queue delivery. Likewise immutable publications and current pointers have different responsibilities. Removing either for aesthetic simplicity would weaken an adopted invariant. A 94-operation count alone is not evidence of overengineering.

The actual simplification opportunity is to finish recovery journeys before adding configurable mechanisms. The package repeatedly says it is ready for independent review, not runtime-proven: do not invent a finding that the author claimed executed tests. AD-12–18 remain proposals. This review does not approve them or authorize implementation.

## ACR-901 — Durable requests become undiscoverable in ordinary staff recovery

- Severity/category: HIGH; API/recovery/academic workflow.
- Decisions/files: AD-5; proposed AD-13/14. API.md:25–29; STATE-MACHINES.md:54–66; openapi.json:2947 (dashboard route), 8179 (confirmed revisions collection), 8502 (single request GET), 8641 (resolution POST), 15134 (Dashboard schema).
- Description/evidence: The only request read is GET by already-known request UUID. The acceptance submissions collection lists confirmed Submission records, explicitly not requests. Dashboard exposes a needs_review count but no request IDs. No request collection/filter exists anywhere in the parsed path inventory. Notices are specified for GradePublished/Withdrawn and quota/hold scans, not a guaranteed submission-review queue (OPERATIONS.md:25). Even a notice would not replace complete recoverable enumeration.
- Preconditions: a valid durable request reaches needs_review before creating a Submission; student closes the browser or loses local receipt/key, or a different teacher must resolve it.
- Schedule: POST commits request → response was received only by student, or lost → worker marks needs_review → teacher opens course dashboard and sees count 1 → teacher lists acceptance submissions, gets no corresponding item → request UUID required by GET/resolution is unavailable through the contract.
- Expected: authorized teacher can find and resolve all durable requests; student can recover their persisted work from a fresh session.
- Problematic result/impact: evidence exists but is operationally stranded, or recovery requires database access/undocumented routes. At deadline outages this can affect a class rather than one exceptional command. It is not irreversible loss, hence HIGH rather than CRITICAL.
- Probability/detectability: high conditional on normal review cases and lost browser state; visible count mismatch, but root cause is not discoverable by ordinary user.
- Recommendation: add one bounded, authorized request collection by acceptance and staff review filter by course/assignment, returning current receipt/status/version and stable cursors. Keep confirmed revisions separate.
- Gate: blocks implementation of the submission/review journey; does not require reconsidering AD-5.
- Proof: new browser with no local IDs must locate pending/needs_review/rejected own requests; scoped teacher must enumerate review items after restart; unrelated student/teacher/tenant cannot enumerate them; confirmed-only revision list remains unchanged.

## ACR-902 — Resolution CAS requires a version the receipt cannot return

- Severity/category: MEDIUM; API/concurrency contract.
- Decisions/files: AD-5; proposed AD-14. API.md:21; DATA-MODEL.md:9,48,52; openapi.json:8502,8641,15681 (SubmissionReceipt),15770 (ResolutionInput).
- Description: ResolutionInput requires expected_version. GET submission request returns SubmissionReceipt, whose closed schema contains no row_version, resolution generation or ETag. Resolution output has row_version on the immutable resolution itself, not necessarily the mutable request. No authority defines which aggregate/version is compared.
- Preconditions: teacher already possesses a request ID and seeks an academic classification decision; background validation or another teacher may update state.
- Schedule: GET request → construct resolution → client has no concurrency token → guessed zero either conflicts forever or implementation ignores comparison → simultaneous resolutions can supersede each other without the user seeing a changed state.
- Expected/problematic result: transactional stale-decision rejection versus unusable legitimate command or unreviewed last-writer-wins classification.
- Impact/probability/detectability: recoverable wrong academic classification or blocked review; deterministic missing token on every such flow, concurrency impact conditional; easy to catch in contract E2E, invisible to structural OpenAPI validation.
- Recommendation: identify request/resolution generation ownership explicitly and return the token in current GET. Append superseding decisions using that generation; do not compare immutable outcome row_version=1.
- Gate: blocks resolution implementation until token semantics are fixed, not the whole stack.
- Proof: client using only GET output can resolve once; two teachers using the same token result in one successful decision and one 409; retry original key returns original resolution; receipt timestamps never mutate.

## ACR-903 — First identity request needs an undiscoverable internal account UUID

- Severity/category: HIGH; API/onboarding.
- Decisions/files: AD-3; proposed AD-18. DATA-MODEL.md:22,36; openapi.json:442 (/me),4713 (request intake),14797 (Me),15265 (IdentityRequestInput); SECURITY.md:40.
- Evidence: identity request body requires github_account_id with UUID format, referencing the local github_accounts row. /me gives user_id UUID, external github_user_id decimal string and login, but no local account ID. There is no current-account read endpoint. An external ID is not interchangeable with the required UUID; the student cannot read staff request/roster data to bootstrap it.
- Preconditions/schedule: first-time authenticated GitHub student with no existing link → GET /me and invitation → prepares mandatory request → neither response supplies github_account_id → valid input cannot be constructed using the documented API.
- Expected/problematic result: teacher-confirmed onboarding starts versus every fresh client being blocked or inventing a private endpoint/identity mapping.
- Impact/probability/detectability: central MVP enrollment fails deterministically under a literal contract implementation; straightforward first-user E2E detection, structural schema checks pass.
- Recommendation: derive the active GitHub account from authenticated session server-side and remove the client account field; if multiple selectable accounts are intended, explicitly model and safely expose that selection. Server derivation is the smaller MVP fix and avoids redundant client authority.
- Gate: blocks identity implementation contract; does not challenge teacher confirmation itself.
- Proof: fresh student can request link using only login/invitation responses; forged other-user account ID is rejected/ignored by schema, not used as identity authority; account changes preserve historical binding.

## ACR-904 — In-app-only alarms cannot notify anyone during the failure they describe

- Severity/category: MEDIUM; operational detection/recovery.
- Decisions/files: AD-11 operations; R-11, OQ-13. OPERATIONS.md:71–73; EVIDENCE.md:74 (R-11) and 87 (OQ-13); DELIVERY.md:70.
- Preconditions: API/PostgreSQL unavailable or all worker profiles stopped; no operator is actively refreshing app.
- Schedule: failure prevents durable intake/job progress → oldest-outbox or failed-receipt alarm should trigger → notification is defined as a deduplicated in-app notice stored/read through the same service → responsible operator receives nothing until service is restored or manually checked.
- Expected/problematic result: actionable incident detection versus a self-dependent alert path incapable of waking the owner. Existing liveness endpoints alone do not define an independent observer or delivery path.
- Impact/probability/detectability: outage duration becomes discovery-by-user; lost attempts without receipts increase. Conditional on an ordinary outage; high detectability once investigated, poor automatic detection during failure.
- Recommendation: specify a minimal independent uptime/queue-age observer and one owned delivery channel outside the app (hosting monitor/pager suffices). This does not require product email infrastructure or a general notification platform. Distinguish product notices from service incident alerts.
- Gate: blocks pilot operations, not domain implementation. Close OQ-13 with actual on-call ownership and a measurable detection objective.
- Proof: stop DB/API and stop workers separately; owner receives external notification within agreed bound; absence of the notification store cannot suppress incident delivery; recovery notification deduplicates.

## Non-findings / bounded challenges

- AD-11 stack preference is not a reason to reopen it. RR-01/02 explicitly admit missing artifact/runtime proof; gate the dependent baseline instead of labeling the whole stack incompatible without an experiment.
- AD-13 should stay a small durable-effects protocol, not an event-sourcing framework. No evidence here that such a framework is actually demanded.
- AD-12 tenant FKs plus RLS are complementary defenses, not proven redundant complexity. Same-tenant course checks remain necessary.
- AD-14 preview is an explicit proposed academic eligibility policy; do not inflate five-minute historical observation into proof of continuous branch membership. Evaluate that policy with Juan, not silently approve it.
- AD-15 purge/publication conflicts, AD-16 bounded capture and AD-18 lineage solve real adopted requirements. Simplification cannot silently remove those obligations.
- AD-17 template-only/frozen-repo workflow plus R-08 extensions/CSV are scope proposals. Recommend explicit disposition at package gate, not automatic rejection simply because the pilot is small.

## Independent disposition

PASS WITH REQUIRED FIXES for design progression; FIX ARCHITECTURE FIRST before implementing the affected contracts. This is not implementation authorization. Independent count: HIGH 2, MEDIUM 2, CRITICAL 0, LOW 0; non-findings are not padded into INFO count. Cross-review may merge duplicates while retaining distinct root causes. Operational alert issue is a pilot gate; API incompleteness is a design repair, not a cloud experiment.

## Cross-review after saved first pass

Read Level, Splinter and Wildcard notes only after the checkpoint above was saved. ACR-902 duplicates LV-02 exactly; ACR-903 duplicates LV-01 exactly. Merge both, never count twice. Adopt Level's MEDIUM severity for the undiscoverable account UUID: this is a deterministic contract defect but the demonstrated impact is onboarding incompleteness, not a demonstrated security bypass or live systemic loss. ACR-901 remains a distinct recovery discovery defect, separate from W-03's missing rejection action and LV-02's missing version token. ACR-904 remains an independent pilot operations issue.

No manufactured disagreement: Wildcard's preview interpretation is supported by explicit source text; a force-push after admissible preview is not itself a violation of that proposed policy. Splinter S-04 and Wildcard W-02 are the same quota liveness root cause and must merge. Different severity labels do not create an additional finding. S-01 cancellation/tombstone conflict and S-02 reopening/purge race deserve distinct treatment because each requires a different serialization/replay rule.

Final Killjoy contribution after deduplication: ACR-901 HIGH and ACR-904 MEDIUM are additional unique findings; ACR-902/903 are corroboration only. The final editor should assign report-wide ACR IDs and counts, not add this first-pass count to peer totals. Stop this review loop once counterexamples, repair owners and tests are concrete; further personas agreeing do not supply runtime evidence or Juan's authorization.
