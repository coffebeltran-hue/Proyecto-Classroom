# Jobs, preservation and recovery

## Durable effects

RECOMMENDATION: domain transaction commits aggregate state + audit + outbox. Dispatcher claims outbox using short row locks, enqueues a pg-boss job with stable operation key, then marks dispatch. Crash after enqueue/before mark can duplicate delivery; worker domain operation uniqueness and checkpoints prevent duplicate effects. Never mark domain operation completed merely because it was enqueued. Worker job completion follows durable effect commit.

Separate job DTOs carry schema version, tenant ID, aggregate ID, operation ID, causation ID; never secrets or arbitrary URLs. Workers reread authoritative state. Exactly-once external effects are not claimed. Leases bound work and heartbeats detect crash; side effects reconcile after uncertain response. Retry budget proposed eight transient attempts, exponential jitter and max 24-hour automatic window; exhausted jobs go to operator-visible terminal failure, not disappearance. Deterministic auth/size/schema conflicts wait for a state/config change.

| Job | Key/checkpoint | Failure/recovery |
| --- | --- | --- |
| provision_repository | acceptance ID + provisioning generation; one step record per phase | Verify uncertain creation before retry; operator on ambiguous ownership |
| reconcile_access | binding/repo/access generation | Re-read desired membership; old generation cannot grant revoked account |
| validate_submission | request ID | Confirm once via unique request; receipt immutable; needs_review for historical uncertainty |
| ingest_workflow | repo/run/attempt | Fetch expected report; bounded validation; no grade capability |
| capture_snapshot | submission ID + capture generation | Quota reserve; stage; digest/manifest; commit; clean orphan only after DB/reference reconciliation |
| purge_snapshot | snapshot/deletion generation | Shared retention fence; tombstone durable; verify every recoverable copy |
| reconcile_installation/repository | install/repo + schedule bucket | Cursor progress, installation fair rate budget |
| import_roster | import operation ID | Preview and atomic apply for bounded MVP 5,000-row import; duplicate identifiers rejected |
| export_grades | authorized export operation ID | Private expiring CSV; recheck permission on download |
| close_course_retention | course/close event | Recalculate snapshots without shortening previously promised dates |
| scan_quota/holds/deletions | tenant + schedule bucket | Alerts deduplicated; review date never releases hold |
| migrate_retention_policy | policy migration operation ID | Explicit affected courses/old/new policy; never silently shorten promises; checkpoint each snapshot |
| deliver_notice | recipient/resource/event key | Safe in-app notice persisted once, no external email assumed |

API Operation.state is a projection: outbox pending/enqueued becomes pending, active lease becomes running, committed effect completed, terminal error failed, and deterministic/manual hold blocked. It is not the pg-boss internal state enum. Named domain events map to jobs: AssignmentAccepted→provision_repository; IdentityBindingReplaced/RosterWithdrawn→reconcile_access; SubmissionRequestReceived→validate_submission; SubmissionConfirmed→capture_snapshot; WorkflowRunObserved→ingest_workflow; AcademicClosed/Reopened→close_course_retention; GradePublished→transactional retention extension plus deliver_notice; GradeWithdrawn→deliver_notice only; QuotaPolicyChanged→scan_quota and unblock captures; RetentionPolicyMigrationRequested→migrate_retention_policy. Events retain schema version and operation/tenant/aggregate references.

pg-boss owns scheduling/leases; domain operation records own business outcome. Precreate queues in release migration, use runtime migrate:false; verify runtime DDL needs under selected pg-boss version. Set timeouts/heartbeat compatible with 100 MiB transfers and avoid jobs killed by HTTP deploys. Database pool budgets account for API, workers and queue clients; size them from load test, not unbounded replica counts.

## Snapshot algorithm

1. Submission confirmation creates snapshot metadata and outbox in one transaction, even when quota appears full.
2. Lock institution quota then course quota; reserve configured maximum capture bytes before starting (conservative; release unused reservation after actual size). If unavailable, blocked_by_quota with alert; no endless automatic retry. Resume on quota change/deletion event.
3. Resolve stored repo ID and exact SHA with allowed GitHub endpoints. Stream to staging object while computing SHA-256 of actual downloaded archive bytes and checking compressed size. Digest is of stored bytes; GitHub may regenerate a different archive representation later, so retain capture mechanism/version and semantic content manifest separately.
4. Perform bounded streaming structural inspection without extracting/executing: cumulative expanded bytes <=500 MiB, entries <=20,000, compressed <=100 MiB by pilot config. Reject traversal, absolute paths, device files, unsafe links and malformed/overlapping entries. External references are enumerated, not fetched. Reports/artifact archives have separate lower limits (proposed 5 MiB, 1,000 entries).
5. Manifest declares captured regular Git content, LFS pointer/full-object status, submodule references, external/dependency exclusions and inspection results. `available` means byte integrity/provenance verified, not automatically self-contained or runnable. Do not call an archive complete beyond its declared scope.
6. Promote to immutable opaque key scoped tenant/course/submission/capture generation. Verify object size/checksum; transaction records version/digest/manifest/captured time, charges actual quota and releases reservation. Crash reconciliation finds uploaded objects by operation tags and adopts only a matching operation; otherwise controlled orphan purge.
7. Expired reservation cannot permit an old worker to commit after a newer lease. Compare generation/lease and reject stale commit. Account for orphan/staging bytes in operational metrics until cleanup completes.

Capture failure never invalidates confirmed submission or alters punctuality. A subsequent successful capture cannot prove earlier GitHub availability. Source loss is explicit `source_unavailable`; teacher may evaluate other evidence but cannot silently replace snapshot SHA.

## Retention and purge

Use calendar months in course timezone for 12-month anniversary, store computed UTC date and policy version; month-end clamps to final valid day (RECOMMENDATION). Course active/no academic_close gives no expiry. Academic close sets base retention; later publication extends referenced snapshot to max(existing, publication anniversary). Withdrawal never shortens. Reopening a course suspends eligibility and requires a later explicit close; previously communicated retention is a floor.

After expiry start 30 calendar days pending deletion and record notifications to responsible staff. Hold includes reason, responsible person, creation, review date and explicit release; overdue review triggers alert only. Policy shortening requires explicit audited migration and institutional authorization, not a config edit that rewrites old receipts.

Purge fence transaction locks snapshot, rejects active hold/new retention, sets generation/in_progress and commits tombstone. Export tombstone to independent append-only journal before destructive calls; failure pauses purge. New publication/hold encountering fence returns an explicit conflict for operator resolution (no pretend undo). Delete exact versions/replicas/backups known in inventory; primary 404 alone does not prove total deletion. Verified requires provider evidence and completion of recoverable-copy inventory. Failure remains retriable with fence intact; operator may cancel only before irreversible deletion and with verified byte availability.

Permanently retain approved minimal academic metadata. Object location need not remain a live URL after purge. Backup maximum extra 30-day disappearance is RESEARCH REQUIRED; do not encode it as a promise or mark verified on a timer. Restore procedure: isolated restore, load current independent tombstone journal, purge/quarantine resurrected objects and metadata access, reconcile all generations, validate checks, only then reopen API/downloads.

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

Proposed alarms: persistent outbox age >5 minutes; failed receipt persistence >0; integration suspension; quota 80/95%; preservation blocked; unknown deletion completeness; restore journal lag. Alert routing goes to responsible institutional/operator role, with deduplicated in-app notices in MVP. Before task publication display actual usage and estimate from roster × expected revisions × observed p95; label forecast uncertainty. Do not promise capture capacity merely because forecast is below quota.
