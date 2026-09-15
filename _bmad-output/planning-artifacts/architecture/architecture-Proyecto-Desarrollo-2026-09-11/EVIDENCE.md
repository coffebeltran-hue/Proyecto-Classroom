# Evidence, recommendations and open items

Package resumed 2026-09-12 and consolidated 2026-09-13 without restarting the design. Research cutoff for candidate versions is 2026-09-11, with PostgreSQL/Node support, pg-boss release and OpenAPI specification rechecked on resume. Do not call these pins latest indefinitely. This file distinguishes documentary findings, design proposals and unexecuted experiments.

## Approved baseline

DECISION: AD-1–AD-11 in ARCHITECTURE-SPINE.md are approved. Retention/withdrawal/pilot/base-stack questions are closed. Vendor, exact patch versions and compatibility tests were not approved by choosing the stack. AD-12–AD-18 remain proposed engineering contracts. Individual extensions/CSV in proposed MVP are scope recommendations; groups/rubrics remain V1 and authoritative scoring Future.

## Candidate dependency evidence

The existing [stack research](reviews/STACK-RESEARCH.md) retains original sources and dates; it is documentary research, not a lockfile or runtime test. Prefer stable supported releases over prereleases. The following pins are RECOMMENDATION, not proof of combined compatibility.

| Component | Candidate | Evidence/remaining constraint |
| --- | --- | --- |
| Node | 24.21.0 LTS | [Node releases](https://nodejs.org/en/about/previous-releases); proposed common dev/CI/runtime baseline |
| TypeScript | 6.0.3 | Conservative tooling baseline; [TS releases](https://github.com/microsoft/TypeScript/releases), [TS7 transition](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); verify published artifacts before locking |
| React / React DOM | 19.3.0 both | [Releases](https://github.com/facebook/react/releases); typings/UI peers still need resolution |
| Vite / plugin-react | 8.3.0 / 6.1.1 | [Vite releases](https://github.com/vitejs/vite/releases), [plugin manifest](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/package.json); pin source tag when creating lockfile |
| Fastify | 5.12.4 | [Releases](https://github.com/fastify/fastify/releases), [support policy](https://fastify.dev/docs/latest/Reference/LTS/); plugins must explicitly support Fastify 5 |
| Drizzle ORM / Kit | 0.45.2 / 0.31.10 | [Releases](https://github.com/drizzle-team/drizzle-orm/releases); Kit tag metadata observed, registry artifact verification outstanding |
| Octokit | 5.0.5 aggregate package | [Release source](https://github.com/octokit/octokit.js/releases); auth-app/webhooks versions and peers frozen with lockfile |
| pg-boss | 12.31.0, schema 41 | [Versioned release](https://github.com/timgit/pg-boss/releases/tag/12.31.0); release migration separate; precreated queues/runtime DDL experiment required |
| PostgreSQL | 18.6; fallback 17.11 | [Supported versions](https://www.postgresql.org/support/versioning/); provider availability/queue integration not exercised |
| Vitest | 5.0.0 | [Versioned manifest](https://github.com/vitest-dev/vitest/blob/v5.0.0/packages/vitest/package.json); peer range includes proposed Vite/Node, actual tests unrun |
| Playwright | 1.63.0 | [Releases](https://github.com/microsoft/playwright/releases), [requirements](https://playwright.dev/docs/intro); exact browser/container image match required |
| Docker Engine | 29.8.0 observed | [Release notes](https://docs.docker.com/engine/release-notes/29/); not a Node image tag or selected hosting-runtime guarantee |
| Object storage | AWS S3 proposed, API service not package pin | Vendor/region not approved. Object SDK, workload identity and backup guarantees require vendor selection experiment |

FACT: PostgreSQL majors 18/17 are supported, whereas satisfying pg-boss's PostgreSQL >=13 minimum does not make PostgreSQL 13 supported. FACT: pg-boss 12.31.0 announces schema 41 migration. RECOMMENDATION: runtime `migrate:false` with a separate migration principal, queue creation/partition work preprovisioned only after privilege testing. This setting alone is not proof that the selected runtime configuration needs no DDL.

Maintenance evidence is release activity and published requirements, not a future SLA or a clean vulnerability audit. There is no application lockfile to audit yet. Dependency license inventory, direct/transitive advisory scan, image digests and SBOM are preimplementation/build gates. Vite react-ts is the official proposed frontend starter; exact create-vite version is frozen only when authorized to scaffold, never run `@latest` silently.

## External service evidence

| FACT | Primary source | Limit of evidence |
| --- | --- | --- |
| GitHub App user authorization supports PKCE and scoped token behavior | [User token flow](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app) | Not a completed login/install test |
| Template generation supports App tokens and defined permissions | [Repo generation](https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template) | No documented arbitrary commit-SHA selector; frozen-template strategy needs proof |
| Collaborator creation can produce an invitation | [Collaborators API](https://docs.github.com/en/rest/collaborators/collaborators) | 201 is not proof of effective student access |
| A private-resource 404 may conceal authorization failure | [REST troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api) | Do not infer deletion solely from status |
| Failed webhook delivery is not automatically guaranteed to retry | [Failed deliveries](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries) | Must operate recovery/reconciliation |
| Source archives may require explicit LFS treatment | [LFS archives](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository) | Not a complete runnable dependency backup |
| S3 delete marker does not delete all versions | [DeleteObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html) | Recoverable copies and backup bound not yet established |
| OpenAPI 3.1.1 defines schema/operation contracts | [Specification](https://spec.openapis.org/oas/v3.1.1.html) | Syntactic validation does not verify business semantics |

## Source-of-truth map

| Data | Authority | Local treatment |
| --- | --- | --- |
| User/org/repository external identity and permissions | GitHub | Stable IDs plus observed snapshots/freshness, never login/name as identity |
| Academic profile, membership, verified binding | PostgreSQL | Audited history and effective current authorization |
| Deadline/configuration and receipt | PostgreSQL | Immutable original inputs plus later resolution events |
| Git commit contents/history | GitHub | Exact-SHA source observation, no timestamp authority from commit date |
| Captured bytes | Private object storage | Metadata/digest/provenance/completeness and retention in PostgreSQL |
| Workflow execution | GitHub | Formative run/attempt/result interpretation in PostgreSQL |
| Evaluation/draft/publication/withdrawal | PostgreSQL | Revision-specific immutable official history; no automatic Actions publication |
| Delivery of jobs | pg-boss | Business effects and evidence tracked separately in outbox/domain |
| Deletion after restore | Current tombstone journal + DB operation history | Journal must be independently restorable before access reopens |

## Concrete recommendations not separately approved

| ID | RECOMMENDATION | Review concern |
| --- | --- | --- |
| R-01 | Server-bound preview, five-minute TTL, eligibility means observed on configured branch at preview | Does not prove continuous membership at receipt. Review temporal policy before implementing confirmation; uncertain cases remain needs_review |
| R-02 | Tenant composite FKs + forced RLS and separate worker profiles/DB roles | Same-tenant cross-course constraints and maintenance privileges need tests |
| R-03 | One active user/account to one academic identity per institution; cross-course correction grant | Stricter than approved per-profile uniqueness; requires package acceptance, not silently adopted |
| R-04 | AWS S3 private per-environment bucket; authenticated streaming; immutable object keys | Account/region/budget/deletion evidence unresolved |
| R-05 | Frozen same-org versioned templates plus generated-content verification | Additional permissions/mechanism may be needed if GitHub cannot reproduce expected tree |
| R-06 | Eight transient retries/max 24 hours; 5 MiB webhook/report bound; 5,000-row CSV | Configurable engineering defaults; observe data before widening |
| R-07 | numeric(12,2) cap; 12-hour absolute/1-hour idle session; npm workspaces | Added bounded mechanics, not approved permanent product limits |
| R-08 | Individual extension and CSV export in MVP; template-only private repos | Scope additions/restrictions for review; no claim user approved separately |
| R-09 | Calendar-month anniversary using course timezone; clamp month-end | Retention calculation timezone semantics need package review; receipt remains UTC |
| R-10 | Purge fence conflicts with publication/hold; explicit acknowledgement if publishing after verified deletion | Avoid pretend recovery; independent review must challenge user experience and evidence availability |
| R-11 | Minimal in-app notices and scoped grants; no external email integration | Operational alerts must have a responsible reader |

## Assumptions

A-01: GitHub.com, not GHES, for pilot. A-02: mostly small source-code projects; binaries/datasets may hit approved configurable limits. A-03: institutional owners accept dedicated private org policy and Actions usage cost. A-04: teacher can resolve identity and evidence exceptions operationally. A-05: continuously running containers and private managed PostgreSQL/object services are available. None replaces a verified external capability.

## Real remaining open questions

| ID | OPEN QUESTION | Owner | Closure gate |
| --- | --- | --- | --- |
| OQ-10 | Hosting/object provider account, region/residency, budget and operational owner | Juan/institution + Winston | Before provider provisioning; S3 is recommendation only |
| OQ-11 | Named institutional organization administrator/App owner and actual org policy configuration | Institution | Before pilot; organization name itself does not block document review |
| OQ-12 | Institution-specific handling of non-publication PII, appeals and access after withdrawal/identity correction | Mary + institution | Before real student data; approved permanent academic metadata remains binding |
| OQ-13 | Numeric service objectives, recovery-point/time objectives and support coverage | John + operator | Before pilot acceptance/load and restore signoff |

Previous OQ-1..OQ-7 policy questions were closed by approvals or converted into concrete R recommendations. OQ-8 is R-08 (scope recommendation); OQ-9 is RR-03 (template experiment). Do not reopen approved withdrawal, retention, institution shape or stack as unanswered questions.

## Research still required

| ID | RESEARCH REQUIRED | Proof needed / owner | Gate |
| --- | --- | --- | --- |
| RR-01 | Exact dependency artifact/engines/peers, driver/typings/Fastify plugins, maintenance and advisories | Frozen lockfile resolution, build/typecheck, licenses/SBOM; Amelia | Before implementation baseline accepted; requires separately authorized technical spike |
| RR-02 | PostgreSQL 18.6 + pg-boss 12.31.0/schema 41 under restricted roles | Empty/upgrade migration, queue lifecycle/partition maintenance, restart/concurrency/restore; Amelia/Winston | Before integrated implementation relies on queue |
| RR-03 | GitHub App authorization/install scope/templates/collaborators/webhooks/Actions | Dedicated sandbox accounts and least-privilege end-to-end evidence; Winston/Amelia | Before integration design marked proven |
| RR-04 | Temporal preview evidence and needs_review rules under force-push/delay/outage | Adversarial protocol assessment then sandbox tests; Mary/Winston | Before submission confirmation implementation |
| RR-05 | Snapshot provider versions/replicas/backups and deletion completeness | Account configuration, explicit provider guarantees and deletion/restore test; Winston | Before retention/purge production; extra 30-day backup bound remains unverified |
| RR-06 | Archive limits/completeness/parser safety and cost/capacity | LFS/submodule fixtures, bombs/traversal tests, quota concurrency/load; Amelia | Before capture production |
| RR-07 | Container/hosting controls, connection pools, health and SLO budgets | Digest/image scan, restricted runtime tests, load and fault rehearsal; Amelia/operator | Before pilot |
| RR-08 | Future protected/authoritative evaluation | Independent sandbox/provenance/test-secrecy threat model and experiments | Future; not an MVP blocker |

## Risks and dispositions

High-impact risks remain reviewable, not hidden by open-question labels: R-01 temporal evidence could be weaker than intended; same-org frozen template may drift; account correction can affect multiple courses and external permissions; queue least-privilege may conflict with internal DDL; quota blocks may allow source to disappear before capture; purge may race a new publication; provider backup guarantees may prevent verified deletion within desired time. Controls are in STATE-MACHINES/GITHUB/OPERATIONS/SECURITY, experiments in RR list. No risk has been declared eliminated by documentation alone.
