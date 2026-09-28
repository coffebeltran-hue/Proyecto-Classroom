# Targeted architecture repair proposal

Prepared 2026-09-17 for Juan by the default BMAD Party Mode team: Mary (business rules), John (scope), Sally (UX), Winston (protocols) and Amelia (feasibility and proof). This is a session-mode synthesis, not a new independent review or a vote.

**Status: RECOMMENDATION — awaiting Juan's approval. Implementation UNAUTHORIZED.** This new review document is the only intended write in this round. The architecture, OpenAPI, independent review and both memory logs remain unchanged. Nothing below is an applied repair or a closed finding.

## 1. Executive summary and authority

**FACT:** The independent review recommended PASS WITH REQUIRED FIXES — FIX ARCHITECTURE FIRST, with 11 distinct findings: 6 HIGH and 5 MEDIUM, no CRITICAL. Its [canonical register](../anti-consensus/FINDINGS.md), [attack matrix](../anti-consensus/ATTACK-MATRIX.md), [decision challenges](../anti-consensus/DECISION-CHALLENGES.md) and [gate](../anti-consensus/IMPLEMENTATION-GATE.md) remain intact, including reviewer disagreements and excluded leads.

**DECISION:** AD-1 through AD-11 remain ADOPTED. AD-12 through AD-18 remain PROPOSED / RECOMMENDATION. Juan alone changes decision status. An ACCEPT validity assessment below accepts a documentary finding, not an AD or implementation scope.

**RECOMMENDATION:** Accept all 11 findings as gaps in the specified contracts. Preserve their qualifications: ACR-001 is a conditional authorization gap, ACR-003 does not prove inevitable loss, ACR-005 does not retarget grades, and ACR-007 does not prove permanent source loss. Runtime evidence remains necessary even when documentary validity is accepted.

| Finding-validity disposition | Count |
| --- | ---: |
| ACCEPT | 11 |
| PARTIALLY ACCEPT | 0 |
| REJECT | 0 |
| REQUIRES EXPERIMENT to determine validity | 0 |

Experiments are required to prove repairs, especially remote effects and recovery; that does not make an observed missing field or missing protocol an experimentally undecidable finding.

The smallest proposed repair set is: one binding-transition authorization rule; durable tracking of uncertain remote access attempts; cancellation-aware deletion journaling; shared course/purge ordering; intake-based request order; two bounded request-list routes; quota recovery through the existing sweep; session-derived GitHub identity; a current request version; an explicit resolution decision; and independent operational alert delivery. No new broker, microservice, identity provider or authoritative evaluator is proposed.

**OPEN QUESTION:** AD-5's receipt boundary and AD-7's publication-after-deletion exception require explicit human choices. The user now expressly includes internal lock waiting in the fairness scenario. We do not treat the older post-lock proposal as his approval of that exclusion.

**ASSUMPTION:** A short per-course retention lock is adequate for the pilot; measure it before increasing concurrency. Provider calls eventually settle and access can be inspected only when credentials/network permit; neither a finite remote-settlement bound nor unconditional convergence is assumed proven.

### Inputs inspected

Read the complete top-level Markdown package, including .memlog, DISCUSSION, README and REVIEW; all independent notes, rebuttals, recovery record, five final reports and their manifests/checks; STACK-RESEARCH and both document helpers. Parsed the full current openapi.json and compared it with an in-memory construction from the fully read generator, omitting its write/print statements: exact equality, 82 paths, 94 operations, 101 schemas. This confirms the entire current wire contract was inspected through its equivalent compact definitions, not just selected routes. No generator wrote a file and no handler, migration or provider experiment ran.

The original 19-input fingerprint manifest and a fresh pre-round fingerprint inventory are used to detect unintended changes. Older statements that adversarial review is still pending are historical/stale status, not permission to rerun discovery. A later authorized documentary pass should reconcile that status while preserving history; this round leaves it untouched.

### Team's working exchange

📊 **Mary:** “The authorization rule must follow the identity transition and its affected courses. Calling it a new request must not erase its predecessor.”

📋 **John:** “Use the existing teacher/grant model. I would reject a new institution-wide approval workflow engine for this pilot.”

🎨 **Sally:** “Then tell the teacher when wider authorization is needed without exposing another course's roster. Also distinguish ‘platform access revoked’ from ‘GitHub cleanup still uncertain’.”

🏗️ **Winston:** “A local generation can reject a stale database update. It cannot cancel a GitHub request already sent. The contract must retain that uncertainty.”

💻 **Amelia:** “And deletion cancellation needs a real competing transition with destructive start. An extra journal sentence is not enough; both outcomes need crash tests.”

## 2. Individual finding dispositions

Proposed field/route/event names below are concrete review candidates, not deployed contracts. Existing terminology is retained where sufficient. Each finding remains separately traceable even when repairs share a transaction or schema.

### ACR-001 — Identity reapproval and affected-course authority

**Finding validity:** ACCEPT.

**Why:** SECURITY's ordinary approval permits a course teacher while correction has all-affected-course scope. A legitimately revoked predecessor bypasses active uniqueness. The global intent may already forbid the result, but the permitted transition and its authorization are not explicit. No proven tenant escape is claimed.

**Invariant:** Every activation of an institution-wide binding, including first activation of a multi-course profile and reactivation after revocation, is authorized for every course whose current academic access it enables. Previous authorship never changes. Knowledge of an identifier remains insufficient.

**Smallest sufficient repair:** Use one activation policy for ordinary approval and correction. An existing predecessor makes the operation a lineage continuation; the server resolves and records it, rather than trusting a caller-selected predecessor. Require a teacher authorized in all affected courses or a valid institutional grant to that teacher covering that set. Apply the same scope test to first approval into multiple active enrollments. Retain the current teacher-only approval and institutional grant mechanism; no new approving persona or SSO.

The affected set includes active roster enrollments and any course whose access policy would newly expose retained records through this binding. OQ-12 must settle historical-access policy before enabling such access; unresolved historical grants fail closed rather than being silently included in ordinary course authority. A new enrollment after binding approval is a separate authorized roster action that knowingly enables that course for the existing verified identity. It must not race approval unnoticed.

**Affected artifacts:** SECURITY RBAC and identity threats; DATA-MODEL identity/profile/roster transactions; STATE-MACHINES identity; GITHUB access reconciliation; API identity semantics; OpenAPI `decideIdentityLink`, `correctIdentityBinding`, `IdentityRequestStaff`; spine AD-12/18 and EVIDENCE R-03/OQ-12.

**Data-model consequence:** Reuse profile row locking, `row_version`, binding `predecessor_id`, events, requests and active uniqueness. Specify profile authorization generation increment on binding or affected-enrollment changes, using the profile's existing version if its semantics are made explicit. Normalize audit references to transition class, predecessor, authorized scope and grant when used. No new binding type. Reverse user/account uniqueness remains the separate unadopted R-03 proposal.

**API consequence:** Existing approval route remains. Its authorization becomes transition-based; expose a staff-safe approval-context/version token and `requires_broader_authority` without disclosing inaccessible course identities. Require that inspected profile context as well as request `expected_version` on approval/correction. A stale scope gets 409; insufficient authority gets 403 in known scope. Rejection of a pending request still needs only its course's teacher authority because it grants no new access.

**Concurrency / distributed-effects consequence:** A short transaction locks the stable profile even when no active binding exists, then affected authorization/enrollment records and request/binding in a documented order. Roster import/add/withdraw and binding mutations participate in that profile protocol; staff/grant revocation conflicts with the same authorization records. Recheck scope and account ownership after locks, append binding/event/audit/outbox and idempotent result atomically. Use ascending IDs for batches; no provider calls under locks. Local historical actors are never rewritten; ACR-002 handles external cleanup.

**UX consequence:** Student sees pending teacher confirmation, never “identity claimed” on intake. Teacher sees whether they can approve or need scoped authorization; no cross-course personal data leak. Correction/reapproval shows its historical nature and reason. Future actions and historical attribution are distinguished.

**Required proof:** Two-course revoked-predecessor test; first multi-course approval; legitimate scoped-grant success; racing roster insertion/removal and teacher/grant revocation; competing claims; exact replay; historical authors unchanged; historical read denial until OQ-12 permits it. Real PostgreSQL RLS/FK/constraint tests plus E2E-03/19/20.

**Scope:** Blocks implementation of identity authorization; external effects block integration; OQ-12 blocks unresolved historical access paths and real-data pilot use.

**Decision impact:** Clarification of adopted AD-3's “authorized teacher,” modification to proposed AD-12/18 and R-03. This proposed all-affected-course rule for initial activation is an explicit subordinate policy refinement for Juan's approval, not a previously adopted restriction. No new AD required.

### ACR-002 — Uncertain GitHub access effects

**Finding validity:** ACCEPT.

**Why:** An old platform-issued grant can complete after a newer revoke/read. Current local generations and recurring reconciliation are useful but do not make that remote call fenced or its exposure impossible.

**Invariant:** Local revocation immediately denies platform academic access. Every possibly issued obsolete remote grant remains durably accountable until its outcome is resolved; external cleanup is never represented as final while an older grant may still complete. Observed absence is timestamped evidence, not a timeless guarantee.

**Smallest sufficient repair:** Extend the existing access reconciliation protocol with durable per-repository/account desired state and per-call attempts. Before a remote mutation, commit an attempt marked potentially issued. After the call, record response or uncertainty and reconcile current desire. A timeout or worker lease expiry is not proof that the provider stopped. Do not blindly resend an uncertain grant. Continue bounded, recurring absence/invitation checks and removal for revoked subjects; escalate inability to inspect or settle old attempts.

**Affected artifacts:** DATA-MODEL repositories/access attempts; OPERATIONS `reconcile_access`; GITHUB collaborators/invitations; STATE-MACHINES access; SECURITY external-access guarantees; API/OpenAPI `Repository`, `AcceptedAssignment`; spine AD-13/18.

**Data-model consequence:** Add a narrow `repository_access_subjects` relation keyed by tenant/repository/GitHub account, with desired state/generation, observed collaborator/invitation state, observation time and unresolved-attempt count or derived equivalent. Add `repository_access_attempts` with subject/generation, action, attempt ID, lifecycle, dispatch authorization, provider request/invitation IDs and outcome evidence. Multiple accounts must coexist during correction: one repository-wide enum cannot represent old-account cleanup and new-account invitation. Reuse outbox operation IDs; keep sensitive detail staff-only.

**API consequence:** Keep commands; enrich authorized repository status with local academic access, current-account invitation status and safe external-cleanup summary. Staff may inspect uncertainty for former subjects through existing scoped operation detail. `revoked` is permitted only as an observed-cleanup state with `observed_at` and no unresolved older own grants; otherwise use existing `revocation_pending` or `blocked`, with reason. Do not expose another student's account in student projections. No generic GitHub proxy or new permission escalation.

**Concurrency / distributed-effects consequence:** Short per-subject CAS transactions authorize a dispatch and record its potentially issued attempt before network I/O. Revocation advances desired generation and queues reconciliation atomically. Workers recheck desire before sending but do not rely on that check to revoke an already-issued call. A stale completion may append outcome evidence for its own attempt, never overwrite desired state or certify the current generation. Reclaim discovers unresolved attempts from durable records, even if W1 died. An absent observation cannot resolve an unknown old PUT without a supported settlement argument. If no provider bound exists, retain uncertainty, recurring cleanup and escalation indefinitely rather than inventing a timeout-to-success rule. Convergence is conditional on eventual provider settlement, reachable credentials and no conflicting external owner action.

**UX consequence:** “Platform access revoked. GitHub cleanup pending; an earlier invitation or grant may still complete.” If observed absent but uncertain, say so. Never imply downloaded code can be recalled. New-account provisioning may proceed under approved authorization while old-account risk remains prominently visible to staff; do not silently gate or certify it as clean.

**Required proof:** Controlled delayed PUT → revoke/delete/absent read → late PUT → killed worker; startup recovery must rediscover and remove late grant/invitation. Test stale completions, disabled App, repeated observations and distinct old/new accounts. Simulator proves protocol behavior; RR-03 proves actual invitation inspection/removal and tested provider behavior. Neither proves instantaneous global revocation.

**Scope:** Blocks implementation of truthful completion semantics; blocks integration of access reconciliation until RR-03 evidence. Exposure response and operator ownership block pilot.

**Decision impact:** No change to AD-3/10; modify proposed AD-13/18. The stronger old-generation sentence is a proposed-mechanism correction, not an adopted instantaneous-revocation promise. No new AD.

### ACR-003 — Cancellation survives independent journal recovery

**Finding validity:** ACCEPT.

**Why:** A prepared tombstone cannot reconstruct a permitted later cancellation from an older DB backup. Quarantine prevents inevitable destructive loss but cannot supply the missing fact.

**Invariant:** A cancellation acknowledged as complete survives restoration independently of the restored DB. A canceled deletion generation never authorizes destruction. Cancellation and destructive-start authorization are mutually exclusive; ambiguous or incomplete histories quarantine.

**Smallest sufficient repair:** Extend the already-required independent deletion journal with ordered generation-specific lifecycle records. Preserve cancellation before the destructive-start authorization boundary. Do not add a general event-sourcing system or distributed transaction.

1. Purge claim commits generation g, object identities and a `prepared` journal intent in the DB/outbox. Export is idempotent by operation/generation/sequence.
2. Cancellation and destructive start contend on the same deletion operation under the snapshot fence. From prepared, only one can commit: `cancel_pending` or `start_pending`. Start requires verified export of prepared; cancel requires no previously authorized destructive start.
3. A winning cancellation prohibits all destructive dispatch. Verify exact bytes outside the DB transaction; then export an immutable `canceled` record with identity/verification evidence. Only after journal readback and a final state check may DB cancellation complete, its fence release and a success acknowledgement be returned. Failure stays cancel-pending/blocked, never silently restores delete authority.
4. A winning start exports `destructive_start_authorized` before any object delete. Only that branch permits the provider call. Once start is committed, cancellation conflicts, even if the first delete has not yet been observed. The UI must disclose this conservative cutoff. Finish with `verified` only after recoverable-copy proof.
5. Restore reads a complete ordered journal/checkpoint. Canceled g retains bytes after identity/integrity checks; start-authorized g stays inaccessible pending reconciliation; verified g never becomes accessible. Prepared-only, gaps, conflicting records or unavailable journal quarantine. A later generation cannot erase the cancellation record for g.

**Affected artifacts:** OPERATIONS purge/restore; DATA-MODEL deletion_operations/tombstones; STATE-MACHINES deletion; EVIDENCE RR-05/R-10; API scoped operator recovery semantics; DELIVERY E2E-18; proposed AD-15.

**Data-model consequence:** Add deletion operation protocol phase and append-only journal records with operation ID, generation, sequence, kind, exact object identity, predecessor/checkpoint, actor/reason where applicable, evidence digest and export confirmation. Existing deletion_tombstones may serve as the journal-record table after explicit schema refinement; do not create duplicate competing authorities. Canceled is a terminal operation outcome; snapshot availability and retention remain separate.

**API consequence:** No student delete/cancel route. Add a narrowly scoped operator `POST /deletion-operations/{id}/cancellations` design with expected version, reason, confirm and idempotency key; return 202 while journal completion is pending, current operation via existing GET `/operations/{id}`. Expose the relevant operation reference only to authorized evidence operators. No 200 “canceled” before independent durability. Do not overload `retryOperation` as cancellation. Approval of this narrow recovery command is part of the proposal.

**Concurrency / distributed-effects consequence:** Shared snapshot/operation CAS selects cancel versus start; exporter enforces predecessor readback and stable event identity. A duplicate export after response loss is verified, not appended as a different decision. Failure after journal success/before DB success is recovered by the same key. No DB lock spans object read, journal write or deletion. Restore mode stops old dispatchers/workers and fences their credentials before replay, so an old database instance cannot continue destructive work against restored authority. Journal completeness/configuration is RR-05; an append-only label alone is not a guarantee.

Do not resume deletion of canceled evidence merely because a subsequently created hold was lost in a DB restore. Keep affected evidence quarantined from destructive work until current obligations are reconciled; a fresh generation needs a newly authorized eligibility decision. Cancellation recovery does not magically reconstruct every lost non-deletion business event beyond the agreed RPO.

**UX consequence:** Operator sees “cancellation requested; not yet durable,” “canceled,” or “destructive start already authorized; cancellation unavailable.” No restored-download availability before integrity/authorization checks. Student sees preservation/deletion availability, not internal journal credentials.

**Required proof:** Every crash boundary above, including prepared export concurrent with cancel, duplicate export, cancel export success/DB ack loss, byte-verification failure, journal outage/gap, old DB plus current journal, and stale old-environment worker. Canceled bytes retained; verified deletion inaccessible; repeated replay stable. RR-05 provider proof remains mandatory.

**Scope:** Blocks implementation of purge/recovery protocol; blocks production destructive execution and any pilot deletion guarantee until proof.

**Decision impact:** No change to AD-7; modify proposed AD-15. Explicitly refine the unadopted operator cancellation boundary. Simpler alternative: forbid cancellation at initial purge claim/export authorization; that removes recovery flexibility and is not selected silently. No new AD.

### ACR-004 — Course eligibility and purge have one order

**Finding validity:** ACCEPT.

**Why:** The active-course invariant exists, but asynchronous recalculation and a snapshot-only lock do not order a reopen against a claim based on old course state.

**Invariant:** A reopen committed before a purge claim prevents that claim. A claim that won earlier remains an explicit existing deletion operation; reopen cannot promise to undo it. Current course eligibility, holds and retention floors are checked at the claim's shared serialization point.

**Smallest sufficient repair:** Use the existing classroom row as a short shared coordination lock for retention-affecting commands and purge claims. Reopen commits active/no-close status plus a retention generation increment synchronously; bulk recalculation remains async. Purge rereads course state under that lock, never trusts cached retain_until alone.

**Affected artifacts:** DATA-MODEL classrooms/publication/purge transactions; OPERATIONS close/reopen/policy migration/purge; STATE-MACHINES; API/OpenAPI `reopenCourse`, `Classroom`, retention migration; SECURITY retention race; DELIVERY E2E-16/17/18; AD-15.

**Data-model consequence:** Add `retention_generation` and `retention_recalculation_pending` on classroom, and record eligibility generation on deletion claim. Reuse academic closure events and immutable policies. A migration affecting existing evidence sets the pending fence synchronously for its selected courses before acknowledging the migration; its async job clears it only for the matching generation after conservative recalculation. Pending conservatively blocks new purge. Policy updates for future evidence do not reinterpret old rows.

**API consequence:** Existing reopen response includes retention-recalculation state and a safe indication of already-claimed/unavailable evidence; authorized staff can navigate to the relevant snapshot/operation. A reopen may succeed academically while explicitly reporting that earlier purge claims were not reversed. It does not bypass the separate cancellation command. The response is a durable command outcome; current detail is a separate GET.

**Concurrency / distributed-effects consequence:** For commands taking these locks, use classroom → current-grade row when needed → snapshots sorted by ID → deletion operation. Hold, publish, reopen, close, migration and purge follow the same order; existing publication current-grade-first wording must be reconciled. Each transaction is short; no provider I/O or bulk archive inspection. Reopen need not lock every snapshot: its classroom lock prevents new claims while it commits the fence. Multi-course migration locks its bounded selected courses in ascending order, commits fences, then batches metadata work. If another feature also needs profile/authorization locks, acquire those before classroom, never the reverse; document the full order in the authorized repair pass. Do not mix quota-account locks into retention transactions; quota release is a separate idempotent accounting step.

**UX consequence:** “Course reopened; future deletion claims suspended. Some evidence was already in deletion processing.” Never imply archive/hide closed the course, or that reopening restored deleted code. Holds and published retention floors remain visible.

**Required proof:** Barrier schedules before course lock, after eligibility read, at reopen commit and claim commit; purge-first and reopen-first; many snapshots; concurrent hold/publication; policy migration fence and crash before clearing it. Measure per-course contention, without replacing the mechanism before evidence of a bottleneck.

**Scope:** Blocks implementation of reopen/purge coordination; executed race and recovery proof blocks destructive production/pilot deletion promises.

**Decision impact:** No adopted AD change; modification to proposed AD-15. This is enforcement of AD-7, not new retention durations. No new AD.

### ACR-005 — Submission order belongs to intake, not validation completion

**Finding validity:** ACCEPT.

**Why:** B can confirm and be graded before earlier A confirms. Confirmation allocation then labels A as a newer student action. Fixed grade references survive, but latest-work projections become misleading.

**Invariant:** A request durably admitted before another request for the same acceptance keeps that earlier order regardless of later validation. Confirmation never manufactures a new submission intent or alters a grade's revision.

**Smallest sufficient repair:** Allocate `request_sequence` under the existing per-acceptance intake lock; confirmed Submission inherits it as `revision`. Allow gaps. Rename `next_revision` to `next_request_sequence` in the proposed physical model. Do not add a confirmation counter or serialize validation behind needs_review.

**Affected artifacts:** DATA-MODEL acceptance/request/submission/indexes; STATE-MACHINES grading/submissions; API/OpenAPI `SubmissionReceipt`, `Submission`, `CurrentGrade` and list ordering; DISCUSSION revision rationale; DELIVERY E2E-07/08/11; AD-14.

**Data-model consequence:** Unique `(institution_id, acceptance_id, request_sequence)` on requests; immutable sequence; request/submission relation enforces inherited equality. U request on Submission still prevents double confirmation. Rejected requests consume their sequence and never create a confirmed revision. Same-key replay consumes none; same SHA/new key consumes a new sequence. Retain received_at and confirmed_at separately.

**API consequence:** Receipt/current request expose request_sequence. Submission revision uses that sequence. Define projections: latest request = highest admitted sequence including pending/rejected; latest confirmed = highest sequence having a Submission; evaluated revision = exact current publication's Submission. Existing `latest_submission_revision` means latest confirmed, and `newer_submission_exists` compares that with evaluated revision. Add a separately named latest-request summary; pending requests do not masquerade as confirmed revisions. When no current grade exists, do not invent an evaluated revision.

**Concurrency / distributed-effects consequence:** Intake transaction allocates sequence once with receipt/idempotency/outbox. Confirmation locks the request, rechecks authorization/evidence, inserts its inherited revision and snapshot/outbox atomically; it does not allocate order. Concurrent admissions across API instances are ordered by the per-acceptance transaction, not arrival packet time or guessed human intent. AD-5's early time option affects punctuality, not a promise of total wall-clock order among overlapping requests. Sequential A-then-B acknowledged admissions are deterministic; overlapping requests disclose their actual admitted sequence. Record an authority/version conflict rather than renumbering existing records.

**UX consequence:** “Latest request: 3, verification pending. Latest confirmed submission: 2. Published grade: revision 2.” If request 3 is rejected, show that explicitly while 2 remains latest confirmed. An older request confirming later does not trigger a new-intent banner. Gaps are explained as requests that did not confirm, not missing evidence.

**Required proof:** A admitted before B; B confirms/publishes before A; B remains latest confirmed after A confirms. Also rejected gaps, same-SHA/new-key, exact retry, concurrent admissions, no current grade after withdrawal, and late submission normal deadline rules. API/E2E plus real-DB uniqueness tests.

**Scope:** Blocks implementation of submission ordering and grade/latest projections. Temporal eligibility additionally depends on AD-5/RR-04.

**Decision impact:** Clarification of AD-2/4 ordering, modification to proposed AD-14; no change to adopted explicit submission or grading policy. No new AD.

### ACR-006 — Discoverable durable requests

**Finding validity:** ACCEPT.

**Why:** The complete path inventory has UUID-only request reads and confirmed-only Submission collections. Notices/counts cannot enumerate the durable recovery work.

**Invariant:** A currently authorized student can recover their own durable requests without browser-local IDs; authorized course staff can find all requests in their review scope, whether or not a Submission exists.

**Smallest sufficient repair:** Two bounded GET collections, reusing the same current request projection: `/accepted-assignments/{id}/submission-requests` for owner/scoped staff and `/classrooms/{id}/submission-requests` for teacher or TA with submissions_read. The staff collection supports an assignment filter validated within that classroom. No global tenant-wide student search or new workflow service.

**Affected artifacts:** API/OpenAPI routes, parameters and request pages; SECURITY read/resolution RBAC; DATA-MODEL request indexes; STATE-MACHINES staff recovery; OPERATIONS notices versus work discovery; DELIVERY E2E-08/09.

**Data-model consequence:** No new domain table. Add indexes supporting tenant/course/acceptance/status and immutable traversal key through existing relations; use `created_at,id` as stable list order for course traversal and request_sequence for acceptance traversal. Current status/version derives from request aggregate. Do not copy review work into a second authoritative inbox.

**API consequence:** Default limit 25/max 100, opaque cursor bound to resource/filter/sort, optional allowed validation_state filters including needs_review, received, validating, rejected and confirmed. Return current version and nullable Submission reference, never staff-only evidence notes to students. Dashboard review count links to the same scoped query. Authorization is re-evaluated per page; cursor is not a capability. Mutable filters are live views, not a snapshot export: refresh from the start to discover newly transitioned items behind a prior cursor. No claim of an immutable count/list across concurrent transitions.

**Concurrency / distributed-effects consequence:** Read committed durable requests; worker state changes need no new notice for discoverability. Stable keyset pagination prevents offset drift on inserts; a fresh bounded traversal recovers all currently matching items. No new outbox or worker. Own means current authorized profile/acceptance policy, not “knows actor_id”; OQ-12 remains relevant after identity correction.

**UX consequence:** Student request history survives refresh/device change; teacher has a real needs_review worklist and explicit rejected/pending states. TA may read with capability but cannot resolve. Empty list, unavailable API and no confirmed submission are different views.

**Required proof:** Fresh browser with no UUID/key, lost POST response, restart, pending/needs_review/rejected requests, teacher and TA boundaries, other students/courses/tenants denied, cursor tampering and live filter changes. Confirmed-only Submission list stays distinct.

**Scope:** Blocks implementation of the complete submission/recovery journey.

**Decision impact:** No adopted AD change; modify proposed AD-12/14, clarify AD-13 recovery surface. No new AD or product workflow.

### ACR-007 — Quota refund resumes fitting work

**Finding validity:** ACCEPT.

**Why:** Existing scan/alerts/manual retry mitigate delay but do not specify automatic re-admission after reservation refunds. Keep final MEDIUM and Wildcard's recorded HIGH dissent unchanged.

**Invariant:** With healthy workers/provider, stable sufficient capacity and a finite fitting backlog, quota-blocked captures are automatically reconsidered fairly within the configured sweep budget. Logical used + reserved never exceeds allowed admission capacity; a reservation settles once.

**Smallest sufficient repair:** Give the existing `scan_quota` job a bounded re-admission responsibility. This is smaller than requiring a new capacity event for every release. The sweep must observe all effective free-capacity changes: refund, failed/reclaimed reservation, verified deletion accounting and limit increase. Existing quota-change wakeups may accelerate it but are not correctness dependencies.

**Affected artifacts:** OPERATIONS job/event catalog and capture steps; DATA-MODEL quota/reservation lifecycle; EVIDENCE R-06/RR-06; DELIVERY load/E2E-15; AD-16.

**Data-model consequence:** Reuse quota accounts, reservations and operation checkpoints. Define conditional `reserved → charged/released` settlement, generation/attempt ownership and nonnegative invariants. Persist sweep cursor/last progress in the existing scheduled-operation checkpoint, plus a capacity generation/last-inspected marker if needed to avoid reconsidering unchanged blocked rows continuously. No new ledger service.

**API consequence:** Existing retry and usage routes suffice. Status can report awaiting capacity and last recovery scan; never promise an exact capture completion time. No quota value or retention duration changes.

**Concurrency / distributed-effects consequence:** Sweep traverses courses fairly, oldest eligible blocked work first within each course, with bounded page/attempt budgets and rotation so one saturated course cannot starve others. Admission locks institution then course accounts and atomically creates a generation-specific reservation/outbox. Settling refunds uses the same order and only once. Crash after release before scheduling is recovered by the next durable sweep; lease expiry rejects old metadata commits and accounts for physical orphan bytes separately. Size/structure/source failures are not quota waiters and do not hot-loop. Persistent capacity shortage remains blocked with sparse status checks. Proposed scan interval/budget is an engineering parameter to size under OQ-13/RR-06, not an approved service promise.

**UX consequence:** “Submission confirmed; preservation waiting for capacity” remains correct. Staff sees free bytes, reserved bytes, blocked work, last scan and actionable failures. Forecast remains advisory.

**Required proof:** 50 × 1 MiB archives, 2,048 MiB free, 100 MiB reservations: first 20 reserve 2,000; after completion 2,028 free; all remaining fitting work proceeds without staff retry/deletion/limit change. Test release/scan crash, duplicate settlement, competing institutions/courses, lease expiry and deterministic oversized archive. Measure bounded recovery with healthy dependencies.

**Scope:** Blocks capture integration and pilot reliance; not a global implementation block.

**Decision impact:** No AD-6/7 change; modify proposed AD-16 and existing scan mechanics under AD-13. No new AD.

### ACR-008 — Derive the account from the authenticated session

**Finding validity:** ACCEPT.

**Why:** The client lacks the local UUID required by IdentityRequestInput. This is onboarding incompleteness, not evidence that the server would accept someone else's account.

**Invariant:** Identity intake binds to the server-verified active GitHub account of the authenticated requester; a client need not supply or choose an internal account ID.

**Smallest sufficient repair:** Remove `github_account_id` from IdentityRequestInput. Resolve the current active account from session/user under existing server ownership rules. Preserve the account ID internally on request/binding history.

**Affected artifacts:** OpenAPI `IdentityRequestInput`, `requestIdentityLink`; API authentication/intake; DATA-MODEL identity request creation; GITHUB OAuth mapping; SECURITY intake; DELIVERY E2E-03; AD-18.

**Data-model consequence:** No new relation or public ID. Existing github_accounts active-user uniqueness and request FK suffice; persist the exact account selected at command time. Recheck account remains eligible at approval.

**API consequence:** Body contains classroom_id and academic_identifier only. Reject the removed property under additionalProperties:false. /me need not expose a new account selector. An inactive/missing current account yields a safe authentication/account-state failure, not guessed identity.

**Concurrency / distributed-effects consequence:** Short transaction validates session/account generation and stores request/audit/idempotent outcome. Account change concurrent with intake must serialize or conflict. Same-key replay returns original request and account association subject to current authorization; it never silently rebinds that request to a new account. New account/new intent uses a new key and the correction/lineage policy.

**UX consequence:** Student selects no technical UUID. GitHub login identity is shown for human confirmation; academic association remains pending until teacher approval. A stale account asks for reauthentication/new request, not silent substitution.

**Required proof:** Fresh login with no memberships plus invitation can form valid request using only documented data; foreign account property rejected; changed-account race; original replay; unmatched academic identifier remains non-enumerating.

**Scope:** Blocks identity intake implementation contract.

**Decision impact:** No AD change; modify proposed AD-18's intake detail. No new identity provider or AD.

### ACR-009 — Current request version is readable

**Finding validity:** ACCEPT.

**Why:** ResolutionInput requires expected_version while GET returns the versionless closed receipt schema. An immutable resolution's constant version is not the mutable request's version.

**Invariant:** A teacher resolves precisely the request state inspected, or receives a stale-state conflict. Original acknowledgement and receipt facts remain immutable across later status changes and replays.

**Smallest sufficient repair:** Keep SubmissionReceipt as the original POST acknowledgement. Define `SubmissionRequestStatus` for current GET and ACR-006 collections, including immutable receipt data, current validation/classification, nullable Submission reference, current resolution reference and request `row_version`.

**Affected artifacts:** OpenAPI `getSubmissionRequest`, new collections, `SubmissionReceipt`, new status schema, `ResolutionInput` and `AcademicResolution`; API replay/CAS; DATA-MODEL request/resolution versions; STATE-MACHINES; DELIVERY.

**Data-model consequence:** Reuse submission_requests.row_version. Define exactly what increments it: validation lifecycle transitions, confirmation/rejection and effective academic resolution changes. Merely logging a retry/heartbeat that does not change the inspected state does not increment it. Store append-only resolution predecessor and resulting request version with command outcome. Prevent competing successors by request lock/CAS, with constraint where applicable. Immutable resolution rows remain immutable.

**API consequence:** GET exposes the request's current version; resolution input compares that same version. Return resulting request version with resolution outcome so clients may refresh deliberately. Use an exact JSON representation consistent with existing bounded integer contract; if bigint range is widened later, change all associated input/output schemas together. Original POST replay returns its original body/status/Location, not freshly reconstructed mutable status.

**Concurrency / distributed-effects consequence:** Validate current authority, lock request, compare expected_version, append resolution/update state and version/audit/outbox/idempotent outcome atomically. Background validation uses the same aggregate protocol, so a stale worker cannot overwrite a human decision. Persist the original safe acknowledgement in idempotency storage or reconstruct solely from immutable acknowledgement fields; never from today's status. No provider call within this transaction.

**UX consequence:** On 409, refresh and show what changed before asking the teacher to decide again. Never auto-resubmit a rejection against an unseen state using a new version. Receipt time remains constant.

**Required proof:** Two teachers inspect N; one commits N+1; the other's command conflicts without mutation; refreshed decision succeeds; worker race; exact command and original intake replay. Confirm separate request-version versus immutable-resolution-version semantics.

**Scope:** Blocks resolution implementation.

**Decision impact:** No adopted AD change; modify proposed AD-13/14. No new AD.

### ACR-010 — Express rejection independently of classification

**Finding validity:** ACCEPT.

**Why:** The state machine permits teacher rejection, but the closed wire schema cannot express it. Reason text and punctuality classification cannot safely substitute for a transition command.

**Invariant:** Technical rejection, exceptional confirmation and later academic reclassification are distinct explicit decisions, each with state/authority/evidence guards. Classification never validates a nonexistent SHA or unauthorized actor.

**Smallest sufficient repair:** Keep POST `/submission-requests/{id}/resolutions`, introduce `SubmissionResolutionInput` with a required decision discriminant: `reject`, `confirm_exception`, `reclassify`. Preserve mandatory nonblank reason, confirm=true, expected_version and idempotency. Split the currently shared incident input into `IncidentResolutionInput` so request-confirming actions cannot appear on an incident without a receipt.

**Affected artifacts:** OpenAPI both resolution routes and input/output schemas; API submission/incident semantics; STATE-MACHINES request/classification; DATA-MODEL academic_resolutions; SECURITY teacher-only decisions; DELIVERY E2E-08/09.

**Data-model consequence:** Add resolution decision and resulting state/version, retaining append-only predecessor and exactly-one request/incident FK. A reject outcome does not need a new punctuality enum or a zero grade. Leave prior classification history intact; current display always pairs it with validation state.

**API consequence:** Discriminated closed schemas: reject accepts needs_review only, has reason and no caller-supplied classification; confirm_exception accepts needs_review only with explicit exception classification/evidence basis; reclassify accepts confirmed requests only and cannot change validation. Do not allow unresolved as a completed exception outcome. `not_applicable` needs no-deadline policy; `on_time/late` need a justified timing basis; `exempt` explicitly records the exception. These are proposed subordinate semantics, not new approved eligibility rules. Teacher rejection may leave underlying classification unresolved; it never reads “confirmed on time.” Incident resolution stays separate and creates no Submission.

**Concurrency / distributed-effects consequence:** Use ACR-009 request CAS. For exceptional confirmation, perform provider observation outside the transaction, persist admissible evidence, then recheck its binding and state inside the confirming transaction; if still insufficient, do not confirm. Atomically insert at most one Submission with inherited sequence and its snapshot/outbox. Rejection is terminal for that request; a new intent requires a new operation, not reopening history. Reclassify appends without rewriting original deadline or receipt.

**UX consequence:** Separate “Reject request,” “Confirm with academic exception” and “Reclassify confirmed submission.” Preview exact request/SHA and safe explanation. Student sees rejected with reason, never zero or deletion of an earlier grade. Internal administrative evidence is not automatically public.

**Required proof:** Valid explicit reject; missing/unknown action rejected; classification-only payload invalid; stale version and exact replay; invalid actor/SHA cannot confirm; concurrent confirmation creates one revision; rejected latest request does not replace latest confirmed; incident cannot become a fabricated receipt. Unit transition matrix + API/DB/E2E.

**Scope:** Blocks submission review implementation.

**Decision impact:** Clarification of AD-5's separate axes, modification to proposed AD-14; exact action/guard semantics require proposal approval. No new AD.

### ACR-011 — Independent incident detection and delivery

**Finding validity:** ACCEPT.

**Why:** In-app notices depend on the DB/API they are expected to report as unavailable. Health endpoints are observables, not an independent observer or delivery route.

**Invariant:** Failure of API, PostgreSQL, worker processing or the notice store does not by itself suppress incident notification to the responsible operator. Missing telemetry is a monitored failure, not “healthy.”

**Smallest sufficient repair:** Use the selected hosting/monitoring service or a minimal external uptime observer and one independent operator delivery channel. Keep user product notices in-app. Reuse existing health/metrics and worker progress telemetry; no product email subsystem.

**Affected artifacts:** OPERATIONS alarms/runbooks; DELIVERY deployment/Done; ARCHITECTURE telemetry arrow; EVIDENCE R-11/OQ-10/OQ-13/RR-07; SECURITY monitor credential scope.

**Data-model consequence:** No academic table. Operational configuration needs owner/escalation destination, detection thresholds and deduplication/recovery policy. Independent service retains incident state when the app DB is unavailable.

**API consequence:** No new public business route. Existing liveness/readiness must distinguish live process from functional DB readiness; protected metrics/worker heartbeat may be consumed by the observer. Expose no student data or secrets in external probes.

**Concurrency / distributed-effects consequence:** No academic transaction or queue dependency for alert delivery. Monitor API/DB reachability and worker progress or externally received heartbeat age; detect missing signals if metrics collection itself fails. Retry/deduplicate operational alerts independently; acknowledge and escalate according to an owned runbook.

**UX consequence:** Operator receives actionable failure and recovery messages outside the platform. Users get truthful unavailable/pending views when reachable; the platform never invents receipts for attempts made during an outage.

**Required proof:** Stop API, DB, all workers and notice delivery separately; operator receives alert within the agreed bound. Test stuck-but-live worker, observer/heartbeat loss, deduplication and recovery notification. OQ-13 chooses actual targets/coverage; RR-07 executes them.

**Scope:** Blocks pilot operations; does not block domain implementation design.

**Decision impact:** No adopted AD change. Modify R-11's operational interpretation under AD-11, not the approved stack. A new external operational dependency is proposed, with provider/owner still OQ-10/13; no new application component or AD required.

## 3. AD-5 — official reception boundary

**JUAN DECISION REQUIRED — AD-5**

DECISION retained: backend UTC, durable complete receipt before acknowledgement, inclusive deadline comparison, no client/commit timestamp authority, no fabricated receipts, and no automatic lateness from subsequent processing. OPEN QUESTION: exactly which trusted server event supplies received_at, particularly before internal contention.

### Options

**Option A — trustworthy ingress sample, durable acceptance later.** Sample backend UTC once the complete bounded request has reached the trusted application boundary, with server-bound authenticated actor/context, before DB pool/acceptance lock waiting. This is not TCP connect time, first-byte arrival, a client header or a slow request whose SHA arrives later. Persist that sample, exact payload identity, deadline/policy and timestamp provenance atomically in normal intake. No received acknowledgement before commit. The sample becomes official only for the operation that durably commits; store persistence/confirmation timing separately. Retries recover the original committed sample; if no commit survived, a retry takes a new sample. A restarted process cannot invent the old sample.

**Option B — protected DB intake point.** Keep database clock sampling after intake locks. Single DB clock and transaction make the boundary simple, but a legitimate pre-deadline ingress delayed internally can become late. This is a deliberate exclusion of lock waiting from the fairness promise and needs explicit approval; it cannot be called compliance with the stronger intent merely by renaming the wait.

**Option C — minimal durable reception stage before business locks.** A narrow receipt transaction appends a complete envelope using a server-issued context fixing actor, acceptance, SHA and policy; it samples time before business serialization and commits before later validation/ordering. A provisional arrival envelope missing policy/actor is not the AD-5 receipt and must not be shown as one. This can reduce lock coupling and preserve reception through later crashes, but it still waits for DB connectivity/pool/unique-key contention. If its official sample is after those waits, it does not fully protect all internal delay; if before, it shares A's clock/crash conditions. It adds a recovery phase and context-version protocol, not an excuse for another broker.

| Criterion | A: pre-wait server sample | B: post-lock DB sample | C: minimal durable receipt stage |
| --- | --- | --- | --- |
| Trustworthiness | Trusted full-request boundary, instance/clock provenance; compromised server remains inside trust boundary | DB clock gives one source; protected point is explicit | Complete authenticated envelope and server context needed; incomplete envelope is not receipt |
| Crash behavior | Before commit: no receipt; after commit: original sample recoverable | Same durable commit rule; pre-lock arrival not recoverable | Stage commit survives later failures; crash before stage commit still has no receipt |
| Multiple API instances | Clock synchronization/health and uncertainty bounds needed; intake sequence orders overlaps | Central DB time; transaction order independent of network arrival | Shared DB intake uniqueness; independent stages/instances need stable context and replay |
| Spoof resistance | Ignore user/proxy timestamps unless independently authenticated by a specifically trusted boundary; complete-body bound prevents early-byte reservation | Caller cannot set DB time | Context binds actor/resource/payload/policy; no reusable signed token permitting arbitrary backdating |
| Persistence | All approved receipt fields commit before 202; volatile arrival alone is not evidence after crash | All fields in current transaction | Complete first durable record required; no acknowledged skeletal receipt |
| Deadline fairness | Protects post-boundary lock/pool delay for committed requests; does not recover lost unpersisted attempts | Lock contention can make otherwise timely ingress late | Protects later business work; front-stage waiting still needs an explicit boundary |
| Complexity | Moderate clock provenance and policy-race handling; existing intake remains | Lowest mechanics, largest fairness tradeoff | Higher: two-stage lifecycle, context/recovery, admission and sequence semantics |
| Auditability | Store sample source/time uncertainty and receipt/persistence stages; no rewritten timestamp | Simple DB boundary, explicitly auditable waiting effect | Separate stage timings and causation; avoid presenting all as one receipt time |

### Cross-cutting policy/version rule

RECOMMENDATION under A: the applicable deadline/policy must be the trustworthy version effective at the chosen boundary, not silently the version current after waiting. Use immutable version/extension history and server-bound preview context as evidence; distinguish a preview's version from the effective version. Concurrent policy activation with uncertain ordering must preserve candidate versions, record the ambiguity and remain needs_review rather than automatically applying a newly shortened deadline. Do not pretend a pre-commit timestamp alone proves the actual commit order of a policy update. The authorized documentary repair must define a recoverable activation/version-order record and test this race under RR-04. Original receipts keep the policy actually applied and the ambiguity decision; later reclassification appends history.

RECOMMENDATION: evaluate proposed preview TTL at received_at, not at delayed validation time; require observed_at <= received_at <= expires_at and exact actor/binding/repo/SHA/policy association. This approves neither the existing five-minute value nor continuous branch membership: R-01 is still a distinct proposed eligibility rule. If clock uncertainty overlaps deadline/TTL or valid policy cannot be established, keep truthful receipt facts but no confirmed punctuality claim. Clock-health failure must not silently backdate or auto-classify late. The concrete threshold/operational response belongs to RR-04/OQ-13.

**Recommendation:** A best preserves the stated fairness intent with less new machinery than C. Accept that unpersisted attempts cannot be recovered as receipts, and that clock/policy uncertainty can require review. B is simpler technically but materially narrows protection from internal delay. C is a fallback only if measured intake coupling warrants its additional phase. Juan must select the boundary; neither this recommendation nor a load test decides the academic policy.

## 4. AD-7 — publication after verified deletion

**JUAN DECISION REQUIRED — AD-7**

This concerns a capture that existed and was verified physically deleted. It does not turn every pending/failed capture into a ban on grading: AD-6 explicitly separates confirmation/preservation and permits unavailable content. Current `acknowledge_unavailable_evidence` is an unadopted proposed exception, not authority to override AD-7.

**Option A — forbid that new official publication.** Preserve evaluation/draft/history; reject publication referencing required historical capture already verified deleted with a specific safe error. No zero, fallback grade or resurrection. This protects a strong preservation promise but can prevent legitimate late correction/appeal resolution.

**Option B — permit truthful unavailable-evidence publication.** Teacher explicitly acknowledges deletion, identifies the remaining assessment basis and publishes with an immutable unavailable-code annotation. The new publication cannot retroactively provide another twelve months of the deleted bytes. Existing metadata and academic history remain permanent. This is an explicit qualification to AD-7, not merely UI wording.

**Option C — exceptional publication only.** Default to A; allow a teacher to publish after an institutionally authorized, scoped exception with required reason, remaining evidence basis, student-safe explanation and immutable audit. Reuse existing authorization_grants; an institutional admin authorizes the exception but cannot publish the grade. A proposed allowlisted capability such as `publish_without_retained_code`, limited to the affected course/publication context and expiry, does not grant general grading authority. No dual-approval engine or new role.

| Criterion | A: forbid | B: teacher acknowledgement | C: scoped exception |
| --- | --- | --- | --- |
| Academic integrity | Strong availability precondition; may block sound assessment from other records | Teacher must substantiate remaining evidence; more discretion | Explicit responsible authority and evidentiary basis, less routine use |
| Appeals | May prevent necessary correction after retention expired | Permits appeal outcome with disclosed evidence gap | Permits justified appeal outcome with institutional oversight |
| Teacher workflow | Simple conflict, potentially a dead end | Smallest usable continuation | Additional grant step, using existing mechanism |
| Audit history | Rejected attempt and unchanged prior history | Immutable acknowledgement/basis and new publication | Also records grant, approver, scope and exception reason |
| Retention semantics | No impossible new byte promise for this branch | Explicit exception; no retrospective retention | Same qualification, confined to authorized exceptions |
| Misleading guarantees | Must not say old content was restored | Student sees deleted historical code clearly | Student-safe explanation required; internal justification remains restricted |
| Operational complexity | Lowest | Low schema/UI change | Moderate authority checks; requires an institutional owner |

**Recommendation:** C balances late academic correction with explicit accountability, while A is the simpler pilot alternative if no exception owner is available. B minimizes workflow friction but makes the retention exception broadly discretionary. No option is selected for Juan.

If B or C is selected, snapshot content availability at publication, prior deletion reference, exception/basis and safe explanation become immutable publication evidence; a new publication still explicitly references the original evaluation/Submission/scale and uses grade CAS. Any still-existing eligible evidence retains its existing floors; withdrawal never reduces them. Verify deletion phase in the same publication/retention transaction: a claim in progress remains a conflict, not a shortcut to the verified-deletion exception.

**Later recapture:** RECOMMENDATION for this minimal MVP repair is to keep retry of a verified-deleted snapshot disabled. Do not add recapture merely to evade this choice. If Juan separately allows it, it must be a new capture identity/provenance record linked to the historical Submission and deleted predecessor: exact SHA, new capture time/digest/mechanism/completeness, original deletion record untouched, its own quota/retention obligation. The existing U snapshot-per-Submission means this would require an explicit capture-history relation; do not silently reuse/overwrite the deleted row. Same SHA or even same archive digest does not prove earlier availability or restore the original capture. Any adopted recapture policy must define its new retention period and permission explicitly before enabling it.

## 5. Revised AD-12 through AD-18 proposals

Every entry below remains PROPOSED. Documentary repair approval and AD adoption are separate choices; none of these rows changes status.

| AD | Original problem | What review exposed | Revised proposal | Complexity added | Complexity removed | Findings addressed | Evidence still required | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-12 | Prevent tenant/reference and query leakage | Tenant equality does not prove all-course binding or request-list scope | Keep composite FKs/forced RLS; document affected-course activation scope, trusted lookup exceptions and ownership of both new request collections | Explicit profile/enrollment and authorization locking; scoped query predicates | No broad admin read bypass, no parallel academic identity store | ACR-001/006, supporting ACR-008 | Real-role FK/RLS, pool reuse, roster/authority races; OQ-12 access rule | MODIFY |
| AD-13 | Preserve intent and exact replay across crashes | Old remote grants survive DB fences; replay needs original versus current state distinction | Keep atomic domain/audit/outbox and inbox/pg-boss; add access-subject attempt accounting and truthful uncertain outcomes; original command response is durably retained | Narrow access attempt relation and reconciliation checkpoints | No exactly-once claim, no generic distributed transaction or saga framework; reuse sweep for quota | ACR-002/009; supports 003/006/007 | RR-02/03 and response-loss/stale-worker tests | MODIFY |
| AD-14 | Separate temporal/source/academic evidence | Revision allocation, discovery, read CAS and explicit rejection are incomplete; AD-5/R-01 needs disposition | Intake sequence; receipt versus current-status schemas; bounded request lists; explicit resolution variants; chosen AD-5 boundary and TTL reference recorded after Juan decides | One immutable sequence, status DTO, two GET routes, resolution discriminant | No confirmation counter or head-of-line validation queue; no classification-as-command | ACR-005/006/009/010 | AD-5 decision, R-01 review, RR-04; schema/DB/E2E | MODIFY |
| AD-15 | Serialize publication/withdrawal/retention and purge | Reopen ordering and cancellation replay missing; deleted-code publication exception unapproved | Retain grade CAS; classroom-before-snapshot coordination; cancel/start arbitration with ordered independent journal; apply only Juan-selected AD-7 branch | Retention generation/fence, journal phases, narrow operator cancellation contract | No snapshot-wide synchronous recalculation on reopen; no impossible rollback or pretend byte restoration | ACR-003/004; AD-7 choice | RR-05; competing publication/reopen/cancel/purge/restore tests | MODIFY |
| AD-16 | Bound private archive capture and quotas | Refund/reclaim needs liveness, not new quota values | Keep limits/private streaming/exact-SHA integrity; define once-only reservation settlement and fair existing sweep re-admission; prohibit stale metadata adoption | Sweep progress/budget and explicit accounting transitions | No new capacity-event service, broker or truncation policy | ACR-007; excluded S-03 remains a guard/test | RR-06 plus provider inventory aspects RR-05 | MODIFY |
| AD-17 | Prevent silent starter drift | No defeated before/after verification defense; provider reproduction remains unproved | Retain frozen same-org versioned templates, precheck/post-generation content comparison and quarantine before access | No new machinery | Avoid automated copy engine and unjustified Contents/Workflows write | No counted ACR directly; preserves template defenses | RR-03 real sandbox, actual tree/workflow equivalence and unknown-create handling | ACCEPT AS PROPOSED, conditional on RR-03; NOT ADOPTED |
| AD-18 | Protect identity lineage/current access without rewriting history | Fresh activation can bypass scope; account bootstrap absent; remote cleanup overclaimed | One activation rule across first/reapproval/replacement; session-derived account; predecessor audit; current local access versus per-account external uncertainty; OQ-12 explicit | Shared profile context/version and reuse of ACR-002 attempt records | Client UUID selector, endpoint-specific weaker reapproval; no new IdP | ACR-001/002/008 | Authority race/E2E; RR-03; OQ-12 historical access | MODIFY |

AD-17's recommendation repeats a conditional design acceptance, not new evidence. RR-03 is still open; no live sandbox exists by virtue of this round. No new AD number is allocated. ACR-011 refines existing operational R-11, so it does not justify manufacturing AD-19.

## 6. Cross-document change map — apply only after approval

| Artifact / exact area | Proposed change | Trace / authority |
| --- | --- | --- |
| ARCHITECTURE-SPINE.md AD-12–18 | Revise mechanisms; preserve PROPOSED tags; adopted policy text changes only for Juan's explicit AD-5/7 disposition | All ACR mappings in section 5 |
| ARCHITECTURE.md physical/ADR rationale | Explain narrow access/journal records and independent observer; keep same modules/processes/stack | ACR-002/003/011 |
| DATA-MODEL.md catalog/ERD/transactions/indexes | Identity activation context, per-account effects, request_sequence/status version, resolution decision, retention generation/journal phases and query indexes | ACR-001–010; no migration generation |
| STATE-MACHINES.md identity/access/request/grade/capture/deletion | Broader activation guard; uncertain external cleanup; request order; resolution variants; cancel/start phases and reopen fence | ACR-001–005/007/009/010 |
| SECURITY.md RBAC/threat model | Scope all activation paths; request collection permissions; teacher-only resolution; narrow operator cancellation; monitor scope; chosen AD-7 exception if any | ACR-001/002/003/006/008/010/011 |
| GITHUB.md collaborators/invitations/OAuth | Durable old/new subject attempts, invitation cleanup, conditional convergence; no expanded manifest | ACR-002/008; RR-03 |
| OPERATIONS.md job/checkpoint/capture/purge/recovery/alerts | Access attempt recovery, quota sweep, cancel/start journal, course lock/migration fences, independent alerts | ACR-002/003/004/007/011 |
| API.md common replay/submission/evidence | Current request vs original acknowledgement, scoped discovery, explicit decisions, order semantics and cancellation command; selected policy branches only | ACR-001/003/005/006/008/009/010; AD-5/7 |
| openapi.json paths/schemas/x-authorization | New request GET collections and cancellation POST; revised identity context/input, request status/sequence, resolution variants, repository/retention/publication projections | Concrete proposed route list below |
| reviews/build-contract.py document generator | If the contract is repaired later, update source definitions as well as generated JSON so regeneration cannot restore defects | Same wire changes; not an application implementation |
| DELIVERY.md tests/gates/Done | Add named regression proofs below; distinguish documentary repair/re-review from runtime closure | All 11; AD-5/7; RR-01–08 |
| EVIDENCE.md R-01/03/10/11 and OQ/RR tables | Record selected refinements only after approval; preserve remaining research and owner gates | No research closure from prose |
| README.md / REVIEW.md | Record completed independent review and targeted repair/re-review status; keep implementation unauthorized | Status reconciliation only |
| DISCUSSION.md / .memlog.md | Later add explicit supersession/decision evidence; retain chronology; do not recast past proposals as approvals | No writes in current phase |
| reviews/anti-consensus/* | Preserve as immutable review input; no rewriting findings as fixed | Later repair/re-review records refer to ACR IDs |

### Concrete proposed route/schema delta

Base remains `/api/v1`. Add GET acceptance submission-requests and GET classroom submission-requests (ACR-006), and narrowly scoped POST deletion-operation cancellations (ACR-003). Reuse getOperation for async cancellation status; no general deletion endpoint. Keep all existing submission/publication routes and teacher authorization. No new provider resources.

Change requestIdentityLink's body to session-derived account; decideIdentityLink/correctIdentityBinding require inspected profile context in addition to target version. getSubmissionRequest and new collections return SubmissionRequestStatus; POST submitRevision retains original SubmissionReceipt. Add request_sequence to receipt/status and inherit revision on Submission; CurrentGrade explicitly distinguishes latest request, latest confirmed and evaluated revision. Split SubmissionResolutionInput from IncidentResolutionInput; extend AcademicResolution with decision/resulting request version without confusing its immutable row version. Enrich Repository/AcceptedAssignment cleanup projections and Classroom retention state. If Juan selects AD-7 B/C, replace the acknowledgement-only publication branch with its selected basis/authority/immutable evidence annotation; if A, remove that override. Do not preempt his selection.

### Shared transaction and permission checks

The authorized repair pass must compare every route to its read prerequisites, write result, idempotency replay and state transition. Establish one compatible lock order before editing diagrams: idempotency claim, profile/account authorization context when needed, sorted scoped authority/course rows, acceptance/current-grade when needed, request/snapshot/operation. Operations using only a subset retain relative order; audit and outbox append inside the same transaction. Quota accounting uses its independent institution→course account order and does not reverse into retention locks. Background jobs use the same narrow command rules, not broad privileges. No new PostgreSQL transaction spans GitHub/object/journal I/O.

This is a required consistency constraint, not an assertion that every future lock implementation has already been tested. New mutexes must not create an identity→course/course→identity inversion through roster imports or closure. Deferred domain tests include enrollment, authorization grants and all worker profiles.

## 7. Required tests and experiments

All items are **RESEARCH REQUIRED / planned proof**, not executed. Test definitions are architecture artifacts; tests/fixtures, migrations, sandbox resources and runtime work require later explicit authorization.

| Proof ID | Required evidence / pass criterion | Method / owner | ACR / existing gate |
| --- | --- | --- | --- |
| RP-T01 | First/reapproved multi-course identity cannot activate unauthorized scope; legitimate teacher grant works; enrollment/role race cannot escape | Real PostgreSQL constraints/RLS, controlled barriers, E2E; Mary/Winston/Amelia | 001, AD-12/18, OQ-12 |
| RP-T02 | Fresh session starts identity request without local account UUID; account-switch race/replay preserves exact actor | API/schema and E2E; Sally/Amelia | 008, E2E-03 |
| RP-T03 | Late grant after revoke/read plus worker crash stays visible and is reconciled, including invitations | Provider simulator plus real sandbox; Winston/Amelia | 002, RR-03 |
| RP-T04 | Canceled exported generation survives older-DB restore; no irreversible start after winning cancel; incomplete journal quarantines | Crash matrix/tabletop then synthetic object/DB restore; Winston/operator | 003, RR-05 |
| RP-T05 | Reopen/policy fence wins against later purge; earlier claim disclosed; hold/publication/cancel order consistent | Real-DB barriers and fault rehearsal; Winston/Amelia | 004, RR-05/07 |
| RP-T06 | A admitted before B, confirms after B and B's publication; latest remains B; pending/rejected gaps truthful | Unit/API/DB/E2E; Mary/Sally/Amelia | 005, RR-04 |
| RP-T07 | New browser/staff can recover all scoped current requests without saved keys; no foreign enumeration; cursor refresh works | API/E2E and negative RLS; Sally/Amelia | 006 |
| RP-T08 | Current version can form a legal reject/exception/reclassify command; stale versions conflict and no duplicate outcomes | Chained API schemas, DB concurrency/E2E; Mary/Amelia | 009/010 |
| RP-T09 | 50 fitting captures/2 GiB finish without manual changes; fair sweep survives refunds/crash/double settlement | Real queue/DB and controlled capture workers; Amelia | 007, RR-02/06 |
| RP-T10 | Predeadline full request delayed by pool/lock; chosen time policy, policy activation and clock uncertainty remain truthful | Controlled clocks/barriers and 50-submit load; Mary/Winston/Amelia | AD-5, RR-04/07 |
| RP-T11 | Verified-deleted publication follows Juan-selected branch; no fake retained bytes or inherited grade; withdrawal floor unchanged | Policy/tabletop then API/DB/E2E; Mary/Sally/Amelia | AD-7, RR-05 |
| RP-T12 | API/DB/worker/notice-store and telemetry failure independently alert owner within agreed bound | Real hosting fault drill, external receipt evidence; John/operator | 011, OQ-13/RR-07 |
| RP-T13 | Unaffected invariants survive: formative cannot publish; decimal exactness; grade CAS/withdrawal; exact SHA and hostile archive guards | Existing E2E-06/12–18/20/21/25 plus focused regression; Amelia | AD-1/4/6/7/8/9; RR-03/06 |
| RP-T14 | Selected pins/peers/runtime roles, pg-boss lifecycle and frozen-template reproduction actually work | Authorized dependency/DB/GitHub spikes; Amelia/Winston | RR-01/02/03; AD-17 conditional |

Use fixture/version/configuration IDs, explicit barriers and expected-versus-observed evidence; retain failure output. A valid OpenAPI schema alone does not prove a user can chain its operations. A sandbox success does not prove an upper bound on every remote request or recoverable backup.

### Documentary technical evidence consulted this round

FACT: PostgreSQL documents row locks held to transaction completion and the need to avoid inconsistent acquisition order. This supports considering a common local lock, not proof of our proposed multi-command protocol. [PostgreSQL 18 explicit locking](https://www.postgresql.org/docs/18/explicit-locking.html).

FACT: PostgreSQL distinguishes transaction/statement time from clock_timestamp's actual call time. Changing the function cannot decide the academic receipt boundary. [PostgreSQL date/time functions](https://www.postgresql.org/docs/18/functions-datetime.html).

FACT: GitHub documents collaborator operations separately from repository invitations, including invitation listing/deletion. The proposal must reconcile both surfaces; no remote generation fence or settlement-time guarantee is inferred. [Collaborators](https://docs.github.com/en/rest/collaborators/collaborators), [repository invitations](https://docs.github.com/en/rest/collaborators/invitations). These read-only documentary checks close none of RR-02–07; exact minimal permissions and real behavior remain RR-03. No new dependency-version claim is made.

## 8. Remaining OPEN QUESTION and RESEARCH REQUIRED registers

Preserve existing IDs and authority in [EVIDENCE.md](../../EVIDENCE.md). No item is closed here.

| OPEN QUESTION | Required input / owner | Gate and proposal effect |
| --- | --- | --- |
| OQ-10 | Hosting/object account, region/residency, budget, operator; Juan/institution/Winston | Before provisioning/provider-specific reliance; includes choosing existing monitoring/alert service. S3 still only recommended |
| OQ-11 | Named org/App administrators and actual policies; institution | Before pilot and authorized live sandbox; dedicated-org decision stays adopted |
| OQ-12 | Non-publication PII, appeals and access after withdrawal/identity correction; Mary/institution | Before real student data; unresolved historical access blocks those paths. ACR-001 must not invent cross-course historical authority |
| OQ-13 | Numeric SLO/RPO/RTO, support coverage and accountable alert recipient; John/operator | Before pilot acceptance; supplies sweep/clock/alert budgets, not guessed guarantees |

| RESEARCH REQUIRED | Still missing | Gate retained |
| --- | --- | --- |
| RR-01 | Exact artifact/peer/engine/driver/plugin resolution, reproducible build/typecheck, licenses/advisories/SBOM | Before implementation baseline accepted; no lockfile generated here |
| RR-02 | Selected PostgreSQL/pg-boss restricted-role runtime, migrations, queue/partition maintenance, restart/restore | Before integrated queue reliance; documentation alone insufficient |
| RR-03 | Real GitHub App/OAuth/installations/minimal permissions/templates/access/invitations/webhooks/Actions sandbox | Before integration marked proven; AD-17 remains conditional |
| RR-04 | Chosen receipt policy, temporal observation/TTL/force-push/clock/policy-race and delayed confirmation proof | Policy/protocol before confirmation implementation; experiments before integrated guarantee |
| RR-05 | Provider recoverable versions/replicas/backups, cancellation journal and purge/restore completeness | Before destructive production and any pilot deletion promise; extra 30-day backup bound unverified |
| RR-06 | Hostile archive/LFS/submodule scope, bounds, quota accounting/fair recovery, stale transfer/orphan behavior | Before capture integration/pilot evidence reliance |
| RR-07 | Container/hosting grants, pools/load, independent alerting, restore/failure controls | Before pilot |
| RR-08 | Independent protected authoritative evaluator, provenance/secrecy/exfiltration proof | Future only; no MVP blocker or execution subsystem |

R-01 preview semantics/TTL, R-03 reverse uniqueness/authority, R-04 S3, R-05 template mechanics, R-06 operational limits, R-07 scalar/session/workspace defaults, R-08 extensions/CSV/scope, R-09 calendar-month calculation and other unaffected recommendations retain their status. This proposal revises selected R-01/03/10/11 mechanics but does not adopt the rest by reference. Assumptions A-01–05 remain unverified premises, not new approvals.

## 9. Scope-creep and closure check

| Check | Outcome |
| --- | --- |
| Redis, Kafka, new broker, microservices, distributed transactions | None proposed |
| New identity provider / SSO | None proposed |
| Authoritative autograding in MVP | Excluded; RR-08 Future only |
| Academic source of truth | PostgreSQL unchanged; provider observations never become grading authority |
| Separate evidence/state axes | Preserved: receipt, validation, classification, revision, capture, evaluation, publication |
| Extra data/protocol machinery | Narrow access attempts and deletion journal phases justified by ACR-002/003; reuse existing tables/roles where sufficient |
| New business API surface | Two recovery GET collections and one scoped operator cancellation POST; no generic admin/GitHub API |
| New operational dependency | Independent observer/delivery for ACR-011; prefer existing hosting monitoring. Vendor/owner unselected, no resources created |
| Recapture engine / template-copy engine | Not proposed for this repair |
| Retention values / grade values / GitHub permission expansion | None changed |
| Long DB transactions over provider calls | Prohibited; durable phases and short local transactions |
| Independent findings/history | Preserved, not edited or marked fixed |

**What remains open after this proposal:** All ACR-001–011 remain OPEN: a proposal is not an applied or verified fix. If Juan authorizes and the documentary repairs pass targeted independent re-review, the 11 documentary gaps can be recorded as addressed in design, separately from unexecuted tests. Do not mark operational closure at that point. In particular ACR-002 still needs RR-03; ACR-003/004 need RR-05; ACR-007 needs RR-06; ACR-011 needs named operations and RR-07. Identity/API/order repairs still need their actual DB/API/E2E proofs. AD-5 and AD-7 remain policy blockers until explicitly decided; OQ-12 also gates historical access. No nonfinding is promoted into a twelfth ACR.

## 10. Exact approval requests and next action

1. **Documentary repair authorization:** Approve or amend this bounded 11-ACR repair plan, including the initial/reapproval all-affected-course policy, visible uncertain GitHub cleanup, cancellation cutoff/journal protocol, course lock, intake sequence with gaps, request lists, quota sweep, session-derived account, readable CAS and explicit resolution variants. This authorizes a later documentation pass only, not code or runtime experiments. Any material alternative should be recorded before applying it.
2. **JUAN DECISION REQUIRED — AD-5:** Choose A, B or C and approve the corresponding receipt/policy/clock-uncertainty semantics. Recommendation A; explicitly state whether full-request ingress before internal waiting is the protected boundary. R-01's five-minute historical branch-observation rule is still unadopted; decide it with the temporal repair or leave confirmation eligibility blocked.
3. **JUAN DECISION REQUIRED — AD-7:** Choose A, B or C for publication after verified code deletion. Recommendation C using a scoped grant to a teacher, with truthful unavailable evidence and no new byte-retention promise for the deleted capture; A is the simpler pilot alternative. Recommendation: keep post-deletion recapture out of this MVP repair. B/C materially qualify the adopted retention promise and therefore require an express decision, not approval inferred from a boolean field.
4. **Proposed AD status:** Authorize revisions to AD-12–18 as PROPOSED only, if desired. This round does not ask to adopt them. AD-17 remains conditional on RR-03. There is no new proposed AD.
5. **Operational closure later:** Assign OQ-10–13 owners/inputs and authorize specific experiments separately when ready. They need not all be answered to approve a documentary plan, but their dependent gates remain blocked. No retain-only pilot exception, external alert destination or live sandbox is created/approved by silence.

Would any repair materially alter AD-1–AD-11? Most repairs enforce their existing intent. AD-5 explicitly locates a previously ambiguous boundary; selecting B would narrow the now-stated delay protection. AD-7 B/C expressly qualify the twelve-month publication retention promise for verified-deleted captures; A imposes a new publication precondition. ACR-001's initial multi-course scope and ACR-003's cancellation cutoff refine previously proposed mechanics and are called out for approval, not silently labeled historical decisions. Other adopted grading, snapshots, withdrawal, tenant and stack rules stay intact.

**Recommended next action:** Juan dispositions the above policy choices and authorizes the documentary repair scope. Then apply only the approved changes, reconcile generator/OpenAPI/docs/history, run consistency checks and submit the repaired counterexamples to a targeted independent re-review. Implementation and provider/runtime experiments require their own explicit authorization. **STOP here: do not apply repairs, modify AD status, update memlogs or authorize implementation.**
