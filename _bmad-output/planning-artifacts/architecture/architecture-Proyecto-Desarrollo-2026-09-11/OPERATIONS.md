# Jobs, preservation and recovery

## Durable effects

RECOMMENDATION: domain transaction commits aggregate state + audit + outbox. Dispatcher claims outbox using short row locks, enqueues a pg-boss job with stable operation key, then marks dispatch. Crash after enqueue/before mark can duplicate delivery; worker domain operation uniqueness and checkpoints prevent duplicate effects. Never mark domain operation completed merely because it was enqueued. Worker job completion follows durable effect commit.

Separate job DTOs carry schema version, tenant ID, aggregate ID, operation ID, causation ID; never secrets or arbitrary URLs. Workers reread authoritative state. Exactly-once external effects are not claimed. Leases bound work and heartbeats detect crash; side effects reconcile after uncertain response. Retry budget proposed eight transient attempts, exponential jitter and max 24-hour automatic window; exhausted jobs go to operator-visible terminal failure, not disappearance. Deterministic auth/size/schema conflicts wait for a state/config change.

| Job | Key/checkpoint | Failure/recovery |
| --- | --- | --- |
| provision_repository | acceptance ID + provisioning generation; one step record per phase | Verify uncertain creation before retry; operator on ambiguous ownership |
| reconcile_access | binding/repo/access generation | Re-read desired membership; record potentially issued attempts per account; old remote grants may complete, never certify cleanup until resolved |
| validate_submission | request ID | Confirm once via unique request; receipt immutable; needs_review for historical uncertainty |
| ingest_workflow | repo/run/attempt | Fetch expected report; bounded validation; no grade capability |
| capture_snapshot | submission ID + capture generation | Quota reserve; stage; digest/manifest; commit; clean orphan only after DB/reference reconciliation |
| purge_snapshot | snapshot/deletion generation | Shared retention fence; tombstone durable; verify every recoverable copy |
| reconcile_installation/repository | install/repo + schedule bucket | Cursor progress, installation fair rate budget |
| import_roster | import operation ID | Preview and atomic apply for bounded MVP 5,000-row import; duplicate identifiers rejected |
| export_grades | authorized export operation ID | Private expiring CSV; recheck permission on download |
| close_course_retention | course/close event | Recalculate snapshots without shortening previously promised dates |
| scan_quota/holds/deletions | tenant + schedule bucket | Bounded fair quota re-admission after refunds/reclamation/deletion/increase; alerts deduplicated; hold review never releases |
| migrate_retention_policy | policy migration operation ID | Explicit affected courses/old/new policy; never silently shorten promises; checkpoint each snapshot |
| deliver_notice | recipient/resource/event key | Safe in-app notice persisted once, no external email assumed |

API Operation.state is a projection: outbox pending/enqueued becomes pending, active lease becomes running, committed effect completed, terminal error failed, and deterministic/manual hold blocked. It is not the pg-boss internal state enum. Named domain events map to jobs: AssignmentAccepted→provision_repository; IdentityBindingReplaced/RosterWithdrawn→reconcile_access; SubmissionRequestReceived→validate_submission; SubmissionConfirmed→capture_snapshot; WorkflowRunObserved→ingest_workflow; AcademicClosed/Reopened→close_course_retention; GradePublished→transactional retention extension plus deliver_notice; GradeWithdrawn→deliver_notice only; QuotaPolicyChanged→scan_quota and unblock captures; RetentionPolicyMigrationRequested→migrate_retention_policy. Events retain schema version and operation/tenant/aggregate references.

pg-boss owns scheduling/leases; domain operation records own business outcome. Precreate queues in release migration, use runtime migrate:false; verify runtime DDL needs under selected pg-boss version. Set timeouts/heartbeat compatible with 100 MiB transfers and avoid jobs killed by HTTP deploys. Database pool budgets account for API, workers and queue clients; size them from load test, not unbounded replica counts.

## Snapshot algorithm

1. Submission confirmation creates snapshot metadata and outbox in one transaction, even when quota appears full.
2. Lock institution quota then course quota; reserve configured maximum capture bytes before starting (conservative; release unused reservation after actual size). If unavailable, blocked_by_quota with alert; no endless automatic retry. Resume automatically through the existing bounded scan_quota recovery sweep after any effective capacity release, including ordinary refunds and lease reclamation; quota-change/deletion wakeups only accelerate recovery.
3. Resolve stored repo ID and exact SHA with allowed GitHub endpoints. Stream to staging object while computing SHA-256 of actual downloaded archive bytes and checking compressed size. Digest is of stored bytes; GitHub may regenerate a different archive representation later, so retain capture mechanism/version and semantic content manifest separately.
4. Perform bounded streaming structural inspection without extracting/executing: cumulative expanded bytes <=500 MiB, entries <=20,000, compressed <=100 MiB by pilot config. Reject traversal, absolute paths, device files, unsafe links and malformed/overlapping entries. External references are enumerated, not fetched. Reports/artifact archives have separate lower limits (proposed 5 MiB, 1,000 entries).
5. Manifest declares captured regular Git content, LFS pointer/full-object status, submodule references, external/dependency exclusions and inspection results. `available` means byte integrity/provenance verified, not automatically self-contained or runnable. Do not call an archive complete beyond its declared scope.
6. Promote to immutable opaque key scoped tenant/course/submission/capture generation. Verify object size/checksum; transaction records version/digest/manifest/captured time, charges actual quota and releases reservation. Crash reconciliation finds uploaded objects by operation tags and adopts only a matching operation; otherwise controlled orphan purge.
7. Expired reservation cannot permit an old worker to commit after a newer lease. Compare generation/lease and reject stale commit. Account for orphan/staging bytes in operational metrics until cleanup completes.

Capture failure never invalidates confirmed submission or alters punctuality. A subsequent successful capture cannot prove earlier GitHub availability. Source loss is explicit `source_unavailable`; teacher may evaluate other evidence but cannot silently replace snapshot SHA.

## Retention and purge

Use calendar months in course timezone for 12-month anniversary, store computed UTC date and policy version; month-end clamps to final valid day (RECOMMENDATION). Course active/no academic_close gives no expiry. Academic close sets base retention; later publication extends still-retainable referenced evidence to max(existing, publication anniversary). Under adopted AD-7 clarification, verified-deleted evidence blocks ordinary publication; exact scoped institutional exception permits teacher publication with immutable unavailable-code disclosure, never a retroactive byte-retention promise. Post-deletion recapture is outside MVP. Withdrawal never shortens. Reopening a course suspends eligibility and requires a later explicit close; previously communicated retention is a floor.

After expiry start 30 calendar days pending deletion and record notifications to responsible staff. Hold includes reason, responsible person, creation, review date and explicit release; overdue review triggers alert only. Policy shortening requires explicit audited migration and institutional authorization, not a config edit that rewrites old receipts.

Purge claim transaction follows the DATA-MODEL lock order: lock classroom eligibility before snapshot, recheck closure/pending recalculation and retention/holds, set generation/in_progress plus protocol_phase=prepared and commit the journal intent. Record course retention_generation; cached retain_until alone is insufficient. Export tombstone to independent append-only journal before destructive calls; failure pauses purge. New publication/hold encountering fence returns an explicit conflict for operator resolution (no pretend undo). Delete exact versions/replicas/backups known in inventory; primary 404 alone does not prove total deletion. Verified requires provider evidence and completion of recoverable-copy inventory. Failure remains retriable with fence intact; operator cancellation competes with destructive-start authorization as specified below; no completion before independently durable canceled record and exact byte verification.

Permanently retain approved minimal academic metadata. Object location need not remain a live URL after purge. Backup maximum extra 30-day disappearance is RESEARCH REQUIRED; do not encode it as a promise or mark verified on a timer. Restore procedure: isolated restore, stop/fence old workers and credentials, load a completeness-verified current independent journal, reconcile ordered prepared/canceled/start-authorized/verified generations, quarantine ambiguities, verify references/digests and only then reopen authorized access. Never blindly replay prepared intent as permission to delete.

## Failure matrix

| Trigger | User-visible effect | Recovery / owner |
| --- | --- | --- |
| DB down before intake | No acknowledged receipt | Retry with same key; teacher exception cannot fabricate original receipt |
| DB down after durable intake | Receipt remains; processing pending | Worker resumes from outbox |
| GitHub timeout on create | Provisioning outcome unknown | Reconcile ID/provenance; operator if uncertain |
| Repo/template deleted or inaccessible | Needs intervention; prior academic records retained | Restore access/source or explicit teacher resolution |
| App removed/teacher permissions lost | Integration blocked, persisted views available | Institutional owner reinstalls; reverify authorization |
| Worker killed after side effect | Pending until lease/reconciliation | Adopt verified side effect, no blind duplicate |
| Webhook out of order/duplicate | No grade change; snapshot may be stale | Deduplicate effects and reread provider state |
| Actions off/cancelled/report malformed | Formative result unavailable/invalid, not zero | Teacher config/provider correction |
| Quota or archive violation | Confirmed submission, preservation blocked | Staff capacity/config decision; no truncation |
| New grade races withdrawal | Conflict on stale expected publication | Refresh; never withdraw replacement |
| Hold/new publication races purge | Conflict if purge fence won | Operator resolves; never claim preservation after deletion |
| Student removed/identity replaced | Academic permission removed; GitHub access change pending | Durable access reconciliation, audit, no historical reassignment |
| Storage/DB restored from different times | Download readiness withheld | Tombstone replay, checksum/reference reconciliation |

## Observability

Structured redacted logs: request/operation/tenant pseudonymous IDs, endpoint, worker kind, provider request ID, attempt and stable error. Trace intake→outbox→queue→provider→effect without secrets/student code. Metrics: API latency/error rate; DB pool waits/deadlocks; outbox oldest age; queue lag/retries/lease expiries; GitHub rate budget and inaccessible installs; request validation age/needs_review; publication conflicts; webhook lag/failed delivery recovery; snapshot size mean/p50/p95/p99, compressed/expanded bytes, capture duration, usage/reservations per course/institution, growth, blocked captures, failures and limit frequency; overdue holds/purge states/tombstone replication lag.

Proposed alarms: persistent outbox age >5 minutes; failed receipt persistence >0; integration suspension; quota 80/95%; preservation blocked; unknown deletion completeness; restore journal lag. Product notices stay deduplicated in-app. Incident detection/delivery uses an independent hosting/uptime observer and owned external route that survives API/DB/notice-store failure. Missing worker progress/telemetry is monitored; liveness alone is insufficient. Owner/threshold/support coverage remain OQ-10/13, fault proof RR-07. Before task publication display actual usage and estimate from roster × expected revisions × observed p95; label forecast uncertainty. Do not promise capture capacity merely because forecast is below quota.

## Corrected durable access protocol — ACR-002 / AD-13/18

Local identity revocation denies academic authorization immediately and advances desired access generation with outbox. Per repository/account, a short transaction records a possibly issued attempt before any PUT/DELETE. No DB transaction spans GitHub. Worker rechecks desired generation before sending, then appends response/uncertainty for that attempt; stale completion may not update current desired state or certify cleanup. Timeout, lease expiry or absent read cannot prove an old PUT settled. Never blindly repeat uncertain grants. Startup/reclaim enumerates unresolved attempts independently of queue retention and reconciles collaborators plus pending invitations; old and new accounts are separate subjects.

Existing reconcile_access schedule must keep bounded recurring cleanup while desired revocation is unresolved, including after worker crashes or automatic retry-budget exhaustion (escalate the mutation failure; do not erase the durable watch). State revocation_pending/blocked is truthful while old effects may complete. observed_absent requires timestamp and no unresolved prior own grant. If no supported finite settlement bound exists, retain uncertainty and escalation rather than a timeout-to-success transition. Effective access can still drift from external owner actions; continued observations are conditional on reachable provider and permissions. RR-03 must prove tested collaborator/invitation cleanup; no instantaneous or unconditional convergence claim.

## Cancellation and destructive dispatch — ACR-003 / AD-15

The public deletion lifecycle and internal protocol phase are separate. prepared means claimed and fenced, not a completed deletion. Before any delete, export prepared idempotently with operation/generation/sequence and predecessor checkpoint. Cancellation and start use one CAS under the same snapshot/operation locks:

- prepared→cancel_pending wins: no destructive dispatch is legal. Exact object/version/digest availability is checked outside locks, then canceled is exported with verification/actor/reason. Exporter requires prepared readback first. Final short transaction verifies canceled journal readback and unchanged phase, completes cancellation and releases fence. If bytes cannot be verified or journal is unavailable, remain blocked/cancel_pending; do not fall back to start. Original cancellation POST replays its accepted response; Operation GET shows completion.
- prepared→start_pending wins: requires prepared export confirmed. Export destructive_start_authorized before the delete call, then dispatch outside DB locks. Cancellation conflicts once start_pending commits, even if no primary deletion has been observed. Worker crash here remains start-uncertain, never cancelable merely because timeout elapsed.
- Provider failures retain fence; delete retries reconcile exact inventory. verified journal outcome and DB physical verified state require all recoverable copies accounted for. Journal-success/DB-ack loss is recovered by stable event identity/readback.

Per-operation exporter follows immutable predecessor sequence; duplicates must have matching digest, gaps/conflicts quarantine. Canceled generation never authorizes destruction on restore. A later authorized generation may coexist but cannot erase earlier cancellation. Prepared-only or missing journal completeness is quarantine, not automatic delete. Start-authorized remains inaccessible until reconciled; verified cannot resurrect. Recovery fences the old environment before resuming effects. Lost later holds/obligations beyond DB RPO are not reconstructed by a cancellation record: canceled evidence remains protected from new destruction until obligations are reconciled and a fresh eligibility decision is authorized. RR-05 remains open, including independent-journal durability/readback/restore proof and provider copies.

## Course fence and quota sweep — ACR-004/007

Close/reopen/policy migration and purge claims share the classroom lock; publication and hold use classroom before current-grade if applicable and then sorted snapshots. Reopen clears closure and increments retention_generation synchronously; prior purge claims are disclosed, not reversed. Migration commits pending fences on its bounded sorted course set before acknowledgement. Async recalculation preserves previous floors and clears pending only under matching generation. Pending or active course denies new purge; purge-first remains a visible operation. There is no slow storage/GitHub call under these locks.

scan_quota is now an admission/recovery job, not just alerting. Persist fair course rotation and bounded row/attempt cursor/progress; reconsider quota waiters after refund, reservation release/reclamation, deletion accounting and limit increases. Re-admission locks institution then course quota account, reserves once and appends capture outbox. Once-only charge/refund settlement is atomic across both accounts; stale generations cannot settle twice. A missed acceleration signal is recovered by the recurring sweep. Track last inspected capacity generation to avoid busy retries with unchanged shortage; periodic bounded checks also discover new work. Size/structure/source failures are not quota waiters. All fitting finite backlog work progresses when worker/provider healthy and capacity stable; sweep period/budget and physical orphan budget require RR-06/OQ-13 measurements.

Named events refined: IdentityBindingActivated/Revoked/Replaced and RosterWithdrawn→reconcile_access; SubmissionRequestReceived→validate_submission using immutable request_sequence; SubmissionConfirmed→capture_snapshot; DeletionCancellationRequested→existing purge_snapshot handler's cancellation phase; AcademicReopened/RetentionPolicyMigrationRequested commit synchronous course fences before async projection work. No new broker or queue authority. Cancellation and access attempt details project through scoped Operation reads. Receipt clock/policy uncertainty becomes request needs_review with unresolved academic classification, never a worker timestamp substituted into received_at.

## Operational proof and observability — ACR-011

Add unresolved access attempt age, observed-access age, canceled/start journal lag, course recalculation lag, quota sweep age/admission fairness, ingress-to-persistence waiting, clock-health uncertainty and policy-resolution backlog. Monitor API readiness, DB reachability and worker processing progress externally; missing metrics/heartbeat alerts independently. One owned incident route suffices; product email integration is not required. An independent monitor outage itself has detection/escalation. No arbitrary numeric SLO is claimed: OQ-13 and RP-T12/RR-07 govern approval and proof.
