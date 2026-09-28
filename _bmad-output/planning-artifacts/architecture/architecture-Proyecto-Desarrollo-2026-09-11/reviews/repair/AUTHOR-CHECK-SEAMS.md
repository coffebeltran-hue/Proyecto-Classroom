# Author check — independently built seams

Date: 2026-09-17. Scope: current ARCHITECTURE-SPINE.md, DATA-MODEL.md, OPERATIONS.md, API.md and openapi.json. This is the architecture author's configured seam check, not the targeted independent Anti-Consensus re-review and not evidence of implementation readiness. AD-5/7 clarifications are adopted; AD-12–18 remain proposed. No runtime or provider work was performed.

## SEAM-01 — High: cancellation has no complete discovery path

**References:** API.md, “Deletion cancellation and AD-7 exception”; OPERATIONS.md, “Cancellation and destructive dispatch”; OpenAPI `GET /operations/{id}`, `POST /deletion-operations/{id}/cancellations`, `Snapshot`, `Classroom`.

The cancellation command correctly uses the deletion-operation version, and Operation GET exposes that token. However, the purge operation is worker-created. There is no operation collection, Snapshot has no operation reference, and course reopening exposes only `prior_deletion_claims_exist`. The initial operation ID required by GET is therefore not available through a specified, scoped read path. Generic notices/audit do not define a guaranteed purge-operation link; audit access also does not establish the scoped evidence operator's read rights.

**Two compliant units:** the worker creates and fences a prepared deletion and exposes its known-ID Operation projection; the operator UI follows the canonical OpenAPI and can see that a snapshot is in progress but cannot obtain the operation ID/version to cancel it. Neither unit violates its local contract, yet the repaired operator action cannot be exercised after a fresh session.

**Minimal repair:** add either a scoped bounded operation collection filtered by course/snapshot/kind, or an authorized snapshot/operator projection carrying the current Operation reference. Define the deletion-ID → Operation-ID mapping, reauthorization and safe projection. Keep the existing cancellation CAS. Verify the documentary chain starting from course/submission ID with no saved operation ID.

## SEAM-02 — Medium: scoped publication grant is not retrievable by its teacher

**References:** AD-7; DATA-MODEL.md `authorization_grant_publication_scope` and `publication_evidence_exceptions`; API.md “Deletion cancellation and AD-7 exception”; OpenAPI `POST /institutions/{id}/authorization-grants`, `POST /authorization-grants/{id}/revocations`, `AuthorizationGrant`, `DeletedEvidenceExceptionInput`.

The new exception requires the institution to issue a one-use grant and a distinct authorized teacher to submit its `grant_id`. The API returns AuthorizationGrant only from creation/revocation; there is no GET or scoped list that the subject teacher can use to discover an issued grant or inspect whether its exact draft scope remains usable. No handoff/read contract specifies how the teacher obtains it. The institution's original POST response and private audit are insufficient as a cross-actor current-state read contract.

**Two compliant units:** the institution UI creates the exact scoped grant and retains its response; the teacher UI fetches its evaluation/draft and must construct DeletedEvidenceExceptionInput but has no canonical read for the matching grant. A developer must invent an out-of-band ID transfer or an undocumented endpoint, while another can assume a grant picker exists.

**Minimal repair:** provide an authorized GET/list for grants issued to the current teacher, restricted to the exact evaluation/submission/course, exposing scope, expiry/revocation, consumption and current version. Permit institution administration to recover its own managed grants as appropriate. Continue checking authority, scope and one-use consumption atomically at publication; reading a grant must confer no authority. Verify the flow using separate institution and teacher sessions without transferring a POST response manually.

## Checks that converged

The inspected contracts consistently preserve full-request ingress before internal waiting with durable-only authority, immutable original receipt replay, acceptance-serialized request sequence inherited by confirmed revisions, mutable request CAS, explicit resolution commands, independent pending/confirmed/graded axes, generation-aware uncertain access attempts, journal cancellation versus destructive-start CAS, synchronous course retention fences, automatic bounded quota recovery, scoped teacher publication after verified deletion, and no MVP recapture. These are documentary consistency observations only; RR/OQ experiments and the targeted independent re-review remain open.

## Follow-up verification disposition — 2026-09-17

The initial findings above are preserved as the pre-fix record. The author rechecked only the two repaired read paths in the current generator, OpenAPI, API.md and SECURITY.md.

- **SEAM-01: addressed documentarily.** Existing `GET /submissions/{id}/snapshot` now authorizes the scoped cancellation operator to inspect metadata and supplies optional `Snapshot.deletion_operation` with required `id`, `operation_id` and `row_version`. API.md defines following `operation_id` to existing `GET /operations/{id}` and using current `deletion_operation_version` for cancellation CAS. SECURITY.md limits this reference to the matching authorized scope; student and unprivileged staff omit it. This supplies the missing fresh-session read chain without a new route.
- **SEAM-02: addressed documentarily.** Existing `GET /evaluations/{id}/draft-grade` returns DraftGrade with required nullable `eligible_deleted_evidence_grant_id`. API.md and SECURITY.md restrict an ID to the currently authorized teacher's exact evaluation/submission/draft and filter absent, expired, revoked, consumed or wrong-scope grants to null; TA receives null. Publication still rechecks grant scope, validity, consumption and grade/draft CAS. The teacher can obtain a usable grant reference independently of the institution's creation response.

`reviews/build-contract.py` contains both projection additions and the snapshot read authorization, matching the inspected OpenAPI. No runtime test, provider proof or targeted independent re-review was performed. This disposition closes these two author-check documentary findings only.
