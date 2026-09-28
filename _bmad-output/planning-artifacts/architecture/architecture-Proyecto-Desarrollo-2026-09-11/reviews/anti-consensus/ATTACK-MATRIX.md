# Anti-Consensus attack matrix

This is a documentary counterexample analysis, not an executed security test or benchmark. `DEFENSE SPECIFIED` means the stated design contains a relevant guard; it does not mean that a future implementation passes. `GAP` denotes a concrete contract/protocol gap requiring disposition. `EXPERIMENT` denotes a provider/runtime claim that documentation cannot settle. Final finding identifiers and disposition are in [FINDINGS.md](FINDINGS.md).

## Trust reconstruction

The browser authenticates through GitHub but receives a platform session. PostgreSQL owns academic identity, enrollment, receipt, evaluation and official publication. GitHub owns external account/repository state and workflow execution. The object store owns archived bytes; PostgreSQL holds provenance, authorization and retention metadata. A signature authenticates a webhook sender, not a student's test honesty. pg-boss delivers work at least once; durable domain records must decide whether an effect is complete. Academic authority must not be derived from GitHub organization membership.

## Attack coverage

| ID | Scenario / counterexample | Stated defense or unresolved obligation | Documentary result |
| --- | --- | --- | --- |
| AT-01 | Tenant A supplies B's acceptance, submission, publication or snapshot UUID | Resource-derived authorization, composite tenant FKs, forced RLS and download authorization are explicit; test each runtime role and indirect JOIN | DEFENSE SPECIFIED; no demonstrated cross-tenant bypass from UUID knowledge alone |
| AT-02 | A valid global UUID is paired with a different tenant or course | Tenant composite FKs protect tenant equality; course equality requires additional tuples/triggers, not merely RLS | EXPERIMENT: direct SQL negative tests and complete ownership constraints |
| AT-03 | Worker receives a manipulated tenant/aggregate pair | Reread authoritative operation and validated installation mapping, not payload authority; queue role cannot grade | DEFENSE SPECIFIED; inspect producer-to-consumer grants during implementation |
| AT-04 | Pool connection retains previous tenant/actor | Transaction-local context and non-owner/non-BYPASSRLS runtime principals specified | DEFENSE SPECIFIED; pool reuse and missing-context tests mandatory |
| AT-05 | Known object key, cursor, export ID or audit ID used across tenants | No browser object keys; authenticated downloads; scoped paginated queries and export reauthorization | DEFENSE SPECIFIED; cursors must not become authority |
| AT-06 | Student knows code, name, email or invite and claims another profile | Teacher confirmation and non-enumerating intake; knowledge alone cannot bind | DEFENSE SPECIFIED; teacher's actual verification workflow remains an operational trust assumption |
| AT-07 | Two teachers approve competing identities simultaneously | Active-binding partial uniqueness and transactional approval | DEFENSE SPECIFIED; profile/account/request consistency must be tested |
| AT-08 | Teacher corrects an identity used by another course | All-affected-course scope or an explicit institutional correction grant | DEFENSE SPECIFIED; concurrent enrollment/scope changes need serialization |
| AT-09 | Revoked identity retains local session or pending external grant | Local authorization rechecked; external revocation explicitly asynchronous | GAP: remote request ordering and current-generation convergence require more than a local generation check |
| AT-10 | GitHub username changes, organization membership disappears, roster is withdrawn | Stable external IDs; active academic binding/roster; durable access reconciliation | DEFENSE SPECIFIED; effective GitHub permission removal is not instantaneous |
| AT-11 | Lost invite response or reuse after disable/expiry | Hashed token, disabled/expiry checks and enrollment requirement | DEFENSE SPECIFIED; secret-bearing idempotent response recovery needs an explicit persistence contract |
| AT-12 | Double click: same key and same SHA, including crash after commit before ACK | Unique idempotency record + receipt/outbox transaction; replay original outcome | DEFENSE SPECIFIED at semantic level; exact response reconstruction/storage requires verification |
| AT-13 | Same key with changed SHA/payload/version | Payload-hash conflict, new key required | DEFENSE SPECIFIED |
| AT-14 | Different keys, same SHA | DISCUSSION explicitly allows deliberate independent revisions | DEFENSE SPECIFIED; not deduplicated by SHA |
| AT-15 | Two submissions validate in reverse order | Revision counter is allocated at confirmation | GAP: request chronology versus 'latest revision' must be made explicit |
| AT-16 | Arrival at deadline, 23:59:59.999, wrong client clock | Backend UTC, inclusive comparison; client/commit clock rejected | GAP at lock-wait boundary: DATA-MODEL samples after locks; delay before that sample can change classification |
| AT-17 | API crashes before DB commit | No receipt claimed; same-key retry is a new durable intake if nothing committed | DEFENSE SPECIFIED; no fabricated earlier timestamp |
| AT-18 | GitHub responds after deadline or is unavailable for hours | Original receipt preserved; insufficient temporal proof needs_review, not late by timeout | DEFENSE SPECIFIED; preview TTL evaluation instant must not penalize worker delay |
| AT-19 | SHA nonexistent, wrong repo/branch or inaccessible | Bind observation to actor/acceptance/repo/SHA/policy; validate content; invalid rejects, uncertainty reviews | DEFENSE SPECIFIED; distinguish branch-policy eligibility from object existence |
| AT-20 | Valid preview, then force-push/branch deletion before receipt | Proposal defines eligibility as observed on branch within TTL, not continuous membership | CHALLENGE: R-01 deliberately weakens a possible receipt-time interpretation; requires explicit policy disposition |
| AT-21 | First observation or snapshot occurs after receipt | Later evidence alone cannot prove pre-receipt availability | DEFENSE SPECIFIED; no temporal inference from capture/commit timestamps |
| AT-22 | Repo deleted or App loses access between confirmation and capture | Confirmation survives; source_unavailable is visible | ACCEPTED EXPOSURE under AD-6/7; a confirmed receipt is not a backup guarantee |
| AT-23 | Archive bomb, false sizes, traversal, absolute paths, symlink/hardlink/device entries | Bounded streaming inspection, actual compressed/expanded counters, reject unsafe structures, no extraction/exec | DEFENSE SPECIFIED; parser fixtures and resource-isolation proof RR-06 |
| AT-24 | Nested archives, encrypted files, unusual Unicode names | Outer archive scope is captured; dependencies/external content not implicitly expanded | EXPERIMENT: declare nested opaque content, canonical names and collision rules; never call uninspected nested content safe |
| AT-25 | LFS/submodules/external dependencies absent | Explicit scope/completeness manifest, no implicit fetching | DEFENSE SPECIFIED; test actual provider archive settings |
| AT-26 | Truncated transfer, digest mismatch, correct metadata pointing to wrong object | Size/digest/provenance verification before available, opaque generation keys | DEFENSE SPECIFIED; object identity must include exact generation/version and be checked on recovery |
| AT-27 | Stale capture worker survives lease expiry or writes after purge | Local generation check prevents metadata commit, but cannot revoke an already in-flight object write | VERIFICATION OBLIGATION: no admissible capture-against-purge path established; S-03 not promoted. Test external bytes/inventory and retry eligibility |
| AT-28 | Fifty captures with 2 GiB free, 100 MiB reservations | Fixed institution→course lock order; reserve maximum before transfer | DEFENSE SPECIFIED for logical admission; wake-up, lease expiry, refund and physical orphan budgets remain material |
| AT-29 | Reservation released twice; worker dies after upload; actual archive smaller than reservation | Transactional charge/release plus reconciliation claimed | EXPERIMENT/GAP: ledger state transitions and re-admission after freed reservation must be concrete |
| AT-30 | Student alters visible tests/workflow or submits a forged report | Formative-only trust; integration principal cannot publish; run/SHA/schema binding | DEFENSE SPECIFIED against automatic official grading; honest-looking formative success remains untrusted |
| AT-31 | Wrong workflow/SHA, duplicate workflow_run, rerun/out-of-order completion | Expected workflow/config; repository/run/attempt keys; preserve attempts | DEFENSE SPECIFIED; incomplete/missing/expired reports must not be zero |
| AT-32 | Actions disabled, workflow deleted or artifact expired | Explicit unavailable/invalid state; confirmation independent | DEFENSE SPECIFIED; test latest-attempt display ordering |
| AT-33 | Concurrent publication, withdrawal of A after B, retry | Current publication/generation CAS, draft version, immutable events, key replay | DEFENSE SPECIFIED; initialize empty current-grade row atomically and serialize draft/auth changes |
| AT-34 | Resubmission while evaluating/publishing; scale changes | Fixed evaluation/submission/scale; no automatic transfer or recalculation | DEFENSE SPECIFIED; request order problem AT-15 still affects 'newer' indicator |
| AT-35 | TA publishes, student reads notes, teacher loses role during command | Teacher-only publication, separate student projections, transactional effective authorization | DEFENSE SPECIFIED; authorization read alone is not a concurrency lock protocol |
| AT-36 | Snapshot expires; hold/publication arrives during purge | Shared snapshot lock and committed destructive fence; loser gets conflict | DEFENSE SPECIFIED for stated race; policy challenge: pending-delete hold cannot always stop a claimed purge |
| AT-37 | Course reopens or policy changes while purge is eligible | Reopen must suspend eligibility; bulk recalculation is asynchronous | GAP: course/policy generation must participate in purge claim, not only per-snapshot cached retain_until |
| AT-38 | Primary delete succeeds but versions/backups remain | Verified only after recoverable inventory evidence; tombstone exported first | DEFENSE SPECIFIED; RR-05 provider proof remains mandatory |
| AT-39 | Old backup restored after recorded deletion or canceled purge | Independent tombstone journal replay before reads | GAP: intent, cancellation and verified deletion must remain distinguishable during replay |
| AT-40 | Publish after verified deletion | Explicit unavailable-evidence acknowledgement, no pretend byte restoration | CHALLENGE TO ADOPTED DECISION: clarify AD-7's new retention obligation when content no longer exists |
| AT-41 | GitHub creates repo, response lost, retry/collision | Deterministic name, provenance verification, needs_operator if ambiguous; no random-suffix retry | DEFENSE SPECIFIED; fail-closed can sacrifice automatic recovery, not justify blind adoption |
| AT-42 | Repo created but collaborator invite fails/pending | Provisioning/access/sync are separate axes | DEFENSE SPECIFIED; remote stale-grant ordering remains AT-09 |
| AT-43 | Template changes during generation | Frozen version plus before/after content comparison; mismatch quarantines before access | DEFENSE SPECIFIED; same-org source and generated-tree equivalence RR-03 |
| AT-44 | Uninstall/suspend/reduced scope/public repository drift | Stable IDs, inaccessible state, capability revalidation, alert/onboarding block | DEFENSE SPECIFIED; cannot retract already exposed code |
| AT-45 | Forged/duplicate/replayed/unknown webhook or delivery outage | Raw HMAC, inbox uniqueness, allowlist, trusted installation routing, delivery reconciliation | DEFENSE SPECIFIED; signature does not make academic result trustworthy |
| AT-46 | Crash before/after outbox enqueue or after external effect | Atomic intent, duplicate delivery allowed, domain uniqueness, reconciliation | DEFENSE SPECIFIED conceptually; durable ownership/reclaim fields and nontransactional fences need explicit contracts |
| AT-47 | pg-boss runtime needs DDL despite migrate:false | Precreated queues, separate release principal, explicit RR-02 | RESEARCH ALREADY ACKNOWLEDGED; not automatically a reason to add Redis |
| AT-48 | Valid OpenAPI schema but impossible UI command | Follow output identifiers/versions into subsequent required input | GAP: syntax validation does not prove usable identity/resolution/recovery flows |
| AT-49 | Arbitrary capability string, empty reason, wrong role scope or nullable state combination | Application allowlists/domain checks promised; schema often wider | VERIFICATION OBLIGATION: check mandatory semantics and allowlists; no claim schema acceptance alone executes privilege escalation, no separately substantiated finding |
| AT-50 | Student reads 'on time', 'complete', or 'ungraded' incorrectly | Separate receipt/classification/capture/current-grade fields and safe history | DEFENSE SPECIFIED; E2E must assert actual wording including R2 grade with R3 delivery |
| AT-51 | Audit lacks authority/request/generation link; administrator erases history | Append-only academic history specified; generic safe_metadata leaves details to implementation | VERIFICATION OBLIGATION: reconstruct an operation and deny history deletion; no separately established bypass. Privacy policy does not replace provenance fields |
| AT-52 | New framework/microservice proposed to solve an unmeasured risk | AD-11 modular monolith, shared PostgreSQL queue, separate API/worker | No justified need for Redis/microservices found from the review alone |

## Failure matrix

These are required recovery behaviors, not observed executions. Durable state is authoritative only if its transaction committed.

| Failure | Continues | Blocks | Durable state / user view | Recovery | Human intervention |
| --- | --- | --- | --- | --- | --- |
| PostgreSQL down | Static UI and GitHub independent work | Receipts, authoritative reads/writes, outbox/queue | No new acknowledged receipt; unavailable rather than success | Restore DB; same-key retry; reconcile committed outcomes | Operator; teacher for genuine outage exceptions |
| Object storage down | Receipts, grading on existing evidence, GitHub work | Capture/download/purge verification | Confirmed submission + separate pending/failed capture; no invented availability | Backoff; retain operation; reconcile partial uploads | Operator if persistent; no early deletion to free space |
| GitHub API down | Persisted academic views, publication, receipt intake if API contract permits | Fresh preview, provisioning, validation/capture dependent on GitHub | Pending or needs_review; no timeout-as-lateness | Per-installation backoff/circuit recovery and reconciliation | Institution/operator; teacher for evidence uncertainty |
| GitHub Actions down | Explicit submission and manual academic evaluation | New automatic results | Formative unavailable, never zero official grade | Reconcile runs after recovery | Teacher/provider owner |
| Worker down | HTTP durable intake and DB reads/commands | Async validation, capture, provisioning, reconciliation | Pending states and backlog age | Restart worker; recover leases/outbox | Operator if alarms persist |
| API restart | Existing worker jobs and GitHub activity | Requests during restart | Committed receipt recoverable; uncommitted request not acknowledged | Same-key retry with current authorization | Normally none |
| Worker restart | API and other workers | Claimed work until lease recovery | Uncertain external effect remains uncertain | Read operation checkpoints; verify external effect before repeating | Required for ambiguous repo ownership |
| Deployment during jobs | Compatible old/new processes | Incompatible schema/message versions | No job marked complete merely on enqueue | Expand/contract; drain or support previous DTOs | Release operator on incompatibility |
| Network partition | Each service's local committed state | Cross-service effects and timely reconciliation | Outcome unknown rather than false failure/success | Reconcile external identities; stale workers cannot finalize newer state | Operator if partition or ambiguity persists |
| GitHub rate limit | Academic DB intake and persisted reads | Provider-dependent work | Pending/backoff with visible freshness | Honor Retry-After/reset, fairness/jitter, bounded concurrency | Capacity/policy owner for sustained limits |
| Corrupted snapshot | Receipt, grade history and metadata | Trusted content download/evaluation from damaged bytes | Must show unavailable/corrupt, not silently available | Verify exact object; preserve incident evidence; recapture only under explicit provenance policy | Operator and teacher; recovery contract requires closure |
| Full logical/physical storage | Receipt if DB itself healthy | New preservation or uploads | blocked_by_quota/size; physical pressure separately visible | Authorized capacity change, safe cleanup, resumable captures | Storage owner; never truncate existing evidence |
| App uninstall | Persisted authorized academic records | GitHub commands and effective access repair | Integration revoked/inaccessible; external revocation may remain unresolved | Reinstall verified association, inventory/reconcile stable repo IDs | Institutional App owner |
| Webhook outage | GitHub pushes/runs; platform persisted records | Timely projections | Stale state, backlog/failure visibility | App-delivery reconciliation/redelivery and provider polling | Operator if delivery window exceeded |

Operational warning: in-app-only alerts cannot reliably summon an operator when PostgreSQL/API is down. An independent health/alert route is an operational requirement to settle before the pilot, not evidence that academic commands should depend on another broker.

## Load reasoning (not benchmark)

1. **50 concurrent accepts:** one academic acceptance/repository intent per student, short DB transactions, bounded provider concurrency per installation. Unknown create outcome must not spawn a second randomly named repo. Private repo/template checks precede access. The provider budget determines completion latency, not correctness of acceptance.
2. **50 submits in the last 10 seconds:** intake must be insulated from GitHub calls, archive parsing and shared-worker pool exhaustion. Per-acceptance lock avoids a single classroom counter, but policy and DB connection contention still matter. Sampling receipt after a contended lock can cross the deadline. Load tests must capture ingress, lock-acquired, persisted and ACK times separately.
3. **50 completed workflows:** webhook handler persists bounded inbox only; report parsing is asynchronous and cannot touch official grading. Fairness must keep report bursts from starving validation/preservation. Count separate run attempts and do not overwrite historical completion with late earlier events.
4. **50 captures with 2 GiB free:** 2 GiB = 2,048 MiB; at most 20 simultaneous 100 MiB reservations fit, leaving 48 MiB. If those captures use 10 MiB each, 200 MiB becomes used and 1,800 MiB is released. The 30 blocked operations must be awakened by reservation release/completion, not only quota increase or deletion. Repeated expired workers can produce physical staging/orphan bytes even while logical used+reserved stays under quota. Refund/charge/release must be conditional once-only transitions tied to generation; provider transfer lifetime must be bounded too.

## Independently reconstructed GitHub permission matrix

Permissions below describe proposed endpoint needs, not an installed App. All-repository installation scope broadens exposure even when each permission is justified. Existing-repo installation tokens should be restricted in both permissions and repository scope where supported.

| Permission / credential | Resource and required operation | If missing | Risk if excessive |
| --- | --- | --- | --- |
| Metadata read | Repository identity/settings lookup; access observations | Cannot reliably map repo or inspect health | Repo metadata exposure; not source/grade authority |
| Contents read | Private commit/tree/archive; template source for generate | Cannot validate/capture source or generate from source | Read all accessible private code; restrict capture token repo scope |
| Administration write | Generate repository, add/remove collaborator | Provisioning/access reconciliation fails | Can change sensitive repository settings; do not give this token to archive parser |
| Actions read | Workflow runs/attempts and artifacts | Formative results unavailable | Private artifact/log disclosure; never grants academic publication |
| Organization Members read | Verify membership/admin status for installation connection | Cannot establish the required org role through that endpoint | Organization roster disclosure; do not expose it as academic roster |
| App JWT | Inspect installations and delivery administration; mint installation tokens | Cannot establish/recover installation routing | App-wide credential authority; keep signing key out of untrusted parser contexts |
| User token | OAuth identity and caller-access verification | Cannot authenticate the GitHub person | Person/App permission intersection; never send token to frontend |
| None added: Contents write, Workflows write, Checks write, Actions write, Members write | No approved MVP operation demonstrated to need them | Optional future editors/reruns/org membership management unavailable | Unnecessary source/workflow/member modification surface |

Primary documentation independently consulted in the interrupted run: [template generation](https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template), [collaborator operations](https://docs.github.com/en/rest/collaborators/collaborators), [organization membership](https://docs.github.com/en/rest/orgs/members#get-organization-membership-for-a-user). Template generation documents Administration write + Contents read, not Contents write. Collaborator creation may create an invitation rather than effective access. Exact permissions for invitation deletion/listing and report download still require the RR-03 sandbox and endpoint checks.

## Side-effect classification

| Effect | Classification | Crash recovery obligation |
| --- | --- | --- |
| Receipt, evaluation, publication, withdrawal | Transactional domain effect with idempotency key/CAS | Return same committed outcome; no duplicate history |
| Inbox/outbox enqueue | At-least-once transport | Duplicate dispatch harmless only when consumer effect is guarded |
| GitHub repository create | Nontransactional, reconciliable; no guaranteed provider idempotency key claimed | Deterministic identity/provenance or operator ambiguity; no blind replacement |
| GitHub collaborator grant/revoke | Reconciliable desired state, remote ordering matters | Re-read after uncertain calls; old in-flight grant may need corrective revoke |
| Snapshot staging/upload | Reconciliable generation-specific bytes | Validate identity/digest/lease before metadata commit; remove or quarantine orphan bytes safely |
| Physical deletion | Irreversible once completed | Durable intent/journal first; exact-version inventory and retry; distinguish cancellation before effect |
| Notices/export generation | Idempotent derived side effect | Deduplication and current download authorization; no changes to academic truth |

## Coverage boundary

Final promoted findings: AT-08/09 reapproval scope → ACR-001; AT-09/42 external late grant → ACR-002; AT-39 canceled intent replay → ACR-003; AT-37 reopen/purge → ACR-004; AT-15/34 revision order → ACR-005; AT-48 fresh-session request discovery → ACR-006; AT-28/29 capacity wake → ACR-007; AT-48 account bootstrap/CAS/rejection → ACR-008/009/010; failure-matrix alert dependency → ACR-011. AT-16/20/40 remain policy clarifications/challenges, not additional counted defects. Other GAP wording identifies review obligations; only FINDINGS.md defines the counted registry.

All user-requested attack families are represented above: tenancy, identity, submissions and temporal evidence, archives/quotas, formative grading, publication, retention, GitHub permissions/provisioning/webhooks, API/state/data consistency, jobs/queue, stack evidence, RBAC/audit/privacy/UX, failure recovery, load, open research and complexity. Individual persona notes retain additional counterexamples and rejected leads. No simulated schedule here should be described as a passed executable test.
