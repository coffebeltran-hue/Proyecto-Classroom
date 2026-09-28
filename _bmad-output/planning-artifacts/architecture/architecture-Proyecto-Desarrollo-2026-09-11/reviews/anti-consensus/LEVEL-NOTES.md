# Level — Claim Checker

Recovered review, 2026-09-17. Independent reviewer notes, no vote or approval. Earlier complete-package/OpenAPI inventory examination was preserved in the parent recovery context; this continuation rechecked the four surviving leads directly against original sources. Original documents unchanged. No executable exploit, implementation, infrastructure or provider mutation was attempted. Local IDs LV-01–04 are stable cross-review keys for the coordinator's ACR registry.

## LV-01 — First identity request requires an undiscoverable local account identifier

- Severity/category: MEDIUM; API contract completeness. Confirmed documentary defect, not demonstrated account spoofing.
- Files/AD: openapi.json; DATA-MODEL.md; GITHUB.md. AD-3, proposed AD-18.
- Evidence: openapi.json:14797–14831 defines closed Me with user_id, numeric-string github_user_id, login, CSRF and institutions, without local github_account_id. openapi.json:15265–15286 requires github_account_id UUID in IdentityRequestInput. DATA-MODEL.md:36–37 stores a FK to local github_accounts. GITHUB.md:7 creates the account during OAuth. The route/schema inventory has no authenticated account bootstrap read returning that UUID before binding.
- Preconditions: newly authenticated student with no existing binding and a valid classroom invitation.
- Schedule: OAuth creates local account → client reads /me → client prepares first identity-link request → required UUID cannot be obtained from documented response. GitHub numeric ID and platform user UUID are not the local account UUID.
- Expected/problem: student can initiate teacher confirmation; a contract-compliant client cannot construct the request without undocumented data or guessing.
- Impact: onboarding cannot be implemented end-to-end from the canonical API; improvisation risks trusting a caller-selected account.
- Probability/detection: certain for an implementation faithful to these schemas; immediately detectable by a fresh-user contract walkthrough.
- Recommendation: derive github_account_id from authenticated session server-side and remove it from input; if multiple accounts become a requirement, expose an own-account selection contract with ownership enforcement.
- Gate: fix before implementing identity intake; does not challenge teacher approval itself or block unrelated scaffolding.
- Proof: fresh OAuth session with no memberships can submit its own link request using only documented responses; arbitrary foreign account input is impossible or denied.

## LV-02 — Submission request read omits the version required to resolve it

- Severity/category: MEDIUM; API/CAS contract inconsistency. Confirmed documentary defect.
- Files/AD: openapi.json, API.md, DATA-MODEL.md. AD-5; proposed AD-14.
- Evidence: openapi.json:8504–8525 routes GET submission request to SubmissionReceipt; closed schema at 15681–15769 contains mutable validation/classification projections but no row_version. ResolutionInput:15770–15806 requires expected_version. API.md:21 requires transaction comparison and stale conflict. DATA-MODEL.md:13 identifies receipt as submission_requests projection; immutable evidence fields do not make the mutable request status immutable.
- Preconditions: teacher reads a needs_review request; no confirmed submission exists yet.
- Schedule: GET request → UI observes needs_review → teacher prepares resolution → required expected_version is unavailable; concurrent worker or another teacher may change state meanwhile.
- Expected/problem: resolve exactly the version inspected; documented read cannot supply the CAS token, encouraging guessing or disabling the check.
- Impact: blocked recovery UX or unsafe stale resolutions if builders invent incompatible workarounds. No assertion that existing software already loses updates.
- Probability/detection: certain schema mismatch; contract-level request/read/resolve walkthrough detects it, schema validity alone does not.
- Recommendation: expose request row_version (or explicit concurrency token) in current-status GET, bind resolution CAS to that aggregate, preserve immutable original POST acknowledgement separately.
- Gate: fix before submission resolution implementation.
- Proof: read vN; worker/teacher changes to vN+1; stale resolution conflicts without side effects; refreshed resolution succeeds; replay of original POST still returns its original receipt.

## LV-03 — Reapproval after revocation has no explicit all-course authority rule

- Severity/category: HIGH; authorization/identity lifecycle ambiguity. Confirmed missing transition rule; conditional bypass, not proven running exploit.
- Files/AD: SECURITY.md, DATA-MODEL.md, STATE-MACHINES.md, openapi.json, ARCHITECTURE-SPINE.md. AD-3; MODIFY proposed AD-18, no need to revoke AD-3.
- Evidence: SECURITY.md:17 permits approval for a scoped roster; :18 requires all affected courses or grant for correction. openapi.json:5170–5173 describes course-teacher approval; :5340 applies stronger authority only to corrections. DATA-MODEL.md:37 uniqueness filters active binding; :145 correction locks active profile/current binding and protects institution-wide identity. ARCHITECTURE-SPINE.md:125 says existing acceptance subject stays profile-based and future actions use current binding. STATE-MACHINES.md:30 separates request and binding; no explicit reapproval-after-revocation guard is specified.
- Preconditions: profile enrolled in A and B; former binding was legitimately revoked by an authorized actor; teacher T has authority only in A; another authenticated account files a new matched request via A. This attack does not assume T can perform the initial all-course revocation.
- Schedule: revoke old binding → no active uniqueness collision remains → T approves fresh pending request through ordinary approval → new institution-wide current binding may authorize profile-based existing acceptances in B.
- Expected/problem: changing the identity used across courses requires all-course authority; operation-name-based authorization can treat reapproval as initial intake and omit that requirement/history linkage.
- Impact: conditional cross-course academic impersonation/access. Whether B's enrollment is automatically authorized requires an explicit decision; the design must not silently choose it.
- Probability/detection: medium under a straightforward endpoint-specific implementation; low visibility because all ordinary approval checks pass and audit may show only a valid A teacher.
- Recommendation: classify any approval for a previously bound profile as lineage continuation/reactivation and enforce correction-equivalent scope across affected active courses; serialize on profile even with no active binding. Specify initial multi-course approval policy too.
- Gate: resolve authorization invariant before identity implementation.
- Proof: two courses, single-course teacher, revoked predecessor; fresh approval cannot activate access to B without required scope/grant. Concurrent fresh requests preserve uniqueness and predecessor lineage; legitimate all-course recovery succeeds.

## LV-04 — Local access generation cannot prevent a previously issued remote grant from completing

- Severity/category: HIGH; distributed authorization/recovery guarantee too strong. Concrete valid schedule against stated claim; duration/repair depends on missing remote-call completion protocol.
- Files/AD: OPERATIONS.md, GITHUB.md, STATE-MACHINES.md, SECURITY.md. AD-3/10; MODIFY proposed AD-13/18.
- Evidence: OPERATIONS.md:12 says old generation cannot grant revoked account; :7 already recognizes uncertain external effects and at-least-once. GITHUB.md:27 uses ordinary GitHub collaborator PUT/DELETE; :47 requires read-before-repeat. STATE-MACHINES.md:48 separates revocation_pending/revoked. SECURITY.md:63 promises continuous effective-access checks. These defenses support eventual repair but do not make the remote API enforce the DB generation.
- Preconditions: legitimate access grant dispatched for generation g, network/provider delays its completion; binding then revoked at g+1; App still has collaborator permissions.
- Schedule: W1 checks g and issues PUT → revocation commits g+1 → W2 DELETE/read observes account absent, marks revoked → old PUT finishes and grants/invites old account → W1 crashes before compensating or noticing stale generation.
- Expected/problem: old generation cannot grant after revocation; GitHub may apply already-issued PUT after DELETE. Rejecting W1's DB completion leaves effective access different from locally completed revocation.
- Impact: access to private academic repository after local revocation; recurring drift checks may repair but do not undo reads/downloads in the interval.
- Probability/detection: uncommon but plausible with delayed calls and crash/retries; periodic effective-access reconciliation detects later, ordinary DB-generation tests miss it.
- Recommendation: specify durable in-flight/uncertain attempt tracking, follow-up reconciliation after stale completion/crash, invitation cancellation as well as collaborator removal, and a revocation completion rule that accounts for unresolved older calls. State external revocation as convergent with observable pending/unknown status, not instantaneous fencing; define escalation when remote outcome cannot be bounded.
- Gate: resolve before access-worker integration; document weaker true guarantee before implementation of revocation status.
- Proof: deterministic provider simulator delays grant until after revoke/read, kills original worker, resumes recovery; no silent terminal revoked while an older grant can still complete; all late grants/invitations are discovered and removed, with unresolved exposure visible. Real-provider experiment validates invitation/effective-access semantics separately.

## Discarded or narrowed leads

1. Invented stack versions: rejected. The interrupted review had primary-source corroboration that Node 24.21.0, pg-boss 12.31/schema 41 and Vitest 5 exist. Existence does not prove compatibility; retain RR-01/RR-02 executed dependency/DDL tests. No new version claim is introduced by this continuation.
2. github_account_id input proves spoofing: rejected. SECURITY.md:36 re-reads authenticated account and :40 limits intake to own identity; LV-01 is absent bootstrap data, not proof those controls fail.
3. Revocation immediately guarantees removal everywhere: narrowed. The design explicitly models revocation_pending and acknowledges external organization owners (SECURITY.md:63). LV-04 targets OPERATIONS.md:12's stronger old-generation claim and the late-own-call schedule, not unavoidable independent owner grants or absence of all reconciliation.
4. Single-course teacher can overwrite an active global binding: rejected as stated. DATA-MODEL.md:145 and active uniqueness explicitly oppose that. LV-03 requires an already legitimately revoked predecessor and ordinary reapproval; global invariants might be interpreted to reject it, so report a missing transition invariant, not an unconditional exploit.
5. Missing row_version on an immutable receipt is harmless: rejected for GET current submission-request state used to prepare a mutable resolution. An immutable POST acknowledgement may remain unchanged; its reuse as the only current-status shape creates LV-02.

Cross-review priority: challenge LV-03 against any interpretation that ALL previously bound-profile approvals necessarily count as correction; if made explicit, close the gap. Challenge LV-04 against actual unresolved-call accounting, not merely pre-call generation checks. Do not double-count wildcard's separate missing teacher-rejection action as LV-02; they affect the same resolution surface but require distinct field/transition repairs.
