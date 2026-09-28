# Consolidated independent findings

Review completed 2026-09-17. **11 distinct findings: CRITICAL 0; HIGH 6; MEDIUM 5; LOW 0; INFO 0.** Findings are documentary counterexamples or contract gaps, not executed exploits. Likelihood and detectability are qualitative judgments, not measurements. No original design has been corrected by this review. All fixes below are RECOMMENDATION. AD-1–AD-11 remain adopted; AD-12–AD-18 remain proposed.

Stable ACR identifiers below are the final register. Original reviewer-local IDs and severity disagreements are preserved, not discarded. Policy questions about AD-5 and AD-7 are separately evaluated in [DECISION-CHALLENGES.md](DECISION-CHALLENGES.md); they are not padded into defect counts.

| ID | Severity | Defect | Origin |
| --- | --- | --- | --- |
| ACR-001 | HIGH | Reapproval may bypass correction-equivalent course authority | Level LV-03 |
| ACR-002 | HIGH | In-flight remote grant can complete after locally completed revocation | Level LV-04 |
| ACR-003 | HIGH | Independent deletion journal cannot reconstruct permitted cancellation | Splinter S-01 |
| ACR-004 | HIGH | Reopen and purge lack a shared specified serialization point | Splinter S-02 |
| ACR-005 | HIGH | Confirmation order can reverse the meaning of latest submission revision | Wildcard W-01 |
| ACR-006 | HIGH | Durable unconfirmed requests have no discoverable recovery collection | Killjoy ACR-901 |
| ACR-007 | MEDIUM | Capacity refunds do not explicitly wake quota-blocked captures | Wildcard W-02; Splinter S-04 |
| ACR-008 | MEDIUM | First identity request requires an unavailable local account UUID | Level LV-01; Killjoy ACR-903 |
| ACR-009 | MEDIUM | Resolution requires a CAS version absent from current request read | Level LV-02; Killjoy ACR-902 |
| ACR-010 | MEDIUM | Teacher rejection transition has no expressible API command | Wildcard W-03 |
| ACR-011 | MEDIUM | In-app-only incident alerts depend on the failed service | Killjoy ACR-904 |

## ACR-001 — Reapproval after revocation can bypass correction-equivalent authority

- **Severity / category:** HIGH / identity authorization transition gap. Conditional bypass, not a demonstrated running takeover.
- **Affected files / AD:** SECURITY.md:17–18; DATA-MODEL.md:37,145; STATE-MACHINES.md:30; openapi.json:5170–5173,5340; ARCHITECTURE-SPINE.md:125. AD-3; proposed AD-18.
- **Description / evidence:** ordinary approval requires a scoped course teacher; correction requires all affected courses or an institutional grant. Active-binding uniqueness does not protect a previously revoked binding. Existing acceptance authorization follows the academic profile's current binding.
- **Preconditions:** profile enrolled in courses A and B; its former binding was legitimately revoked by an authorized actor; teacher T controls only A; another authenticated account requests that profile through A. T is not assumed able to perform the original all-course revocation.
- **Sequence:** revoke old binding → no active uniqueness collision → T approves new request through ordinary approval → new institution-wide binding may be used to authorize profile-based acceptances in B.
- **Expected result:** identity continuation affecting B requires the same authority as correction. **Problematic result:** classifying the operation by endpoint instead of lineage can grant B access without B's required authority. Whether that access follows automatically is precisely the missing transition rule.
- **Impact:** conditional cross-course impersonation/private evidence access. No cross-institution escape is established.
- **Estimated probability:** medium for a straightforward endpoint-specific implementation; depends on unresolved authorization interpretation. **Detectability:** low in ordinary approval audit because T appears valid for A; two-course negative test exposes it.
- **Existing defenses:** all-course correction scope, transactional approval and partial active uniqueness oppose active overwrite. They do not explicitly classify approval after revocation, or initial approval of an already multi-course profile.
- **Recommendation:** make reactivation/reapproval a lineage transition with correction-equivalent authorization and predecessor history; serialize on the profile even when no active binding exists. Specify initial multi-course approval scope too.
- **Blocks implementation:** yes, identity authorization contract before implementation; no need to revoke AD-3 or require SSO.
- **Proof required:** two courses, revoked predecessor, single-course teacher and new claimant; reject unintended B activation without the required scope/grant. Prove legitimate all-course recovery, uniqueness under concurrent requests, preserved historical authors and correct current access.

## ACR-002 — Local generation cannot fence an already-issued GitHub grant

- **Severity / category:** HIGH / distributed authorization and recovery.
- **Affected files / AD:** OPERATIONS.md:7,12; GITHUB.md:27,47; STATE-MACHINES.md:48; SECURITY.md:63. AD-3/10; proposed AD-13/18.
- **Description / evidence:** the statement that an old generation cannot grant revoked access is stronger than local pre-call/post-call generation checks. The collaborator PUT/DELETE does not carry the platform's DB fence.
- **Preconditions:** valid grant g issued but delayed; binding revoked at g+1; App still permitted to manage collaborators.
- **Sequence:** W1 validates g and sends PUT → g+1 revocation commits → W2 DELETE/read sees absent user and marks revoked → earlier PUT completes, granting or inviting old account → W1 crashes before corrective action.
- **Expected result:** a completed revocation is not silently undone by an old platform request. **Problematic result:** DB may remain revoked while GitHub admits old access; rejecting W1's DB update does not undo GitHub.
- **Impact:** private repository access after local revocation; later repair cannot undo downloaded code.
- **Estimated probability:** uncommon but credible with delayed provider calls and worker crash. **Detectability:** medium through recurring effective-access checks, low in DB-only fencing tests.
- **Existing defenses:** explicit revocation_pending, durable reconciliation, read-before-repeat and external-owner caveat are credited. Finding concerns the platform's own late call and premature completion claim, not independent owner grants or absence of all reconciliation.
- **Recommendation:** durably track unresolved older effects; reconcile after stale completion/crash, including pending invitations; distinguish immediate local authorization revocation from observed external cleanup. Specify escalation and recurring repair when remote completion cannot be bounded. Do not hold DB locks across slow provider calls as a substitute for a distributed protocol.
- **Blocks implementation:** true external completion semantics must be defined before revocation implementation; provider behavior/recovery proof blocks access-worker integration.
- **Proof required:** delay grant until after successful DELETE/read, kill original worker, then recover. Uncertain exposure remains visible; late grants/invitations are discovered and removed. Real GitHub sandbox validates invitation/access behavior separately; do not claim instantaneous remote revocation.

## ACR-003 — Exported purge intent outlives an unrecorded cancellation during restore

- **Severity / category:** HIGH / recovery and evidence retention.
- **Affected files / AD:** OPERATIONS.md:47–49; DATA-MODEL.md:68–69; STATE-MACHINES.md:99; EVIDENCE.md:58. AD-7; proposed AD-15.
- **Description / evidence:** purge exports a tombstone before destruction; operator may cancel before irreversible deletion after checking bytes. No independently durable cancellation/supersession protocol is defined for the authoritative restore journal.
- **Preconditions:** tombstone exported; bytes still present; authorized cancellation and later preservation obligation exist beyond the restored DB backup.
- **Sequence:** claim/export g → cancel g with bytes verified → place hold → lose current DB → restore older DB plus current independent journal. Journal retains g but has no specified surviving cancellation fact.
- **Expected result:** legitimate cancellation and preserved evidence survive disaster recovery. **Problematic result:** replay may delete valid bytes, or conservative quarantine leaves them unusable because the missing cancellation cannot be reconstructed.
- **Impact:** potentially irreversible evidence loss under destructive replay; otherwise serious recoverable availability failure.
- **Estimated probability:** low-frequency cancel-plus-restore combination. **Detectability:** low when the journal appears authoritative; explicit crash/replay test detects it.
- **Existing defenses:** export-before-delete, isolated restore, verification and allowed quarantine are substantial. Accordingly this is HIGH, not a claim that every restore causes CRITICAL loss.
- **Recommendation:** append ordered generation-scoped cancellation/supersession to the same independent journal before acknowledging cancellation; distinguish prepared, irreversible-started, verified and canceled. Alternatively deliberately prohibit cancellation after journal export. Ambiguous histories must quarantine, not delete.
- **Blocks implementation:** yes for destructive purge/recovery protocol; unrelated reversible modules require their own authorization.
- **Proof required:** cancel after export at every crash point, including journal-success/DB-ack-failure; restore DB predating cancellation with current journal. Canceled objects remain available, uncanceled deleted objects remain inaccessible, repeated replay is stable.

## ACR-004 — Asynchronous reopen cannot by itself serialize against purge

- **Severity / category:** HIGH / retention concurrency.
- **Affected files / AD:** OPERATIONS.md:25,43,47; DATA-MODEL.md:79; STATE-MACHINES.md:99; openapi.json:3577. AD-7; proposed AD-15.
- **Description / evidence:** reopening must suspend deletion eligibility, but bulk recalculation is asynchronous. Specified purge claim locks the snapshot; no shared course generation/lock or equivalent isolation protocol establishes ordering with reopen.
- **Preconditions:** expired snapshot awaiting purge; concurrent reopen; delayed retention recalculation.
- **Sequence:** purge reads old course eligibility → reopen commits course/outbox → purge locks snapshot and claims using old eligibility → deletion runs before recalculation. Even a fresh course read without serialization permits read-before-reopen/claim-after-reopen.
- **Expected result:** a reopen committed before the winning purge claim prevents that claim. **Problematic result:** the named snapshot-only algorithm cannot establish the required order; conversely a purge that already won must be disclosed by reopen.
- **Impact:** deletion of evidence in a reopened course or a false preservation promise.
- **Estimated probability:** medium near expiry/reopening operations. **Detectability:** low before bytes disappear, retrospective audit can reveal ordering.
- **Existing defenses:** active-course retention and rejection of new retention are explicit invariants. This finding identifies missing enforcement mechanics, not permission to disregard them. Shared hold/publication snapshot fencing is not defeated by this schedule.
- **Recommendation:** specify shared course eligibility generation/lock or equivalent serializable conflict protocol for reopen, policy migration and purge; deterministic lock order; synchronous eligibility fence and asynchronous bulk projection updates. Define purge-first response.
- **Blocks implementation:** yes for reopen/purge concurrency contract; repairs AD-7 without revoking it.
- **Proof required:** barrier tests around course read, reopen commit, snapshot lock and purge claim; a successful claim must prove an earlier winning order or reject. Repeat for policy migration and many snapshots.

## ACR-005 — Confirmation-time numbering can invert submission intent

- **Severity / category:** HIGH / academic ordering and UX.
- **Affected files / AD:** DATA-MODEL.md:42,147,153; STATE-MACHINES.md:81; openapi.json:16049,17665. AD-2/4/5; proposed AD-14.
- **Description / evidence:** revision counter allocated at confirmation, with revision-descending queries and latest/newer grade projections. Receipt order and confirmation order are not distinguished.
- **Preconditions:** A then B are legitimate distinct-key submissions for one acceptance; A validates slowly or needs review; B deliberately supersedes A.
- **Sequence:** A received 23:58 → B received 23:59 → B confirms as revision 1 → teacher publishes B → A later confirms as revision 2.
- **Expected result:** B remains the latest submitted intent; late processing of A is not a new student action. **Problematic result:** highest revision becomes A, so an implementation using revision order displays older work as newer and flags a false reentrega. If receipt order is intended instead, the two orders need explicit naming.
- **Impact:** wrong latest-work selection and misleading pending-evaluation indicators; potential manual evaluation of older work. Fixed grade references prevent automatic grade retargeting.
- **Estimated probability:** medium during delayed validation/review. **Detectability:** low without reversed-completion tests; receipt audit exposes it.
- **Existing defenses:** unique request and acceptance lock prevent duplicate/equal revisions, not chronology inversion; fixed evaluation references remain effective.
- **Recommendation:** allocate immutable request sequence under existing intake lock and inherit it on confirmation, allowing gaps; distinguish latest intent, latest confirmed and graded revision. Alternatively explicitly name separate confirmation sequence. Do not block all validation behind one needs_review request.
- **Blocks implementation:** yes for submission ordering/projections; no adopted policy revocation required.
- **Proof required:** A-before-B intake, B-before-A confirmation, B publication before A resolution; B remains latest intended confirmed work, no false newer-intent indicator. Include rejected gaps, same-SHA/new-key requests and retries.

## ACR-006 — Unconfirmed durable requests cannot be enumerated for recovery

- **Severity / category:** HIGH / API recovery workflow.
- **Affected files / AD:** API.md:25–29; STATE-MACHINES.md:54–66; OPERATIONS.md:25; openapi.json:2947,8179,8502,8641,15134. AD-5; proposed AD-13/14.
- **Description / evidence:** GET by known request UUID exists; submissions collection contains only confirmed rows. Dashboard exposes needs_review count but no request IDs. Complete path inventory has no request collection/staff review filter; notices do not guarantee complete request discovery.
- **Preconditions:** durable request reaches needs_review before a Submission exists; fresh browser loses local UUID/key, or a different teacher must resolve it.
- **Sequence:** receipt commits → worker needs_review → teacher sees count 1 → confirmed submissions list lacks item → single-request GET/resolution requires an undiscoverable UUID.
- **Expected result:** staff can discover every reviewable request; student can recover own durable requests after restart. **Problematic result:** normal recovery requires raw DB access or undocumented endpoints.
- **Impact:** a class of persisted requests becomes operationally stranded, potentially across a deadline outage. Rows survive; no irreversible loss is asserted.
- **Estimated probability:** high conditional on ordinary needs_review/fresh-session cases. **Detectability:** visible count/list mismatch; users cannot resolve it through the API.
- **Existing defenses:** durable intake and known-key replay protect storage but do not provide discoverability. Student-local receipt storage is not academic source of truth.
- **Recommendation:** scoped bounded request collection by acceptance plus staff review filter by course/assignment, including current status/version and stable pagination. Keep confirmed revision collection distinct.
- **Blocks implementation:** yes for complete submission/review journey, not stack selection.
- **Proof required:** fresh session without local IDs lists pending/needs_review/rejected own requests; authorized staff recover all scoped items after restart; other users/courses/tenants cannot enumerate them.

## ACR-007 — Refunded reservation capacity has no explicit waiter recovery trigger

- **Severity / category:** MEDIUM / preservation liveness and quota operations. Wildcard retains HIGH risk assessment; final severity reflects demonstrated recoverable delay.
- **Affected files / AD:** OPERATIONS.md:25,32,36–37,71–73; DATA-MODEL.md:65–66. AD-6/7; proposed AD-16.
- **Description / evidence:** reserve maximum bytes, refund unused capacity after capture; specified unblock events are quota change/deletion, not ordinary refunds or lease reclamation. Scan job exists but unblock-on-refund behavior is unspecified.
- **Preconditions:** 2 GiB free course quota, institution nonbinding; 50 concurrent actual 1 MiB archives, maximum reservation 100 MiB.
- **Sequence:** 20 reserve 2,000 MiB, leaving 48 → 30 block → 20 finish using 20 MiB and refund 1,980 → 2,028 MiB free, with no policy change or deletion.
- **Expected result:** all 50 fitting captures eventually run without intervention. **Problematic result:** written trigger contract permits 30 to remain blocked despite free capacity.
- **Impact:** avoidable preservation delay/staff work; source loss requires an additional GitHub loss event and unsuccessful recovery, not inevitably implied.
- **Estimated probability:** medium under bursts. **Detectability:** high through blocked/free-capacity mismatch.
- **Existing defenses:** transactional institution→course reservation prevents logical oversubscription; manual retry/alerts can recover. A periodic scan is not proof of automatic liveness until its semantics are specified.
- **Recommendation:** durable coalesced capacity-available signal or bounded sweep after refund, failed/reclaimed reservation, deletion or limit increase; fair re-admission and conditional once-only accounting. No endless retries of deterministic bad archives.
- **Blocks implementation:** no global implementation veto; required capture contract repair before integration readiness/pilot.
- **Proof required:** 50/2GiB scenario completes without policy edits, deletion or staff retry; kill between release and wake; double-release and lease-expiry tests preserve accounting; genuinely oversized archives stay blocked without hot loop.

## ACR-008 — First identity intake requires an undiscoverable account UUID

- **Severity / category:** MEDIUM / API bootstrap completeness. Killjoy withdrew initial HIGH after cross-review; no active disagreement remains.
- **Affected files / AD:** openapi.json:14797–14831,15265–15286; DATA-MODEL.md:22,36–37; GITHUB.md:7. AD-3; proposed AD-18.
- **Description / evidence:** closed Me schema returns user_id, external numeric github_user_id and login but not local github_account_id. IdentityRequestInput requires that local UUID; no preceding own-account read returns it.
- **Preconditions:** first GitHub login, valid invitation, no existing binding.
- **Sequence:** OAuth creates local account → GET /me → construct link request → mandatory local account UUID unavailable. External GitHub ID and user UUID are not interchangeable with it.
- **Expected result:** fresh student can request teacher confirmation using documented responses. **Problematic result:** client must guess or depend on an undocumented API.
- **Impact:** onboarding contract unusable; not proof of account spoofing because own-account authorization is expressly required.
- **Estimated probability:** deterministic for a literal client using these schemas. **Detectability:** high in a fresh-user walkthrough; structural OpenAPI validation misses it.
- **Existing defenses:** server rereads authenticated identity and constrains intake to requester; do not label a user-supplied UUID itself a demonstrated impersonation route.
- **Recommendation:** derive active account from authenticated session and remove redundant input. Add safe own-account selection only if multiple selectable accounts are a real requirement.
- **Blocks implementation:** yes for identity intake contract, not unrelated baseline experiments.
- **Proof required:** first-time user completes link request using only documented login/invite responses; foreign account substitution is rejected or unrepresentable; account correction preserves lineage.

## ACR-009 — Resolution CAS token is absent from the current request response

- **Severity / category:** MEDIUM / API concurrency inconsistency.
- **Affected files / AD:** openapi.json:8502–8525,15681–15806; API.md:21; DATA-MODEL.md:9,13,48,52. AD-5; proposed AD-14.
- **Description / evidence:** GET current request uses closed SubmissionReceipt without row_version/ETag/generation; ResolutionInput mandates expected_version. Immutable receipt fields coexist with mutable validation/classification state.
- **Preconditions:** teacher knows request ID and reads needs_review; another teacher/worker may update it.
- **Sequence:** read status → prepare resolution → no version available → guessing conflicts or builders bypass comparison. Immutable resolution row_version=1 is not a substitute for the mutable request token.
- **Expected result:** resolve exactly the inspected state, reject stale actions. **Problematic result:** no contract-compliant safe CAS command can be constructed.
- **Impact:** blocked resolution or conditional lost-update behavior if implementers improvise.
- **Estimated probability:** deterministic missing-field mismatch; concurrency consequence conditional. **Detectability:** high in chained API contract test, absent from structural validator.
- **Existing defenses:** required optimistic concurrency and immutable POST replay are correct, but need distinct current-status semantics.
- **Recommendation:** expose and define the mutable request/resolution concurrency token in current GET; preserve original POST acknowledgement for exact replay; append resolutions with explicit supersession.
- **Blocks implementation:** yes for resolution contract.
- **Proof required:** read N; worker/teacher moves N+1; stale resolution returns 409 without changes; refreshed succeeds; original same-key replay preserves original result and receipt time.

## ACR-010 — Teacher rejection is specified but cannot be expressed on the wire

- **Severity / category:** MEDIUM / API state transition completeness.
- **Affected files / AD:** STATE-MACHINES.md:61; API.md:29; openapi.json:15770 and submission request resolutions route. AD-5; proposed AD-14.
- **Description / evidence:** state machine allows teacher needs_review→rejected; ResolutionInput only expresses academic classification, reason, optional evidence, version and confirmation. No rejection action/route exists; additional properties are rejected.
- **Preconditions:** valid identity/SHA, insufficient historical evidence; teacher chooses rejection rather than an exception or reclassification.
- **Sequence:** teacher selects reject → legal payload contains only unresolved/on_time/late/exempt/not_applicable → backend cannot distinguish rejection from other resolution intent without undocumented inference.
- **Expected result:** explicit audited terminal rejection. **Problematic result:** stranded request or classification/reason overloaded as technical state command.
- **Impact:** bounded but real academic workflow ambiguity; deliberately separate state axes become conflated.
- **Estimated probability:** high when this permitted action is used. **Detectability:** high in UI/API integration, not syntax checks.
- **Existing defenses:** prohibition on arbitrary state PATCH is appropriate; it makes a specific command necessary.
- **Recommendation:** explicit resolution decision or dedicated rejection command, with state-dependent classification/evidence guards and immutable outcomes. Do not infer action from human reason text.
- **Blocks implementation:** yes for teacher review feature; no global foundation veto.
- **Proof required:** legal explicit rejection, terminal state/audit, exact retry, stale conflict; classification alone cannot confirm invalid identity/SHA. Combine with ACR-009 concurrency test without merging their distinct repairs.

## ACR-011 — Incident notification depends on the service that is failing

- **Severity / category:** MEDIUM / observability and operations.
- **Affected files / AD:** OPERATIONS.md:71–73; EVIDENCE.md R-11/OQ-13; DELIVERY.md:70. AD-11 operational implementation; R-11.
- **Description / evidence:** alarms include failed receipt persistence and queue delay, but delivery is defined as in-app notices through the same DB/API. Liveness endpoints do not themselves specify an independent observer or a route to wake the operator.
- **Preconditions:** DB/API down or all workers stopped; operator is not actively refreshing the application.
- **Sequence:** service fails → alarm should notify owner → same failed service cannot persist/read/deliver notice → no incident signal until manual discovery/recovery.
- **Expected result:** owner receives actionable failure alert while the service is unavailable. **Problematic result:** notification path shares the failure domain it is meant to report.
- **Impact:** prolonged outage, more unpersisted submission attempts and manual discovery.
- **Estimated probability:** conditional on ordinary outage; likely failure of the specified sole channel. **Detectability:** poor automatically during failure, obvious after investigation.
- **Existing defenses:** health endpoints and logs are useful observables; they require an independent observer/delivery channel to become incident response.
- **Recommendation:** minimal hosting/uptime monitor plus one independent owned delivery route and detection objective. Keep product notices in-app; do not build a general email platform or new broker to solve this.
- **Blocks implementation:** no; blocks pilot operations until OQ-13 ownership and independent delivery are verified.
- **Proof required:** stop API/DB and workers separately; owner receives alert within agreed bound despite notice-store failure; deduplicated recovery notification and runbook work.

## Cross-review disposition and exclusions

- ACR-007 is one finding. Wildcard maintains HIGH for unbounded preservation exposure; Splinter, Level and Killjoy assess demonstrated recoverable delay as MEDIUM. Final classification uses MEDIUM without erasing Wildcard's dissent or pretending a scan's wake-up behavior is already specified.
- ACR-008 combines Level/Killjoy evidence. Killjoy's initial HIGH was explicitly withdrawn in KILLJOY-CROSS; final MEDIUM reflects a contract gap, not proven impersonation.
- S-03 capture-versus-purge bypass was **not promoted**: the proposed schedule did not establish a permitted retry/capture path against available/purge-eligible evidence. Keep it as a required invariant/test, not a counted exploit.
- ACR-003 uses HIGH, not CRITICAL: quarantine is explicitly available. Lost cancellation knowledge remains real but destructive replay is not inevitable.
- ACR-001 is conditional: correction-protection intent may be interpreted broadly. That interpretation must become an explicit transition invariant; no proven cross-tenant or running takeover is claimed.
- GitHub template permission claim was corroborated: no finding demanding Contents write or Workflows write. Suspected decimal escaping and invented-version claims were not sustained.
- Generic concerns about audit fields, exact idempotency response persistence, arbitrary capability strings, archive/parser details and capture/deletion generations remain verification obligations or leads in the attack matrix, not additional findings without a supported counterexample.
- AD-5 receipt-boundary clarification and AD-7 post-deletion-publication exception require Juan's explicit disposition. They are normative questions, not experimentally demonstrated incidents or two extra severity-count entries.

Full independent history: [Wildcard](WILDCARD-NOTES.md), [Level](LEVEL-NOTES.md), [Splinter](SPLINTER-NOTES.md), [Killjoy](KILLJOY-NOTES.md); rebuttals: [Wildcard cross-review](WILDCARD-CROSS.md), [Level cross-review](LEVEL-CROSS.md), [Splinter cross-review](SPLINTER-CROSS.md), [Killjoy cross-review](KILLJOY-CROSS.md). Required attacks/failure/load reasoning are in [ATTACK-MATRIX.md](ATTACK-MATRIX.md). Gate scope and research proofs are in [IMPLEMENTATION-GATE.md](IMPLEMENTATION-GATE.md).
