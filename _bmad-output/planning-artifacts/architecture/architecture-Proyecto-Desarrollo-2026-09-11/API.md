# Internal API contract

Status: RECOMMENDATION implementing approved AD-1–AD-11. [openapi.json](openapi.json) is the canonical route, field and response-shape inventory, OpenAPI 3.1.1. It is a design artifact, not generated application code or an implemented API. Domain invariants in the spine and DATA-MODEL apply even where JSON Schema cannot express cross-resource constraints.

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

POST `/accepted-assignments/{id}/submissions` accepts SHA, branch and optional observation ID. Backend persists a request with immutable receipt and outbox, then returns 202 `SubmissionReceipt` with Location `/api/v1/submission-requests/{id}`. Even if validation finishes immediately, replay returns the original receipt. Current request GET includes separate validation state, academic classification and nullable confirmed Submission ID.

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
