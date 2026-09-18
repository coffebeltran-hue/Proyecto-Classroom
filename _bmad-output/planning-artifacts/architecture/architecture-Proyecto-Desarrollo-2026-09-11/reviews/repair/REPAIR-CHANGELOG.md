# Applied documentary repair changelog

Date: 2026-09-17. Authority: Juan's explicit “ARCHITECTURE REPAIR DECISIONS” following [REPAIR-PROPOSAL.md](REPAIR-PROPOSAL.md). The proposal remains unchanged as historical review input. This record describes applied documentation, not implementation or operational closure.

## Decisions and scope

DECISION AD-5: Option A, trusted complete-request backend UTC ingress with server-bound context before internal waits; official only after durable intake. No volatile reconstruction/backdating. Receipt, persistence-stage, confirmation and provenance are distinct; clock/policy uncertainty remains needs_review, never automatic late. R-01 historical branch-observation/TTL remains PROPOSED and RR-04 remains open.

DECISION AD-7: Option C, ordinary publication after verified historical-code deletion blocked; institutional scoped exception permits the teacher to publish. Preserve exact scope, authorizer, publishing teacher, mandatory reason, remaining basis, student-safe explanation and immutable history. Historical code remains unavailable; no restored bytes or retroactive twelve-month byte promise. Post-deletion recapture OUT OF MVP. Future recapture requires a separate decision/new provenance.

AD-1–11 stay ADOPTED with only those express clarifications. AD-12–18 are revised but remain PROPOSED / RECOMMENDATION; AD-17 remains conditional on RR-03. No AD-19 or new stack component. No application code, migrations, infrastructure, GitHub resources, provider/runtime experiment or deployment was authorized or performed. Temporary isolated tooling was used solely to validate the document contract; no project dependency baseline was created.

## Exact ACR change map

Paths below are relative to the architecture package. Each entry is **DOCUMENTARILY ADDRESSED — TARGETED INDEPENDENT RE-REVIEW PENDING**. Operational status of every ACR remains OPEN / PROOF REQUIRED.

| ACR | Repaired invariant/mechanism | Exact modified artifacts | Related AD/R/OQ/RR and proof still required |
| --- | --- | --- | --- |
| ACR-001 HIGH | Every activation checks all affected course authority and profile/enrollment context; revoked predecessor cannot use a weaker approval path | ARCHITECTURE-SPINE.md AD-12/18; DATA-MODEL.md identity transaction; SECURITY.md RBAC; STATE-MACHINES.md Identity; GITHUB.md identity repair; API.md Identity activation; reviews/build-contract.py and openapi.json IdentityDecision/BindingCorrection/IdentityRequestStaff; DELIVERY.md RP-T01 | AD-3/12/18, R-03, OQ-12; DB/RLS/enrollment/role races and fresh-session scope E2E |
| ACR-002 HIGH | Possibly issued old remote effects remain durable; desired local access and observed cleanup are separate per account | ARCHITECTURE-SPINE.md AD-13/18; ARCHITECTURE.md module rationale; DATA-MODEL.md access subjects/attempts; OPERATIONS.md access protocol; GITHUB.md access repair; SECURITY.md external effects; STATE-MACHINES.md access; API.md operational projections; generator/OpenAPI ExternalCleanup/Repository/AcceptedAssignment/Operation; DELIVERY.md RP-T03 | AD-3/10/13/18; RR-03 simulator plus real collaborator/invitation evidence, no instantaneous guarantee |
| ACR-003 HIGH | Cancel and start are exclusive; canceled outcome survives independent replay before acknowledgement | ARCHITECTURE-SPINE.md AD-15; ARCHITECTURE.md journal rationale; DATA-MODEL.md deletion phases/journal; OPERATIONS.md cancel/start/restore; STATE-MACHINES.md deletion; SECURITY.md cancellation authority; API.md cancellation/read prerequisite; generator/OpenAPI cancellation route/Operation/DeletionOperationReference/Snapshot; DELIVERY.md RP-T04 | AD-7/15, R-10, RR-05; crash/replay, journal completeness, old-worker fencing and exact-copy proof |
| ACR-004 HIGH | Course reopen/policy fence and purge claim share ordering; earlier claim disclosed | ARCHITECTURE-SPINE.md AD-15; ARCHITECTURE.md rationale; DATA-MODEL.md classroom generation/lock order; OPERATIONS.md course fence; STATE-MACHINES.md capture/deletion; SECURITY.md retention threat; API.md reopen; generator/OpenAPI Classroom/reopen authorization; DELIVERY.md RP-T05 | AD-7/15; RR-05/07 barrier schedules and load/recovery |
| ACR-005 HIGH | Intake sequence inherited by confirmed revision, independent of completion order; latest request/confirmed/graded differ | ARCHITECTURE-SPINE.md AD-14; DATA-MODEL.md requests/acceptance/Submission/indexes; STATE-MACHINES.md request/grade; API.md receipt/order; generator/OpenAPI receipt/status/RequestSummary/CurrentGrade/Submission; DISCUSSION.md chronological supersession; DELIVERY.md RP-T06 | AD-2/4/5/14; RR-04 reverse-completion, gaps, replay and projection tests |
| ACR-006 HIGH | Durable unconfirmed requests discoverable without local keys under scoped authorization | ARCHITECTURE-SPINE.md AD-12/14; DATA-MODEL.md indexes; API.md collections; STATE-MACHINES.md recovery; SECURITY.md request-read RBAC; generator/OpenAPI two GET collections/SubmissionRequestStatusPage; DELIVERY.md RP-T07 | AD-5/12/14, OQ-12; fresh-session, live-filter/cursor and tenant/course negative tests |
| ACR-007 MEDIUM | Existing sweep fairly re-admits fitting quota waiters after all capacity releases; settle once | ARCHITECTURE-SPINE.md AD-16; DATA-MODEL.md reservations/sweep; OPERATIONS.md scan_quota/capture/metrics; API.md operational projections; DELIVERY.md RP-T09; EVIDENCE.md repair proof | AD-6/7/13/16, R-06, OQ-13, RR-02/06; 50-capture refund/reclaim/crash/fairness proof |
| ACR-008 MEDIUM | Server derives active GitHub account; client needs no private account UUID | ARCHITECTURE-SPINE.md AD-18; DATA-MODEL.md intake; API.md identity bootstrap; SECURITY.md intake; GITHUB.md identity; STATE-MACHINES.md Identity; generator/OpenAPI IdentityRequestInput; DELIVERY.md RP-T02 | AD-3/18; fresh-login contract/E2E, account switch and replay |
| ACR-009 MEDIUM | Current request read supplies the version resolved; original acknowledgement replay is immutable | ARCHITECTURE-SPINE.md AD-13/14; DATA-MODEL.md request/resolution/idempotency; API.md current read/CAS; STATE-MACHINES.md commands; generator/OpenAPI SubmissionRequestStatus/AcademicResolution; DELIVERY.md RP-T08 | AD-5/13/14; competing teacher/worker CAS, exact replay and API chaining |
| ACR-010 MEDIUM | Explicit reject/confirm_exception/reclassify cannot conflate state with punctuality or fabricate incidents | ARCHITECTURE-SPINE.md AD-14; DATA-MODEL.md resolutions; STATE-MACHINES.md command matrix; SECURITY.md teacher-only resolution; API.md resolution; generator/OpenAPI discriminated inputs/incident split; DELIVERY.md RP-T08 | AD-5/14; transition/evidence guards, terminal rejection, concurrency/E2E |
| ACR-011 MEDIUM | Incident detection/delivery survives API/DB/notice-store failure | ARCHITECTURE-SPINE.md operational trace; ARCHITECTURE.md observer diagram; OPERATIONS.md monitoring; SECURITY.md monitor scope; API.md operational boundary; DELIVERY.md RP-T12; EVIDENCE.md R-11 | AD-11, R-11, OQ-10/13, RR-07; named owner/targets and external fault drill |

Common authority/status reconciliation: README.md, REVIEW.md, EVIDENCE.md, DISCUSSION.md and package .memlog.md. Core-party memory `_bmad-output/party-mode/memories/installed/.memlog.md` received a chronological outcome entry. Historical entries were not rewritten as new approvals. Both approved policy clarifications are recorded in the package memlog.

## Policy-specific contract changes

AD-5 changed spine, DATA-MODEL timing/policy history, API receipt/provenance, STATE-MACHINES uncertainty, EVIDENCE R-01, generator/OpenAPI and DELIVERY RP-T10. Nullable deadline has known/no_deadline/uncertain discriminator; original policy candidates survive later resolution. persistence_recorded_at is explicitly a persistence-stage sample, not an exact transaction-commit claim. Policy activation intervals/epochs and clock handling remain RR-04 mechanisms needing proof.

AD-7 changed spine, DATA-MODEL exact publication grant/exception history, SECURITY grant versus publication authority, API input/publication projections, STATE-MACHINES, OPERATIONS, EVIDENCE R-10, generator/OpenAPI and DELIVERY RP-T11. Grant is exact course/submission/evaluation/draft scope and one publication; original retry reuses its result. Student sees safe unavailable-code explanation while internal evidence remains restricted. Existing draft read returns the eligible own-teacher grant ID, or null when absent/expired/revoked/consumed/wrong scope and always null for TA. Active purge still conflicts; no MVP recapture path exists.

## Author checks and corrections

[Rubric](AUTHOR-CHECK-RUBRIC.md) and [evidence](AUTHOR-CHECK-EVIDENCE.md) checks found no actionable blockers within their scopes. [Seam check](AUTHOR-CHECK-SEAMS.md) preserved two initial findings, not additional independent ACRs:

- SEAM-01: discovery of worker-created deletion operations. Repaired with optional scoped Snapshot.deletion_operation reference and existing Operation GET; deletion_operation_version is the cancellation CAS token, not the queue/outbox version. Scoped operator can read that metadata; student/unauthorized staff omit it.
- SEAM-02: teacher discovery of institution-issued exception grant. Repaired through existing DraftGrade.eligible_deleted_evidence_grant_id with exact scope/expiry/revocation/consumption filtering and publish-time revalidation. No new grant directory or endpoint.

These are author-side checks and repair dispositions. They do not replace the requested targeted independent Anti-Consensus re-review. Original independent findings/severity dissent remain unchanged.

## Validation and limits

Current contract: **85 paths, 97 operations, 112 schemas**, document version 0.2.0-design. The generator remains document-only. The three added routes are the two request collections and deletion cancellation; existing reads cover new mutation prerequisites. [REPAIR-CHECKS.json](REPAIR-CHECKS.json) is the captured structural/cross-document record, including formal OpenAPI validation, schema examples, source/generated equality, internal links, AD statuses and preserved independent-file hashes.

No runtime/provider test, RLS test, load test or deployment ran. A structurally valid schema does not establish execution correctness. OQ-10–13 and RR-01–08 remain OPEN; AD-17 depends on real RR-03 evidence; R-01 is not adopted. No ACR is operationally closed.

## Targeted re-review handoff

Compare repaired package against the original manifest and ACR register, using this map rather than restarting discovery. Recheck the 11 repaired counterexamples, new read prerequisites, compatible lock order, temporal policy uncertainty and exact AD-7 grant flow. Prior findings are preserved in reviews/anti-consensus; future reviewers should write a new review record rather than overwrite that evidence.

The package is ready for targeted independent documentary re-review once the recorded structural checks pass. Implementation authorization and separately scoped provider/runtime experiments remain Juan's later decisions. **STOP before implementation.**
