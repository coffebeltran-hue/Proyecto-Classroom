# Security, RBAC and trust model

Approved semantics are AD-1–AD-11. Controls and exact permission names below are RECOMMENDATION to implement and test. A secure design review is not evidence of secure implementation.

## RBAC matrix

Legend: Y scoped permission; C explicit course capability; O own verified identity/acceptance only; BG time-limited audited break-glass; dash deny. Institution admin is not implicitly a course teacher.

| Operation | Super Admin | Institution Admin | Teacher | TA | Student |
| --- | --- | --- | --- | --- | --- |
| Create institution / assign institution admin | Y | — | — | — | — |
| Connect org / inspect installation health | BG | Y | C connect_org | — | — |
| Create course / assign course teachers | BG | Y | C create_course | — | — |
| Edit course / roster / publish assignment | — | — | Y own course | C roster_read only | — |
| Read roster | BG | C support grant | Y | C roster_read | O own profile only |
| Request identity link | — | — | — | — | O authenticated request |
| Approve/reject identity | — | — | Y scoped roster | — | — |
| Correct institution-wide binding | BG authorizes grant | Authorize scoped teacher grant | Y all affected courses or explicit grant | — | Request only |
| Accept assignment / submit | — | — | — | — | O active verified enrollment |
| Read submission/test results | BG | C support grant | Y | C submissions_read | O |
| Create evaluation / draft | — | — | Y | C grade_draft | — |
| Publish / withdraw official grade | — | — | Y | — | — |
| Grant extension / academic exception | — | — | Y | — | — |
| Read published grade / student-safe history | BG | C support grant | Y | C grades_read | O |
| Read internal notes | BG | C support grant | Y | C grade_draft | — |
| Download snapshot | BG | C evidence grant | Y | C evidence_read | O |
| Place/release retention hold | BG | Y scoped | Y own-course evidence | — | Request only |
| Change quotas / retention policy | BG | Y | Request only | — | — |
| Academic close | — | Y | Y own course | — | — |
| Run automatic purge | — | — | — | — | — |

Automatic purge is retention worker authority under policy/fence, not an interactive role. Global super admin does not see all grades by default. Support grants specify tenant, resources, purpose and expiry. Last active teacher cannot remove themselves until replacement is assigned. Membership changes invalidate authorization caches; every sensitive command rereads effective authorization transactionally.

## Authentication and tenant boundary

Opaque server session in Secure/HttpOnly/SameSite=Lax cookie; rotate after OAuth login and privilege change. CSRF token and Origin validation on unsafe methods; GET never changes academic business state; access audit and provider-observation capture may persist read-side evidence. OAuth state and PKCE are single-use browser-bound, short-lived; return path allowlist prevents open redirect. Account identity is re-read from GitHub after token exchange. Never accept user ID or installation binding from callback query alone. Tokens encrypted with external key management, refresh serialized per credential generation, tokens revoked/deleted on disconnect, logs redacted. Session lifetime proposed 12 hours absolute / 1 hour idle, configurable and not an approved academic rule.

Tenant is explicit in routes and checked against authenticated membership/binding; an `X-Tenant-ID` header is not authority. RLS uses transaction-local tenant context and app actor context, initialized before any query and reset by transaction completion. Connection pools must never use session-level SET for tenant context. Workers resolve tenant from validated operation record, not event-body user input. Forced RLS and composite FKs apply to tenant data; queue/global inbound routing uses restricted schema role. Test missing context, reused pool connections, multi-course same-tenant access and cross-tenant forged FK inserts.

Pre-binding identity intake is a narrow exception to membership-gated reads: a logged-in GitHub user may submit their own identifier for a course discovered through an invitation. A restricted command resolves its tenant server-side and persists a safe request even when unmatched. It never reveals roster matches or authorizes other tenant reads. Normal academic access requires approved binding/membership. Scoped grants cannot promote a nonteacher into a publisher.

## Threat model

| Threat / entry | Impact | Mitigation and verification |
| --- | --- | --- |
| Known student code/name/invite | Claim someone else's identity | Teacher approval; non-enumerating request; rate limit; two-approval race test |
| Teacher limited to one course corrects shared identity | Cross-course takeover | All-affected-course scope or explicit institutional correction grant; immutable lineage |
| IDOR through API/export/download | Cross-tenant grade/source disclosure | Resource-scoped authorization, composite FK/RLS, opaque object identity, negative E2E |
| OAuth login CSRF/account mixup | Wrong user session or org binding | PKCE/state/browser binding; re-read user; explicit install-owner verification |
| Forged/replayed webhook | State corruption/jobs exhaustion | HMAC raw-body verification; bounded inbox; delivery uniqueness plus domain idempotency |
| Student modifies workflow/report | Fraudulent score | Formative trust only; integration role cannot publish; strict report size/schema/SHA binding |
| Untrusted archive | Traversal, decompression bomb, code execution | Streaming limits, reject unsafe entries, no exec/build/install, no symlink following |
| Malicious URL/template/redirect | SSRF or credential leak | GitHub owner/repo IDs and fixed API host; validate redirects; never forward Authorization to unapproved hosts |
| Token or private key leak | Repository compromise | Secret manager, minimal scoped tokens, credential rotation; audited incident revocation |
| Broad org base/owner access | Peer repository disclosure | Dedicated org preflight, no student owner/admin/base read, effective access audit; prevent incompatible onboarding |
| Deleted repo or revoked App | Lost academic evidence | Snapshot preservation; sync inaccessible state; no destructive compensation |
| Publication/purge race | Evidence deleted despite extension | Shared row lock/fence; reject conflicting publication/hold after destructive claim; audit outcome |
| Restore older DB/object backup | Revived deleted source | Independent tombstone journal replay before access/readiness |
| Grade precision coercion | Incorrect official score | Decimal strings, exact arithmetic, backend lexical validation, SQL checks and precision tests |
| CSV formula injection / stored HTML | Spreadsheet execution or XSS | Formula-safe export, bounded parser, plain/sanitized text render, CSP |
| High-volume accept/submit/archive | Resource and quota exhaustion | Per-actor/tenant throttles, reservations, queue fairness and configured size limits |

Academic approval cannot remove access independently granted by GitHub organization owners. Preflight must document that institutional owners can inspect organization repos; students must not be those owners. Platform isolation guarantees cover its own authorization, with external effective access continuously checked and surfaced.

## Containers and secrets

Run non-root, read-only root filesystem, bounded scratch tmpfs, dropped capabilities, no Docker socket, no host networking, seccomp default, explicit CPU/memory/PID limits. Pin image and browser-test image digests during build; scan image/dependencies and produce SBOM. No production secrets in image layers, build args, fixtures or frontend bundles. Preservation worker receives read-GitHub and write-object authority; retention profile alone can delete evidence versions; integration profile cannot grade. API download streaming receives object-read but no delete authority.

## Object provider proposal

AWS S3 private bucket per environment, tenant prefixes, Block Public Access, TLS, encryption under managed key, immutable generated object keys. Use versioning only with explicit inventory/deletion of all versions. Lifecycle expiration is not a substitute for academic hold enforcement; application purge owns eligibility. Lifecycle may abort abandoned multipart uploads, not erase protected snapshots. No public bucket or browser-supplied keys.

Default download is authenticated API streaming after permission check with attachment content-disposition and byte limits; no inline execution/rendering of archived HTML. Audits record authorization and outcome, not code contents. A future signed URL path requires bounded TTL and revocation semantics; not assumed instantly revocable.

Provider comparison: S3 offers a documented version/deletion model; R2 may be cost-attractive but pricing is not researched here and deletion/backup guarantees need separate validation; self-managed object storage increases operational burden. S3 is RECOMMENDATION, not a user-approved supplier or residency decision. Current docs confirm a delete marker is not permanent version deletion. [S3 DeleteObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html). Region, account owner, billing and recovery-copy guarantees are pre-pilot gates.

## Future authoritative grading

An evaluator independent from the student's repository must bind request, exact source digest/SHA, test-package version, evaluator version and policy version to authenticated results. Orchestrator credentials cannot enter student execution. Protect test/scoring controller from source tampering and output/network exfiltration; a private repo or signature on a student-generated report is insufficient. Policy authority validates evidence before publication. Do not add a boolean trust bypass to the formative pipeline. [GitHub secure workflow use](https://docs.github.com/en/actions/reference/security/secure-use).
