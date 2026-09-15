---
title: Academic platform — preimplementation design discussion
status: reconciled-historical-companion
date: 2026-09-11
audience: Juan and the delivery team
implementation_authorized: false
---

# Design discussion

This is the preserved discussion companion, reconciled on 2026-09-13. ARCHITECTURE-SPINE.md consolidates current decisions, API.md/openapi.json own final proposed contracts, and EVIDENCE.md owns remaining open items. Earlier alternatives below are historical rationale, not unresolved approval requests. DECISION denotes user approval; mechanics remain RECOMMENDATION unless expressly adopted. No implementation is authorized.

## Adopted boundaries

- **DECISION AD-10:** One pilot institution and one dedicated, institution-controlled GitHub organization; multiinstitution isolation from the design. Organization name/existence and actual capability checks are pilot preparation, not a reopened architectural choice. GitHub membership never substitutes academic authorization.
- **DECISION AD-11:** Approved TypeScript, React/Vite, Fastify, PostgreSQL, Drizzle, Octokit adapters, pg-boss, private objects, Vitest, Playwright and Docker; modular monolith with separately deployed API and worker. Redis and microservices excluded initially absent measured need/unmet requirement. Versions/compatibility/provider verification remain research, not base-stack approval.

- **DECISION AD-1:** MVP automatic tests are formative. Automatic test results, academic evaluation, draft grades and published grades are strictly distinct concepts. Every automatic result identifies the evaluated commit SHA. Only explicit teacher publication creates an official grade. Ingesting GitHub Actions results cannot publish a grade.
- **DECISION AD-2:** Submission is explicit, records revisions and commit SHA, allows new revisions, and marks lateness without blocking Git.
- **DECISION AD-3:** MVP identity association requires an authenticated GitHub user's request and explicit teacher approval. Knowledge of a name, email, academic identifier or invitation is insufficient. Persist the platform user, academic identity, GitHub account and institution association. At most one valid active association may exist for one academic identity within an institution. Requests, approved/rejected outcomes and revoked/replaced links remain distinguishable. Teachers may perform authorized, audited corrections without overwriting history. Institutional SSO is outside MVP; future institutional verification methods must be supported. GitHub organization membership alone never grants academic authorization.
- **DECISION:** Future authoritative grading requires a trust boundary independent of the student repository, protected tests when required, and verifiable rules for conversion into an official grade.
- **DECISION:** Real database persistence, tests, security, UX validation and GitHub integration accompany implementation continuously. No implementation is authorized at this stage.

## Proposed domain contracts

**DECISION AD-9:** An authorized teacher may withdraw the exact current official publication, with explicit confirmation and mandatory reason. Append an immutable withdrawal recording publication, actor, time, reason and audit; never alter/delete the original publication or its score, maximum, scale version, evaluation, Submission revision, publisher and timestamp. No official grade remains after withdrawal; do not assign zero, restore a prior publication or change evaluation/drafts/Submission/evidence. Any restoration requires new explicit publication. Atomically compare expected current publication: if B replaced A, withdrawing A conflicts and cannot affect B. Same-operation retries return the original outcome without duplicate events. Withdrawal never shortens previously extended evidence retention. Student view distinguishes never published, currently published and withdrawn; newer submission awaiting evaluation is an independent indicator. Student-safe explanation is separate from internal administrative observations. Preserve the full publication/withdrawal/publication sequence permanently.

**PROCESS DIRECTION:** Juan requests that institution/organization pilot and stack be the remaining individually resolved high-impact decisions. After these, consolidate the full preimplementation architecture package rather than eliciting microdecisions one at a time. Document subordinate recommendations and genuine unresolved blockers. Do not implement until authorized.

**DECISION AD-8:** Each published assignment version has a positive maximum. Scores and maxima use exact backend decimal representation, up to two decimal places; reject excess precision without silent rounding and require `0 <= score <= maximum`. Ungraded, pending, incomplete draft and zero remain distinct; missing evaluation is never zero. Publications preserve score, maximum, scale/configuration version, evaluation, exact Submission revision, publisher and publication timestamp. Later maximum changes cannot reinterpret existing drafts, evaluations or publications. Any supported change to a published assignment scale is an explicit, versioned, audited teacher operation; no automatic mass regrading in MVP. Percentage is derived as score/maximum*100, displayed with up to two decimals using decimal half-up rounding; do not persist/treat it as a second official grade. Show the original score/maximum primarily. MVP excludes above-maximum grades, extra credit, letter scales, automatic conversions, weighted course averages and complex institutional conversion policies. Future policy additions preserve historical publication meaning. Withdrawal without replacement was subsequently approved under AD-9.

**DECISION AD-6:** Every confirmed Submission revision creates an evidence-preservation operation for its exact SHA; never substitute the current branch head. MVP excludes snapshots of unsubmitted pushes and full Git-history backups. Store snapshots in private object storage or equivalent outside PostgreSQL. DB metadata includes submission/revision, SHA, location, cryptographic digest, size, capture timestamp, preservation state and relevant capture origin/mechanism version. Preservation is independent of submission confirmation and punctuality. Failures are visible to authorized staff and retryable, never invalidating the receipt. API and preservation workers never execute archived content. Authorize access by institution/course/student/role and audit administrative or exceptional access. Record explicit completeness, including treatment of LFS, submodules and external/downloaded resources. Distinguish receipt, content, evaluation and publication evidence. Later capture never proves availability at receipt time. Permanent code retention is NOT approved. AD-7 subsequently approved pilot retention, quotas and deletion semantics; institutional specifics remain OQ-12.

**DECISION AD-5:** Backend-recorded UTC receipt time is the authoritative temporal reference; client time and commit date are not. Before acknowledging receipt, durably persist actor, assignment/acceptance, requested SHA, received time, effective deadline and policy version. Receipt at or before the deadline is a candidate for on-time classification; processing delay must not automatically make it late. Confirm only after authorization and revision evidence are validated. Insufficient evidence requires review; invalid, unauthorized or ineligible requests do not confirm. Never claim receipt if persistence failed. Teacher exceptions are explicit audited academic decisions and never change the original timestamp. Same-key retries recover the same operation; a different SHA is a new operation. Original deadline/policy are immutable; subsequent academic reclassification is audited. Receipt, validation lifecycle and academic classification are distinct. Example lifecycle names are received, validating, confirmed, needs_review and rejected; exact naming remains open.

**DECISION AD-4:** Every academic evaluation references one exact Submission revision, and its draft remains attached to that evaluation. A resubmission creates an independent revision and is visible to both teacher and student. It never invalidates existing evaluations, inherits a prior grade or triggers automatic regrading. The existing official publication remains current for its evaluated revision. A teacher explicitly creates a new evaluation and draft when choosing to assess the new revision; only explicit publication replaces the official current grade. Previous publications remain permanently in audit history, with their evidence never silently overwritten. Normal deadline and extension rules apply independently of grading. Both user interfaces must identify when the latest submission is newer than the evaluated revision.

Everything in this section is RECOMMENDATION unless it repeats an adopted decision.

### Teacher-confirmed identity association

AD-3 is approved. The following implementation mechanics remain RECOMMENDATION:

- Separate IdentityLinkRequest (pending/approved/rejected) from AcademicIdentityBinding (active/revoked/replaced). A rejected request creates no active binding; request cancellation is not in the consolidated MVP.
- A request fixes requester, GitHub account ID, academic identity ID, institution and course context. An authenticated requester may see their own request; no public roster search or identity-claim endpoint should reveal other students' names, emails, link status or account associations.
- A teacher must have authority over the relevant roster entry, not merely a global teacher role. Because an institution-scoped link can affect several courses, the proposed R-03 requires all-affected-course teacher authority or a scoped institutional correction grant.
- Approval rechecks teacher scope, requester/account association and active-binding uniqueness inside a transaction; append binding, request outcome and audit together. A partial unique constraint on institution and academic identity for active bindings prevents concurrent approvals from creating two active links.
- Correction appends a revocation/replacement with actor, reason, timestamps and previous-binding reference. Replacement atomically ends the prior active binding and creates the new one. Historical submissions and publications are not silently reassigned.
- Backend academic authorization consults active binding and membership; a revoked association must not retain access merely through a stale session or cached authorization.
- GitHub collaborator access is a separate external state. Account correction requires a durable permission-reconciliation operation; show pending/failed revocation or grant explicitly. Do not claim that ending the DB binding has already revoked GitHub access.
- Store verification method and evidence reference (minimized, access-controlled) so future verified email, SSO or LMS/SIS can supply verification without bypassing association uniqueness, audit or academic permission checks.
- R-03 proposes reverse uniqueness and cross-course correction scope; AD-18 preserves historical authorship while current bindings govern future actions. These are recommendations pending package review.

Verification cases: two teachers approve competing requests concurrently; unauthorized teacher attempts correction; rejected request creates no link; replacement preserves history; old session loses academic access; GitHub revocation fails visibly and retries; correction does not silently transfer submission authorship or published grades.

### Evidence, evaluation and publication

| Concept | Owner | Proposed persisted data | Mutation and visibility |
| --- | --- | --- | --- |
| Automatic run/result | Integration module imports provider evidence | Tenant, repository ID, run ID, attempt, evaluated SHA, workflow reference, timestamps, provider status/conclusion, report schema version, source references, validation outcome | Refresh provisional observations until completion; preserve attempts and corrections. Visible to the owning student and authorized course staff. Cannot write grade records. |
| Academic evaluation | Academic module | Submission revision, evaluator, evidence references, rationale, assessment progress | Teacher or permitted TA assesses a specific revision. A run from another SHA is not silently evidence for that revision. |
| Draft grade revision | Grading module | Evaluation reference, score, maximum, feedback to publish, author, version | Authorized grader edits draft with optimistic concurrency. Not present in student API projections. |
| Grade publication | Grading module | Exact grade revision, submission revision, publishing teacher, timestamp, policy version, superseded publication reference | Immutable publication. Corrections create another publication; old records remain auditable. Only the currently published revision is the default student view. |

The data model need not use one table per concept. Logical separation is mandatory; proposed immutable publication records are the current physical-model candidate.

**Publication transaction:** validate teacher capability and tenant/course ownership; check expected draft version; validate finite score and positive maximum using the selected academic scale; create immutable publication; update the current-publication reference; record audit and notification intent in the same transaction. No GitHub request is required to publish an already recorded evaluation.

**Concurrency:** duplicate publication requests with the same idempotency key and payload return the same publication. A reused key with different content is a conflict. Concurrent changes to the draft produce a version conflict, never silent overwrite. The worker credential used to ingest formative results should have no database privilege to publish grades; the proposed separate DB/runtime worker profiles are specified in ARCHITECTURE.md and SECURITY.md.

**Correction:** editing a published grade is disallowed. A new draft may cite the previous publication. The student sees the current grade until explicit replacement or withdrawal. Withdrawal is approved under AD-9; pilot snapshot retention under AD-7. Institution-specific appeals/non-publication PII handling remains OQ-12 in EVIDENCE.md.

**TA boundary:** a TA may prepare an evaluation/draft only with the capability; publishing remains teacher-only. The proposed model uses one active staff role per user/course. A role change is explicit and audited, never an automatic TA promotion.

### Submission revision

Proposed fields: ID, tenant, accepted-assignment ID, monotonically increasing revision number within that acceptance, repository ID, branch reference, commit SHA, server request-received time, confirmed time, effective deadline used, deadline-policy version, derived lateness and submitting actor.

Proposed invariants:

1. The server authorizes the actor against the active course/assignment and verifies that the repository belongs to that accepted assignment. Caller-provided tenant/repository IDs are not authority.
2. The user confirms an exact SHA shown in the submission preview. Confirmation never silently resolves a newer branch head.
3. The backend validates SHA/eligibility under the proposed server-bound preview policy in STATE-MACHINES.md. The five-minute TTL/branch-observation semantics are R-01 and their proof is RR-04, not a newly approved rule.
4. A unique idempotency key scoped to actor and acceptance identifies one submission command; a payload hash detects key reuse with different content.
5. Validation against GitHub occurs outside the transaction. The final transaction rechecks authorization/acceptance while interpreting the immutable policy version captured on the receipt, not silently replacing it with a newer assignment policy.
6. A duplicate command returns its original receipt. A later intentional command can create a revision even when the SHA is unchanged. Grade references never move automatically to the new revision.
7. Git activity, latest submitted revision, selected evaluation revision and published-grade revision are separate references. The default student UI identifies any mismatch.
8. AD-5 supersedes the earlier bounded-validation recommendation: `received_at <= effective_deadline` is a candidate for on-time classification. Durably record the request before acknowledgment, independently of its later validation. Processing delay does not itself change punctuality. Insufficient temporal evidence requires review; no timeout alone proves lateness. Persist confirmation time separately. Backend receipt time and the original deadline/policy remain immutable.
9. An extension or deadline edit creates a policy revision. Preserve the deadline used on each receipt; any later academic reclassification is explicit and audited rather than rewriting the receipt.
10. New pushes never create submission revisions. Submission does not wait for automatic tests, and missing/failed tests do not prevent recording the student's submission.

Proposed UX: preview SHA and deadline; request submission; show the durable request receipt with its validation state; show confirmed revision only after evidence and authorization pass; offer a new revision. If a newer push exists, distinguish it from the submitted SHA. Insufficient evidence is needs_review, not confirmed on-time. If the response is lost, recover the original operation by the same idempotency key. Under AD-5, a receipt acknowledges durable intake, not successful validation.

**API contract under AD-5:** POST submissions first persists a request and returns its durable receipt with validation status (202 while pending is RECOMMENDATION); it must not label every successful intake response a confirmed revision. Request status and confirmed submission revision require separate representations. Final physical model and OpenAPI must reflect this distinction.

### Proposed internal API slice

The following original route slice is retained for context. API.md/openapi.json now define the consolidated proposed contract; these routes are included there.

| Operation | Authority | Successful effect | Key failures |
| --- | --- | --- | --- |
| GET /api/v1/accepted-assignments/{id}/submission-preview | Owning verified student | Server-bound candidate SHA, branch, policy version and effective deadline | Unauthorized resource, inaccessible repository, branch absent |
| POST /api/v1/accepted-assignments/{id}/submissions | Authenticated owning student, with final authorization revalidated | Durable request receipt and validation state; 202 while pending proposed; replay returns original operation | Idempotency mismatch, intake authorization failure, persistence failure; later validation may reject or require review |
| GET /api/v1/accepted-assignments/{id}/submissions | Owner student or authorized staff | Paginated immutable revisions | Unauthorized resource |
| GET /api/v1/submissions/{id}/test-results | Owner student or authorized staff | Results matching repository and submitted SHA, with attempt/provenance | Unavailable report is represented explicitly, not as zero |
| POST /api/v1/submissions/{id}/evaluations | Teacher or TA with evaluation capability | Academic evaluation referencing fixed evidence | Cross-course evidence, unauthorized operation |
| PUT /api/v1/evaluations/{id}/draft-grade | Authorized grader | Versioned draft update | Version conflict, invalid score, unauthorized operation |
| POST /api/v1/evaluations/{id}/publications | Teacher | Idempotent immutable publication and audit | Version conflict, invalid draft, unauthorized actor |
| GET /api/v1/accepted-assignments/{id}/published-grade | Owner student or authorized staff | Current publication with its exact submission revision | No publication is an explicit empty state |

All error responses follow the stable envelope and HTTP mappings now defined in API.md/openapi.json. Student projections exclude draft data server-side. Reading a submission never implies permission to read staff-only notes. Contract mechanics remain recommendations pending package review.

## Future authoritative evaluator boundary

**RECOMMENDATION:** retain a narrow result-ingestion contract rather than build a plugin framework now. The future path requires all of the following before automatic publication can be enabled:

1. An authorized evaluation request fixes tenant, assignment, submitted SHA/content digest, evaluator identity, test-package version and grading-policy version.
2. A trusted orchestrator obtains the fixed input without exposing its credentials to student code.
3. Student code executes in an isolated, bounded environment, with separately defined network, filesystem, process and resource permissions.
4. Protected tests and the scoring controller remain outside any boundary accessible to the submitted code. A separate repository alone does not satisfy this requirement. Test secrecy also requires analysis of output and repeated-query leakage.
5. The controller validates the outcome and records verifiable provenance binding the result to the request, input, tests, evaluator and attempt. Signing a student-controlled report would not create trustworthy evidence.
6. The academic policy layer validates that evidence and an explicitly authorized policy before creating an official publication. Invalid, missing or mismatched evidence fails closed.
7. Teacher overrides, audit history, reruns and policy revocation are specified. Formative results are never retroactively relabeled as trusted.

**RESEARCH REQUIRED:** sandbox/executor, protected-test execution model, artifact availability/retention, provenance mechanism, network policy, resource quotas and abuse resistance. None is selected or implemented in MVP. Do not add an `authoritative=true` switch that bypasses these requirements.

## Reconciled decisions and remaining research

### Retention and quota policy — DECISION AD-7 for the pilot

**DECISION AD-7:** Juan approved the retention structure and values below as initial pilot policy, and the quotas as provisional configurable operating limits, not permanent product limits. Use an explicit `academic_close` event; archive/hide never starts retention. The 12-month closure/publication rules, 30-day pending-deletion window, authorized holds and no invented closure are adopted. Holds must record reason, responsible person, creation and review dates; review never automatically releases a hold. Policy versions and explicit audited migrations protect previously applied or communicated retention.

Permanently retain minimum metadata after content deletion: Submission/revision, SHA, digest, provenance, preservation state, deletion date, deletion policy, reason and operation outcome. Distinguish scheduled, pending, held, in-progress, failed and verified physical deletion; labels remain design choices. UI explains that evidence existed and content expired under policy. Never mark complete deletion while recoverable provider copies exist; the extra 30-day backup-disappearance target remains RESEARCH REQUIRED, not an approved guarantee. Restores must not silently resurrect deleted evidence.

Approved configurable provisional limits: 100 MiB compressed, 500 MiB expanded during inspection, 20,000 entries, 20 GiB logical/course, 100 GiB logical/pilot institution, alerts at 80% and 95%. Measure mean/percentile size, usage by course/institution, blocked/failed preservation count, storage growth, capture duration and limit-hit frequency. Detect likely capacity shortfalls especially before publishing new assignments. Size/quota blocking is independent from submission and never triggers premature deletion or truncation. Authorized staff resolve blocks and preservation resumes; deterministic size/structure failures never retry indefinitely.

**ASSUMPTION:** the pilot primarily handles small source-code assignments, not large datasets, binaries or multimedia. Approved values are initial operating defaults, not measurements, prices or legal requirements. Institutional requirements and actual pilot storage volume must be validated before production.

**DECISION AD-7:** retain captured source while the course is active and for 12 months after explicit academic_close. Archiving is not closure. Later publication extends referenced snapshot at least 12 months from publication. Expiry starts a 30-day pending-deletion window. No invented closure. Code retention does not inherit permanent publication-audit retention.

Place a scoped, reasoned, audited hold for disputes or institutional instructions, with named responsible staff and a review date (proposed every 90 days). Only authorized staff can release it. Recheck current policy, holds and new publication references immediately before deletion using a serialized deletion claim; prevent a newly created hold/publication from racing an in-flight purge without an explicit outcome. Retention changes are versioned; a shorter policy cannot silently accelerate already promised expiry dates.

Delete objects and noncurrent versions/replicas according to the selected storage mechanism. Record requested versus verified deletion and retry failures. No complete deletion while recoverable copies remain. The additional 30-day backup bound remains RR-05, not a guarantee. Restores replay tombstones. AD-7 approves the minimal permanently retained revision/SHA/digest/provenance/preservation state/deletion date/policy/reason/outcome; broader institutional PII obligations remain OQ-12.

Approved configurable initial pilot limits: 100 MiB compressed, 500 MiB expanded, 20,000 entries, 20 GiB logical/course, 100 GiB/institution and 80/95% alerts. Accounting/inspection mechanics are proposed in OPERATIONS.md; no execution or silent inclusion of external dependencies.

Warn at 80% and 95%. At 100%, keep submission receipt/confirmation policy unchanged, create a visible preservation operation in a quota-blocked state and notify staff. Resume after authorized capacity increase or policy-permitted deletion; never delete evidence early or silently truncate an archive. Record that delayed capture risks GitHub source becoming unavailable. Size-limit failures remain blocked until authorized limit change or explicit resolution; backoff retries apply to transient failures, not an unchanged oversized object.

Quota accounting reserves capacity transactionally across concurrent workers, reconciles actual size, counts committed and reserved bytes, and tracks staging/orphans/noncurrent versions and backups separately for real storage-budget controls. Deduplication, if introduced, is tenant-local; evidence references remain distinct and deletion must respect remaining references/holds. User-facing logical quota does not depend on hidden physical deduplication.

AD-7 approves policy and configurable numeric pilot defaults; technical mechanics not expressly adopted remain recommendations. No deletion, automatic cleanup, storage provisioning or production implementation has been executed.

### Evidence preservation — DECISIONS AD-6/7

**DECISIONS AD-6/7:** private exact-SHA snapshot per confirmed revision; byte storage separate from DB metadata, preservation distinct from validation/punctuality, no retroactive temporal proof or head substitution. Pilot retention and configurable quotas are approved. Provider guarantees and detailed archive completeness are RR-05/RR-06.

Historical alternatives: references only, snapshots per confirmed revision, or full mirroring. Per-revision capture and its pilot retention were subsequently approved. Capture failures remain visible/retryable; no student-code execution or silent overwrite of publication evidence.

| ID | Category | Question / current recommendation | Dependency |
| --- | --- | --- | --- |
| OQ-1 | DECISION AD-3 | Teacher confirmation/correction approved; cross-course authority and reverse uniqueness have concrete proposed defaults R-03, not new user approvals. | Roster claim flow and authorization |
| OQ-2 | DECISION AD-5 | Backend UTC durable receipt is authoritative; confirmation requires valid evidence; uncertainty needs review; teacher exceptions and subsequent reclassification are audited without rewriting original receipt. | Deadline acceptance criteria |
| OQ-3 | DECISION AD-4 | Fixed evaluation/draft revision; resubmission remains independent and visible; explicit teacher evaluation/publication required to replace the current grade; prior publications permanently retained in audit. | Evaluation state and UX |
| OQ-4 | DECISIONS AD-6/7 | Snapshot and pilot retention/quotas/deletion semantics approved; provider proof RR-05, archive proof RR-06 and institutional specifics OQ-12 remain. | Appeals, storage, privacy, costs |
| OQ-5 | DECISIONS AD-8 and AD-9 | Numeric scale and percentage rounding approved; explicit withdrawal without replacement approved, including permanent history and concurrency safeguards. | Grade constraints and publication model |
| OQ-6 | DECISION AD-11 | Base stack, modular monolith, API/worker separation and no initial Redis/microservices approved; RR-01/RR-02 verify compatibility. | Version research and architecture seed |
| OQ-7 | DECISION AD-10 | One institution/dedicated org and multitenant isolation approved; actual owner/configuration OQ-11 and sandbox RR-03 remain. | Tenant isolation and permission matrix |
| OQ-8 | RECOMMENDATION R-08 | Individual extensions and CSV in proposed MVP; groups V1, subject to package review. | Scope and roadmap |
| OQ-9 | RESEARCH REQUIRED RR-03 | Verify frozen template generation and exact expected content; no arbitrary-SHA generation assumed. | Consistent provisioning |

## Verification cases for adopted decisions

- A valid successful Actions event and report cannot create or alter a published grade.
- A failed, absent, cancelled or malformed report never silently becomes zero academic points.
- Rerunning tests preserves previous attempts and leaves academic publications unchanged.
- A result for SHA B cannot be displayed as the result for submitted SHA A.
- Student endpoints never return drafts or internal assessment notes.
- A TA without publication authority cannot publish, including by direct API request.
- Publishing an unchanged draft twice with the same operation key creates one publication.
- Concurrent draft edits are detected; publication cannot silently select an unreviewed version.
- Correcting a published grade preserves the prior publication and actor history.
- Push does not submit; explicit Submit records a revision that survives restart.
- Duplicate submission commands return one receipt; deliberate new submission creates a new revision.
- Re-submission does not move an existing grade to a different SHA.
- Cross-tenant IDs are rejected throughout submission, evidence, evaluation and publication.

## Documentary evidence and limits

- FACT: GitHub exposes workflow runs and attempts. Store provider identity and evaluated SHA; schema mapping must be verified in an integration sandbox. https://docs.github.com/en/rest/actions/workflow-runs
- FACT: GitHub warns against privileged workflows executing untrusted code. Independent trustworthy grading is a design obligation, not a guarantee obtained by choosing Actions. https://docs.github.com/en/actions/reference/security/secure-use
- FACT: The documented template-generation parameters do not select an arbitrary commit SHA. Stable provisioning strategy remains research, not an assumed API capability. https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template

No real GitHub integration, migration, benchmark or application security test has been executed. Candidate version research is in EVIDENCE.md; no lockfile baseline is proven. The spine and complete proposed package are now consolidated for independent adversarial review. REVIEW.md records preparation checks only, not that future gate's approval.
