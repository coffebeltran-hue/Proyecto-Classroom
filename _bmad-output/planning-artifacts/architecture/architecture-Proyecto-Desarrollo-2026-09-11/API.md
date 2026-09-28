# Internal API contract

Status: repaired documentary contract implementing AD-1–AD-11, including Juan-approved 2026-09-17 AD-5/7 clarifications. AD-12–18 remain PROPOSED / RECOMMENDATION. Implementation unauthorized. [openapi.json](openapi.json) is the canonical route, field and response-shape inventory, OpenAPI 3.1.1. It is a design artifact, not generated application code or an implemented API. Domain invariants in the spine and DATA-MODEL apply even where JSON Schema cannot express cross-resource constraints.

## Common rules

Base URL `/api/v1`; same-origin cookie authentication (`academic_session`), HttpOnly/Secure/SameSite=Lax. `/me` returns a session-bound CSRF token; every cookie-authenticated mutation requires `X-CSRF-Token` and an allowed Origin. OAuth redirects use their state/PKCE protocol instead; raw webhook uses HMAC, not session/CSRF. Health routes are outside business auth and expose no secrets. No personal tokens or public GitHub proxy.

IDs are UUID strings, GitHub IDs decimal strings, decimal grades strings matching up to two decimal places, UTC ISO-8601 timestamps, and snake_case fields. String grades reject exponent, comma, NaN, negative and excess precision; localized input converts deliberately before submitting. Proposed numeric cap matches numeric(12,2). Additional request fields are rejected. Absent, null, zero and empty string do not mean the same thing.

Every protected operation declares `x-authorization`; this is human-readable policy, not an OpenAPI security mechanism. Backend must enforce the corresponding SECURITY matrix. A teacher role is scoped to its course; institution administrator is not automatically a grader. Tenant ID in list/create parameters is checked, never trusted. For resource-ID routes derive tenant from the resource through a restricted lookup, then authorize before returning data; forbidden cross-tenant resource is 404 to avoid enumeration. Identity-link intake is deliberately non-enumerating and only returns the requester's opaque receipt.

Collections use `limit` default 25/max 100 and opaque `cursor`, stable resource ordering `(created_at,id)` unless a revision sequence is specified. Responses include `items,next_cursor`. Dashboard endpoints read DB projections, not per-row provider requests. Snapshot/archive downloads use attachment content disposition and no-store; export CSV is formula-safe and private.

## Idempotency and concurrency

Evidence-changing POST/PUT commands require `Idempotency-Key` (16–128 ASCII safe characters) and CSRF. Scope is `(tenant,actor,operation-family,key_hash)`; bind normalized request payload, resource and expected versions into payload_hash. Existing exact-key payload returns stored status/body and Location as originally acknowledged, with `Idempotent-Replayed: true`. GET operation/request resource returns current progress. Reused key with different SHA/body/expected version returns 409 IDEMPOTENCY_CONFLICT; changed SHA is a new operation. Reauthorize the current caller before replay; a revoked user cannot recover private data via an old key. OAuth/webhook have separate replay rules.

Receipt, publication and withdrawal keys/outcome references persist with academic audit; no silent time-based reuse. Nonacademic operation keys can expire under a separate explicitly configured policy (proposed seven days). A crashed pending command recovers from persisted aggregate/outbox; lease expiry never authorizes duplicate external effect.

Mutable commands carry `expected_version`; publication additionally carries `expected_draft_version`, `expected_grade_generation` and `expected_publication_id` (null only when no grade). Withdrawal carries exact publication ID and expected generation. Compare inside a transaction; stale request returns 409 without touching the replacement. Updating draft is independent from publishing it. Generic PUT on publications or DELETE on evidence is not exposed.

## Submission contract

GET `/accepted-assignments/{id}/submission-preview` returns a server-bound observation ID, SHA, branch, observed_at/expires_at, effective_deadline and policy version. A cached latest SHA is not automatically an admissible preview. Missing provider evidence is explicit; no caller-supplied timestamp is accepted.

POST `/accepted-assignments/{id}/submissions` accepts SHA, branch and optional observation ID. Backend persists a request with immutable receipt and outbox, then returns 202 `SubmissionReceipt` with Location `/api/v1/submission-requests/{id}`. Even if validation finishes immediately, replay returns the original receipt. Current request GET returns SubmissionRequestStatus, including separate validation state, academic classification, nullable confirmed Submission ID and mutable request row_version. Original SubmissionReceipt replay never returns newly changed status.

Confirmed revisions are listed at GET `/accepted-assignments/{id}/submissions`. A Submission record exists only after successful authorization/content validation or an admissible academic resolution; receipt is not revision confirmation. `needs_review` never means confirmed/on-time. A teacher resolution cannot make an invalid/nonexistent SHA or unauthorized actor valid. Platform outage without receipt creates an incident report, not a backdated submission. Academic resolution can refer to either a real request or a separately recorded incident; an incident alone never creates a fake received_at.

Preview age/branch eligibility default is proposed in STATE-MACHINES and R-01. It remains a review-sensitive policy recommendation, not a newly approved requirement. All policy changes preserve original receipt classification inputs; new academic resolution is append-only.

## Evaluation and grading contract

GET test results matches repository + submitted SHA and keeps attempts. A formative result cannot be copied into an official publication by the worker. POST evaluations fixes submission and scale version. PUT draft saves an incomplete or complete private draft; student endpoints contain neither draft nor internal notes. POST publications uses a complete draft, its version and current-grade CAS. Server snapshots score/max/feedback/references; caller cannot supply an alternative score in publication request.

POST `/grade-publications/{id}/withdrawals` requires confirmation, student-visible reason, optional internal notes and current-grade generation. Return original withdrawal on replay; if another publication is current, conflict and do not withdraw it. GET current grade exposes `never_published/published/withdrawn`, publication or null and independent newer-submission indicator. Student history uses a safe projection with score/max/version/publication/withdrawal and public reason; internal observations are returned only through separately authorized staff history.

## Evidence and retention contract

GET snapshot metadata exposes capture state, completeness, SHA/digest/size/date, retention/deletion state and access availability; never raw object keys. GET content authorizes download and creates an access audit. Nonavailable content returns 409 (pending/blocked) or 410 (verified deleted); metadata remains available as authorized. Retry capture is a command with reason and expected version; deterministic block requires configuration change or explicit operator resolution.

Hold create/release and academic_close are audited commands. Review date is not hold expiry. Quota changes create policy version with reason/expected version; forecast is advisory. Retention policy migration lists affected scope and a reason and is queued/audited; it must not silently shorten communicated promises. Purge is worker-only, no browser delete-object endpoint. A hold or publication encountering active destructive fence returns 409 EVIDENCE_PURGE_IN_PROGRESS; it cannot promise reversal of bytes already deleted.

## Error mapping

All JSON errors contain `error.code`, safe `message`, `request_id`, `retryable`, and optional bounded `field_errors`; no stack traces, tokens or another student's identity.

| HTTP | Codes/examples | Meaning |
| --- | --- | --- |
| 400 | INVALID_REQUEST, INVALID_CURSOR | Bad shape or malformed pagination |
| 401 | AUTHENTICATION_REQUIRED | Missing/expired session |
| 403 | CAPABILITY_REQUIRED, CSRF_FAILED | Known authorized tenant context but forbidden action |
| 404 | RESOURCE_NOT_FOUND | Missing or deliberately undisclosed resource |
| 409 | VERSION_CONFLICT, IDEMPOTENCY_CONFLICT, CURRENT_PUBLICATION_CHANGED, EVIDENCE_PURGE_IN_PROGRESS, PRESERVATION_NOT_AVAILABLE | State/expected-version mismatch |
| 410 | EVIDENCE_DELETED, INVITATION_EXPIRED | Gone content/token; safe metadata may remain |
| 413 | PAYLOAD_TOO_LARGE | Intake bound, not academic late classification |
| 422 | INVALID_SCORE, IDENTITY_CONFLICT, SHA_INELIGIBLE, POLICY_CONFLICT | Valid syntax, invalid domain command; delayed validation records this on request rather than changing original 202 |
| 429 | RATE_LIMITED | Retry-After; no durable receipt unless one was already committed |
| 503 | STORAGE_UNAVAILABLE, DATABASE_UNAVAILABLE, GITHUB_UNAVAILABLE | No fabricated success; operation GET distinguishes already committed intent |

## External events and private commands

App webhook accepts the raw payload with X-Hub-Signature-256, X-GitHub-Delivery and X-GitHub-Event. Its schema permits provider event variation but signature/size/event allowlist and installation routing are enforced before domain dispatch. This is intentionally not a generic trusted JSON payload. Operation keys and worker kind catalog are in OPERATIONS.md; queue commands are not public endpoints.

The OpenAPI artifact covers the proposed individual MVP, minimal institutional admin, roster/imports/identity, assignments/invites/extensions, receipts/evaluations/publications/withdrawals, snapshots/holds/quota/retention, operator jobs and scoped audit. Groups, team membership, rubric editors, grading conversion, arbitrary workflow editors and public API credentials have no MVP routes.

## 2026-09-17 repaired command contracts

### Identity activation and bootstrap — ACR-001/008

POST identity-link-requests accepts classroom_id and academic_identifier; remove github_account_id and reject it as an unknown property. Server resolves current active account/session and stores that exact account with request/idempotency history. Account changes require a new intent, not reinterpretation of an old replay. Prebinding response remains non-enumerating.

IdentityRequestStaff includes server-created approval_context, requires_broader_authority, current binding ID/version when present. Context can be refreshed from the existing authorized course identity-request collection and binds profile/enrollment/authority versions without disclosing foreign courses. All activation paths, including first multi-course and revoked-predecessor approval, require teacher authority over every affected course or a scoped institutional teacher grant. decision=approve requires approval_context plus expected request version; corrections require context plus expected binding version; a request rejection grants no access and requires only course teacher. Server resolves predecessor; stale context returns VERSION_CONFLICT, inadequate scope CAPABILITY_REQUIRED. OQ-12 unresolved historical rights do not become implicit privileges.

### Receipt, order and discovery — AD-5 / ACR-005/006/009

POST submissions samples candidate received_at at trusted complete-request ingress with server-bound context before internal waiting. It has no authority until a durable intake transaction commits all known receipt/provenance/policy evidence. Session/ownership checks still occur before that commit. No surviving intake means no official receipt and no reconstruction from volatile timestamps. Response retains request_sequence and persistence_recorded_at (DB persistence-stage sample, not exact commit time); confirmation time belongs to confirmed Submission.

TimestampProvenance stores trusted source, instance/context, sampled_at, clock status and uncertainty. Nullable effective_deadline is interpreted with deadline_status=known/no_deadline/uncertain. policy_resolution_state=needs_review and candidate_policy_versions make uncertainty explicit, not “no deadline” or “late.” Applicable policy is determined at the ingress boundary using durable activation history; an uncertain ordering preserves candidate evidence and routes lifecycle to needs_review with unresolved academic classification. Original fields do not mutate on later resolution. R-01 historical observation/TTL remains proposed; when evaluated its reference is received_at, not worker execution time.

Intake allocates request_sequence once per acceptance; confirmed Submission.revision inherits it. Same-key exact replay reuses receipt and sequence; changed payload conflicts; same SHA/new key is a distinct request. Gaps represent unconfirmed/rejected requests. Overlapping requests are ordered by intake serialization; no total packet-arrival order is promised. latest_request includes pending/rejected; latest_submission_revision is highest confirmed sequence; evaluated_revision belongs to current publication and is null without one. newer_submission_exists compares confirmed versus graded sequence, not confirmation timestamp.

New bounded GET collections:

- /accepted-assignments/{id}/submission-requests: owner under current binding/access policy or staff submissions_read; request_sequence order.
- /classrooms/{id}/submission-requests: teacher or TA submissions_read, optional assignment_id constrained to course; stable created_at,id traversal.

Both return SubmissionRequestStatusPage, limit 25/max 100, opaque cursor bound to scope/filter/sort and optional validation_state filter. Reauthorize every page. Live filters are not immutable exports; refresh from the start to discover items transitioning behind an earlier cursor. Dashboard count links to the same predicate; no count/list atomic snapshot promised. A fresh session recovers durable work without local keys. Confirmed Submission list stays separate. Student response excludes internal review evidence; teacher worklist has current version.

### Explicit resolution and CAS — ACR-009/010

SubmissionRequestStatus.row_version is the mutable request token, not AcademicResolution.row_version=1. Validation transitions, confirmation/rejection and effective resolution changes increment it; heartbeat-only observations do not. POST request resolutions compares this token transactionally. Return resulting_request_version with the immutable resolution; stale request returns 409 and does not change history. Persist original command response for exact replay rather than rebuilding from current status.

SubmissionResolutionInput uses closed oneOf variants: reject (needs_review, no supplied classification), confirm_exception (needs_review with admissible identity/content and explicit basis/classification), reclassify (confirmed only, technical state unchanged). All require meaningful reason, confirm=true, expected_version and idempotency. unresolved cannot be a completed exceptional confirmation. not_applicable requires established no-deadline policy; on_time/late requires justified temporal basis; exempt records an exception. No classification can authorize a wrong identity/SHA. Provider observation happens outside transactions; a final transaction rechecks admissible stored evidence and confirms once with snapshot/outbox. Rejection is terminal for the request, leaves prior grades unchanged and assigns no zero. IncidentResolutionInput is separate, uses incident version and never creates a receipt or Submission.

### Deletion cancellation and AD-7 exception — ACR-003/004

POST /deletion-operations/{id}/cancellations requires institution admin or scoped evidence-operator grant, expected_version, mandatory reason, confirm and idempotency. It returns 202 Operation/Location while verification/journal work is pending. Current GET /operations/{id} exposes safe deletion-operation reference, phase and deletion_operation_version; cancellation expected_version compares this version, not Operation.row_version. Cancellation competes with start authorization; only prepared can become cancel_pending. Completed cancellation requires exact bytes plus independently durable canceled journal readback. Start_pending or later conflicts; no arbitrary state PATCH or browser delete endpoint.

Snapshot retry denies available, verified-deleted and active-purge-fenced states. Reopening synchronously blocks new claims and reports prior_deletion_claims_exist; it never cancels earlier claims or recreates bytes. Physical deletion_state and internal operation protocol phase differ.

Default grade publication after verified code deletion returns 409 EVIDENCE_DELETED_EXCEPTION_REQUIRED. The removed acknowledge_unavailable_evidence boolean is not an override. Teacher may supply deleted_evidence_exception with grant_id, reason, evidentiary_basis and student_explanation. Grant must be institutionally issued to that teacher for exact course/submission/evaluation/draft version, unexpired/unrevoked and unused; authorizer remains distinct from publishing actor. The existing grant API requires exact scope when capabilities contains publish_without_retained_code. One successful publication consumes it; exact retry returns that publication. New publication requires new scoped exception. In-progress purge remains EVIDENCE_PURGE_IN_PROGRESS regardless of grant.

Publication stores permanent unavailable-code flag, safe explanation and deletion reference; internal exception reason/basis and authorizer are retained in restricted audit/exception data. The normal student Publication schema carries no internal basis/notes. No deleted bytes restored and no retroactive twelve-month byte term asserted. Pending/failed capture does not automatically invoke this verified-deletion restriction. Post-deletion recapture/redownload is OUT OF MVP.

### Operational projections — ACR-002/007/011

Repository/AcceptedAssignment expose safe ExternalCleanup state, observed_at and unresolved_prior_effects separately from current student invitation/access. observed_absent requires an observation and no unresolved earlier own grant; a local revoked binding alone cannot set it. Privileged Operation detail can expose cleanup/deletion progress but not credentials or another student's account. Quota usage/retry routes remain; the existing sweep supplies bounded automatic recovery after all releases. Incident monitoring/delivery is independent of API/DB notices, not a new business endpoint or academic permission.

### Recovery read prerequisites checked during author validation

ACR-003: authorized cancellation/evidence operator GET snapshot metadata includes optional deletion_operation={id,operation_id,row_version}. This discovers the worker-created purge operation from the known Submission/Snapshot after a fresh session; follow operation_id to existing GET /operations/{id} for current phase/deletion_operation_version. Student and unprivileged staff projections omit the reference. Metadata availability does not grant cancellation authority.

AD-7: existing GET /evaluations/{id}/draft-grade exposes eligible_deleted_evidence_grant_id for the current teacher and exact evaluation/submission/draft, or null for absent, expired, revoked, consumed or wrong-scope grants (always null for TA). This supplies a usable authorized grant reference without a new grant directory or manual UUID transfer. It is not authorization: publication rechecks scope, expiry, revocation and consumption with grade/draft CAS. All command versions/IDs now have a documented read prerequisite; no additional business route is needed.
