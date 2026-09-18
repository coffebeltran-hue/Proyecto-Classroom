# State machines and user journeys

Lifecycle mechanics below remain RECOMMENDATION; the 2026-09-17 bounded documentary repairs are authorized and AD-5/7 clarifications are adopted. Semantics from AD-1–AD-11 are binding. Transitions run through application commands, never arbitrary state PATCH. Every mutation checks tenant, role, expected version and invariants. System transitions identify operation and causation IDs in audit.

## Orthogonal axes

Diagrams use readable labels; canonical serialized values are lowercase snake_case in OpenAPI. Received maps to received, NeedsReview to needs_review, RepositoryCreated to repository_created and NeverPublished to never_published. Published/Withdrawn describe the current-grade projection, not mutation of publication records.

| Aggregate | Separate axes |
| --- | --- |
| Course | draft/active/archived presentation; explicit academic_closed_at event |
| Acceptance | accepted/withdrawn academic membership; repository provisioning; access readiness; sync health |
| Submission request | receipt persisted; validation lifecycle; independent academic classification |
| Confirmed submission | immutable revision; independent preservation state; evaluation references |
| Grade | draft completeness; current publication pointer; immutable publication/withdrawal history |
| Snapshot | capture availability; completeness manifest; retention eligibility; physical deletion lifecycle |

## Identity

```mermaid
stateDiagram-v2
  [*] --> PendingRequest: authenticated student requests
  PendingRequest --> ApprovedRequest: authorized teacher confirms atomically
  PendingRequest --> RejectedRequest: teacher rejects with reason
  ApprovedRequest --> ActiveBinding: create unique association
  ActiveBinding --> RevokedBinding: authorized correction
  ActiveBinding --> ReplacedBinding: correction creates successor
```

Request and binding are separate rows; arrows do not mean a single overloaded state field. Rejected request creates no binding. Concurrent approval conflicts, not last-writer-wins. All activations, including first multi-course approval and reapproval of a revoked profile, require all affected course teacher authority or scoped institutional grant. Serialize stable profile/enrollment and compare approval_context plus target version; predecessor is server-resolved. Identity intake account is session-derived; OQ-12 historical access remains fail-closed where unresolved. Correction immediately blocks old academic authorization and separately starts GitHub permissions reconciliation. Neither teacher UI nor requester response enumerates someone else's account/claim details. The student enters their academic identifier; server response is non-enumerating and the teacher sees matching candidates in their authorized roster.

## Provisioning and access

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Creating: worker claims operation
  Creating --> RepositoryCreated: verified provider response
  Creating --> OutcomeUnknown: timeout or lost commit
  OutcomeUnknown --> RepositoryCreated: verified provenance reconciliation
  OutcomeUnknown --> NeedsOperator: ambiguous collision
  RepositoryCreated --> Configuring
  Configuring --> Ready: settings and template verified
  Configuring --> RetryableFailure
  RetryableFailure --> Configuring: bounded retry
```

Access axis: `not_requested -> invitation_pending -> granted`; revocation is `revocation_pending -> revoked` only when external absence is observed and no prior own grant remains unresolved, with observed_at; `blocked` represents inspection/policy failure. A timed-out older PUT remains potentially issued even after an absent read. Local academic revocation is independent and immediate. Current-account invitation and old-account cleanup are separate subjects. A repository can be provisioned while student invitation is pending. Integration health is `fresh/stale/inaccessible/installation_suspended`. A 404 is inaccessible, not proven deletion. No automatic destruction to compensate for a permission/configuration failure.

## Request intake and confirmation

```mermaid
stateDiagram-v2
  [*] --> Received: durable intake transaction commits
  Received --> Validating: validation worker
  Validating --> Confirmed: authorization and evidence pass
  Validating --> NeedsReview: insufficient historical evidence
  Validating --> Rejected: invalid or unauthorized
  NeedsReview --> Validating: new admissible evidence
  NeedsReview --> Confirmed: valid content and authorized academic exception
  NeedsReview --> Rejected: teacher rejects or evidence disproves
```

`Confirmed` creates exactly one Submission and preservation intent, inheriting immutable intake request_sequence as revision. Confirmation order never allocates revisions; rejected request sequences leave gaps. Teacher exception cannot turn an unauthorized actor or nonexistent SHA into valid evidence; it can recognize academic timing/eligibility exceptions with reason after valid content/identity is established. A rejected request is final for that operation; new SHA/new intent requires a new idempotency key. Retry of a completed operation returns original receipt; current status is a separate GET.

Academic classification is derived from immutable receipt plus an append-only resolution: `unresolved`, `on_time`, `late`, `exempt`, `not_applicable`. While validation is pending the UI may say "Received before deadline; verification pending", never "Confirmed on time". A proven no-deadline policy maps to not_applicable; uncertain policy with nullable deadline does not. deadline_status distinguishes known/no_deadline/uncertain. Candidate received_at is trusted full-request backend ingress before pool/locks/queue; it is an official fact only after durable commit. Persistence-stage and confirmation times differ; lost volatile ingress cannot reconstruct a receipt. Clock/policy-order uncertainty routes lifecycle to needs_review and classification to unresolved, never automatic late. A later extension does not rewrite receipt; teacher explicitly records reclassification. No Actions result blocks submission confirmation.

Temporal evidence rule: record a backend-observed exact commit/branch eligibility observation before or at intake. Preview returns a server-bound observation reference. At confirmation validate the request matches observation, installation/repo, actor binding and published branch policy. An observation after receipt alone cannot prove pre-receipt availability. Pre-receipt observation proves existence when observed, not continuous branch membership: MVP proposed eligibility is "observed on configured branch at preview, within a five-minute preview TTL", not "still branch head at receipt". TTL is evaluated at received_at, not at delayed validation. R-01 historical branch-observation/TTL remains proposed and RR-04 required despite AD-5 approval. TTL expiration or unavailable evidence gives needs_review; no inference from commit timestamps. Force-push after a valid preview cannot silently select a different SHA. Five minutes is a configurable recommendation, not a user-approved rule.

## Evaluation and official grade

```mermaid
stateDiagram-v2
  [*] --> NeverPublished
  NeverPublished --> Published: teacher publishes evaluation draft
  Published --> Published: explicit new immutable publication
  Published --> Withdrawn: teacher withdraws exact current publication
  Withdrawn --> Published: explicit new publication
```

Draft state is `incomplete/ready`, independent of the current grade. Submission R3 never retargets evaluation/draft/publication for R2. `newer_submission_exists` compares max confirmed intake sequence with the current publication evaluated revision; it is not a grade state. latest_request separately includes pending/rejected attempts. No current publication means no invented evaluated revision; the evaluation worklist may independently identify later confirmed work against a selected evaluation. Evaluation completion never publishes. Student views show current grade and its revision; administrative notes never enter the student projection. Withdrawal requires student-safe reason and optional internal notes; replacement uses CAS, and concurrent withdrawal of old A after new B returns conflict.

## Capture and deletion

Capture: `pending -> capturing -> available`; errors go to `retryable_failure`, `blocked_by_quota`, `blocked_by_size`, `blocked_by_structure` or `source_unavailable`. An available archive can be `complete_for_declared_scope` or `partial`; explicit manifest lists excluded LFS objects, submodules, dependencies and external URLs. Deterministic failures do not loop automatically. Confirmation remains unchanged.

```mermaid
stateDiagram-v2
  [*] --> Scheduled
  Scheduled --> Pending: retain_until reached
  Pending --> Held: authorized hold
  Held --> Scheduled: explicit release and expiry recalculation
  Pending --> InProgress: grace elapsed and purge fence committed
  InProgress --> Failed: provider error
  Failed --> InProgress: safe retry
  InProgress --> Verified: all recoverable copies verified gone
```

Before claiming purge, lock classroom then snapshot (current-grade first within that course when applicable), verify course eligibility/generation, holds and retention, and write prepared journal intent/fence. Reopen/migration commits a synchronous course fence; earlier purge claims are disclosed. While purge fence is active, new hold/publication cannot pretend to undo destruction: return a conflict, explain in-progress state and escalate to operator. Prepared and destructive_start_authorized records are independently durable before deleting bytes. Cancellation competes by CAS before start authorization; canceled is acknowledged complete only after byte verification and durable ordered canceled record/readback. Cancellation/start are exclusive and uncertain replay quarantines. A successful primary delete alone is not Verified if versions/backups can recover content.

## Core user journeys

| Actor | Journey and meaningful states |
| --- | --- |
| Institution admin | Authenticate; connect verified installation; run capability checks; see actionable blocked policies; authorize course staff |
| Teacher | Create course; CSV preview/errors; commit roster; approve identity requests; publish versioned assignment; capacity warning and invitation |
| Student | Login; request academic link without browsing roster; pending/rejected explanation; accept only after binding; track repo creation and GitHub invitation; work in IDE |
| Student submission | Preview exact SHA/deadline; persist request; receipt and validation status; confirmed revision or needs_review; independent capture state; results by SHA |
| Teacher/TA | Filter assignment table; select exact revision; inspect formative results; prepare evaluation/draft; teacher publishes; row shows newer revision separately |
| Teacher withdrawal | Confirm exact current publication and student-safe reason; conflict if changed; history retained; new publication later |
| Admin evidence | View quotas and blocked captures; adjust configured capacity with audit; hold/release; explicit academic close; review pending purge |

Every view includes loading, empty, processing, retrying, partial, unauthorized and unavailable states where applicable. Backend errors provide stable codes and safe text. Keyboard operation, visible focus, semantic forms/tables, status announcements and mobile alternatives to wide tables are acceptance criteria. WCAG 2.2 AA is a recommended test target, not a certification claim. Screens: public landing/login/privacy/terms; course/staff/roster; teacher assignment dashboard and evaluation; student assignments/submission/results/history; minimal institution integration/audit/storage admin. Teams screen is not shipped in MVP.

## Repaired request commands and recovery views — ACR-005/006/009/010

Current GET/list returns SubmissionRequestStatus.row_version; immutable POST SubmissionReceipt replay never evolves into today's status. Student own acceptance requests and staff course request collection expose all durable states, with bounded live-filter pagination and refresh. TA submissions_read can discover work but only teacher resolves. No raw DB recovery or saved browser UUID is needed.

| Explicit command | Allowed lifecycle | Guard / result |
| --- | --- | --- |
| reject | needs_review | Teacher, reason, confirm and request CAS; terminal rejected, no Submission or grade; no classification inferred from reason |
| confirm_exception | needs_review | Teacher plus admissible identity/content and explicit academic exception/evidence; confirm once with inherited sequence and snapshot intent; no unresolved completed exception |
| reclassify | confirmed | Teacher, reason, CAS and justified classification; append supersession, preserve receipt and technical validation |
| resolve_incident | separate incident lifecycle | Teacher and incident CAS; append academic resolution; never fabricates receipt/Submission |

Missing/invalid actor or SHA cannot be cured by a classification. A selected on_time/late requires justified timing basis, exempt records the exception, and not_applicable requires an established no-deadline policy. Technical invalidity remains rejected; unknown temporal evidence stays needs_review until admissibly resolved. Student message for pending new request: “Latest request: 3, verification pending. Latest confirmed submission: 2. Published grade: revision 2.” Rejected request 3 never becomes a confirmed reentrega; older late confirmation never produces a false newer-intent warning.

## Deletion protocol and exceptional publication — ACR-003/004, AD-7

Public deletion lifecycle stays independent of internal protocol:

```mermaid
stateDiagram-v2
  [*] --> prepared
  prepared --> cancel_pending: operator cancellation CAS wins
  cancel_pending --> canceled: exact bytes verified and journal readback durable
  prepared --> start_pending: start CAS wins after prepared export
  start_pending --> destructive_started: start authorization exported before provider call
  destructive_started --> verified: all recoverable copies proved gone
```

Failures remain at the winning phase with blocked/failed operation detail; no timeout rolls start_pending back to cancelable. Canceled is terminal for that operation, not a deleted snapshot. A new purge generation requires fresh eligibility; no historical record is overwritten. New hold/publication during an active fence conflicts; reopen affects future claims without automatically canceling earlier claims. Verified physical deletion forbids capture retry/redownload in MVP.

AD-7 adopted exception: ordinary publication referencing verified-deleted code is blocked. An institutionally issued scoped one-use grant to a teacher may authorize publication for exact course/submission/evaluation/draft. Teacher provides required reason, remaining evidentiary basis and student-safe explanation; publisher and authorizer are separate immutable facts. Student sees historical code unavailable, never restored or retained another twelve months retroactively. An in-progress purge cannot use this branch. Normal grading of pending/failed preservation is not newly forbidden.
