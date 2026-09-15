# GitHub integration contract

## App, identity and installations

RECOMMENDATION: one GitHub App per environment; production App owned by the institution/platform operator, not a personal developer account. User authorization identifies a person; installation authorization identifies the App's granted repository scope. Teacher academic authority is always separate.

OAuth: backend creates state+PKCE verifier transaction, redirects to GitHub, validates state/browser binding once, exchanges code server-side, fetches authenticated user ID, creates/updates local account, rotates local session. Retain refresh credential only when needed, encrypted; serialize refresh and store token generation to prevent concurrent rotation loss. Use provider-reported expiration, not hardcoded duration. Uninstall/revocation events invalidate local integration capabilities; an existing platform session can still read permitted persisted academic records, but cannot perform GitHub-dependent commands until reauthorization.

The installation callback is a hint. Backend fetches installation using App authentication, confirms organization target and caller authorization, then atomically associates organization/install to the tenant. Callback-supplied installation IDs never create an association without verification. One active org-to-tenant association. Reinstallation may produce a new installation ID; repo associations remain by stable repository ID and must be revalidated. Never silently attach a reinstalled organization to another tenant.

Proposed pilot installation scope: all repositories in the dedicated academic organization, because per-repository selection complicates new-repo provisioning. This is explicitly broader than single-repo grants; mint restricted installation tokens for operations on existing repos where supported. No installation on unrelated organizations. A selected-repository alternative requires a successful new-repo scope experiment before adoption.

Documentary basis: GitHub App user-token permissions are constrained by App and user access; user authorization supports PKCE and expiring credentials. [User authorization](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app), [App/installations API](https://docs.github.com/en/rest/apps/apps). No live App has been installed or tested.

## Permission matrix and operations

Permission names are GitHub App permissions, not OAuth classic scopes. Metadata read is inherent. All listed write permissions require justification in the manifest review.

| Feature | API/mechanism | Credential/actor | Proposed minimum permission |
| --- | --- | --- | --- |
| Login | OAuth code exchange, GET /user | User token; logged-in person | User identity; Email addresses read only if explicitly needed (not MVP identity proof) |
| List accessible installations | GET /user/installations; GET /app/installations/{id} | User token / App JWT respectively | Endpoint-specific App identity; validate caller org administration |
| Check org membership | GET /orgs/{org}/memberships/{username} | User or installation token | Organization Members read; live test of admin verification mandatory |
| Inspect template/repo and commit | GET /repos/{owner}/{repo}; git commit/tree/ref endpoints | Installation token | Metadata read; Contents read for private content |
| Generate repo | POST /repos/{template_owner}/{template_repo}/generate | Installation token | Administration write + Contents read |
| Empty repo (later optional) | POST /orgs/{org}/repos | Installation token | Administration write; outside proposed template-only MVP |
| Grant/revoke repository collaborator | PUT/DELETE /repos/{owner}/{repo}/collaborators/{username} | Installation token | Administration write |
| Verify collaborator access | Collaborator permission/invitation endpoints | Installation token | Endpoint-dependent Metadata/Administration read; validate in sandbox |
| Read Actions runs/attempts/artifacts | GET /repos/{owner}/{repo}/actions/runs and artifact endpoints | Installation token | Actions read |
| Download snapshot | GET /repos/{owner}/{repo}/tarball/{sha} | Installation token, fixed repo/SHA | Contents read |
| Receive App webhooks | App webhook subscription | GitHub signed sender | Event prerequisites: Contents read for push, Actions read for workflow_run; installation events supported by App |
| Reconcile installation deliveries | App webhook delivery endpoints | App JWT | App-level administrative operation, not arbitrary repo hook write |

Initial manifest: repository Metadata read, Contents read, Administration write, Actions read; organization Members read. No Members write, Workflows write, Checks write, Actions write or personal access tokens in MVP. No per-repo hook creation: use App webhook. Reruns happen in GitHub UI; creating/modifying student workflow YAML through API is outside this manifest. Teacher configures reviewed formative workflow in published template; platform config chooses expected workflow/report contract rather than promising an arbitrary workflow editor.

Template generation permission and collaborator invitation behavior are documented, but organization policies may still block an operation. [Repository API](https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template), [Collaborators](https://docs.github.com/en/rest/collaborators/collaborators), [Actions runs](https://docs.github.com/en/rest/actions/workflow-runs), [Archive download](https://docs.github.com/en/rest/repos/contents).

## Data ownership, failures, synchronization and tests

This table plus the permission matrix answers the ten required external-feature questions: mechanism, permissions, actor, failure, idempotency, local data, provider-only data, synchronization, outside changes and testing.

| Operation | DB vs GitHub source | Failure/idempotency and outside changes | Verification |
| --- | --- | --- | --- |
| OAuth | DB session/binding/credential ciphertext; GitHub account identity | State single-use; account ID unique; serialized refresh; renamed username updates snapshot | Missing email, wrong browser state, replay, refresh race, revoked auth |
| Org connection | DB tenant-org-install relation; GitHub installation/scope/policies | Unique org association; suspended/uninstalled pauses operations; revalidate callbacks | Unauthorized installer, altered ID, selected scope, reinstall |
| Provisioning | DB operation/steps/reserved name/provider ID; GitHub code/settings | Deterministic name includes opaque acceptance suffix; create timeout reconciles provenance, not name alone | Double-click, 50 parallel acceptances, crash after 201, unrelated preexisting repo |
| Collaborators | DB desired access/invitation state; GitHub effective access | Read-before-repeat; creation may invite rather than grant; outside revocation produces drift | Outside collaborator policies, pending invite, wrong account replacement |
| Tracking | DB minimal observations/freshness; GitHub complete Git history | Push delivery is an observation; serialize per repo and refetch current when needed | Duplicate/out-of-order event, rename, transfer, 404, force-push |
| Submit validation | DB durable receipt/evidence/resolution; GitHub object/ref existence | Same command receipt; evidence after receipt alone needs review; no auto backdating | Unseen SHA, stale preview, authorization loss, API outage |
| Actions ingestion | DB normalized report/run/attempt/SHA; GitHub runs/logs/artifacts | Idempotent repo/run/attempt/test; strict expected workflow and schema; invalid/expired report explicit | Student-edited workflow, wrong SHA/run, malformed archive, rerun |
| Preservation | DB metadata/manifest/state; private object store captured bytes; GitHub original source | Exact SHA only; reserved quota; complete download verified before available | Repo disappears, unsafe entries, limit reached, retry after object upload before DB commit |
| Reconciliation | DB health/last-check/checkpoints; GitHub actual state | Bounded cursor-based work; backoff on rate limits; no deletion from 404 | Uninstall, external public visibility, permissions drift, missing events |

A 404 can mean inaccessible private resource, not absence. Mark `inaccessible` and investigate identity/scope. A public visibility change is a privacy incident: alert/block further student onboarding to affected config, and never claim the platform can retract already exposed code. [REST troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api).

## Template reproducibility and provisioning

The generate API does not document arbitrary commit-SHA selection. Proposed workflow: teacher publishes an immutable template version (dedicated versioned template repo or institution-enforced freeze), platform records repo ID, commit and tree; check source version immediately before generation, then verify generated content tree matches expected (account for generated commit identity; compare content, not generated commit SHA). Mismatch quarantines provisioning before granting student access. Do not silently update assignment version. Cross-org private templates and byte/tree equivalence require sandbox validation; until proven, support same-org versioned templates only. Automatic template copying/updating would require a separately reviewed permission change.

Create step runs once logically, at-least-once operationally. Persist deterministic name and command before external call; after timeout, retrieve and verify organization, creator/audit evidence where available, expected content and known operation metadata. Matching name alone is insufficient. If ownership provenance remains ambiguous, `needs_operator` blocks adoption; never create with random suffix on every retry. A partial repo is retained for safe recovery; no automatic DELETE compensator.

## Webhooks and limits

Subscribe initially to push, repository, workflow_run, installation, installation_repositories and relevant App authorization revocation event; confirm availability and permission prerequisites in manifest experiment. Avoid workflow_job/check_run/pull_request/team until a consuming feature exists. Verify HMAC SHA-256 over raw bytes using constant-time comparison; limit body (proposed 5 MiB), reject invalid signature, persist authenticated envelope before 2XX. No heavy processing in handler. Unknown delivery types are durably marked ignored, not executed. Inbox replay retains original delivery and processing history.

Deduplicate `(app_id,delivery_id)`; redelivery can reuse ID, so an earlier failed processing state must be resumable. Business effect keys separately protect duplicate semantic events with different IDs. Do not assume global chronological delivery or exactly-once dispatch. If DB unavailable return failure; GitHub does not automatically guarantee failed-delivery retry, so App delivery reconciliation and operator redelivery are required. [Webhook practice](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks), [Failed deliveries](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries).

Per-installation queues use bounded concurrency and fairness; observe Retry-After/rate reset and secondary limits, conditional GET where useful, pagination, jitter and circuit-breaker state. Never fan out one API request per dashboard row. [REST limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

## Pre-pilot organization checklist — release gate

Named institutional administrator and App owner; dedicated organization exists; verified install/manage authority; membership/outside-collaborator policy; base access none for students; private repo creation; Actions availability and third-party allowlist; usage/budget limits; relevant security controls; repo deletion/transfer rules; webhook URL/secret/subscriptions; App key rotation and incident owner. Exercise real teacher and student accounts with minimum permissions, including pending collaborator invitation and installation revocation. No production organization is used for destructive tests.
