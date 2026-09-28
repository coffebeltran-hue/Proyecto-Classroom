# RR03 disposable local proof

Select the pinned Node runtime using the root README. Fill the `GITHUB_*` entries in ignored `.env`; the App key must be `.local/rr03/app.private-key.pem`. Both proof repositories must be private, with only `rr03-allowed` selected and Contents read. No secret/token is written to evidence. Tokens are used only in memory for bounded proofs; OAuth refresh tokens are discarded.

```powershell
npm run rr03:provider
pwsh scripts/local-postgres.ps1 Start
npm run rr03:proof
npm run rr03:serve -- .local/rr03/<successful-rr03-run>/runtime.json
```

Do not restart PostgreSQL if already running. The fixture creates unique `rr03_*` databases, a NOLOGIN owner, migration role and restricted API role. It never changes `classroom_dev`. Drizzle SQL was generated with `npm run rr03:generate` and inspected before execution. Only infrastructure installation IDs/capability status and receipt app/delivery/event/digest/status/timestamp persist. The API cannot change schema, create roles/databases, delete/edit receipts or edit installation identity. No automatic cleanup is performed.

`runtime.json` contains a local disposable database credential. It is ignored and must never be copied into reports. Windows protection currently relies on the local user profile/workspace ACL and ignored paths; Node mode bits do not establish a Windows ACL, and this is not a production KMS claim.

The provider proof records API identities, returned token expiry/read scope, private allowed README digest and unselected HTTP denial. A 404 alone does not prove that the unselected repository exists or is private: its setup is independently supplied by the operator. Earlier failure evidence is retained.

The local proof uses actual PostgreSQL transactions and simulated signed webhook HTTP requests. Twelve simultaneous duplicates create one receipt; changed bytes/event conflict, bad signatures/JSON create none, unavailable database returns 503. The official HMAC test vector and browser-bound, expiring, single-use PKCE state run in focused Vitest tests. Header event/delivery are transport hints, not HMAC-authenticated business idempotency. Both `invalidated` and `verification-required` capability markers deny cached authority; lifecycle hints never activate access. A future operation must freshly verify GitHub authority. Authenticated lifecycle/revocation hints also abort in-flight ephemeral OAuth proofs. No academic state is created or linked.

The server uses separate listeners: local OAuth on `127.0.0.1:3002`, webhook-only on `127.0.0.1:3003`. The latter has no OAuth/control routes even when Host is rewritten. Request logs are disabled to avoid recording OAuth callback codes. The registered callback is `http://127.0.0.1:3002/rr03/oauth/callback`; start with the same host to preserve browser cookie binding. On restart outstanding OAuth state fails closed.

## Manual boundary

After local checks pass, stop implementation and ask the operator to:

1. Run the server with the successful fixture's `runtime.json`, then open `http://127.0.0.1:3002/rr03/oauth/start` and finish GitHub authorization. Success writes sanitized `oauth-proof.json` beside server fingerprints. This proves user/install association, not organization-admin permission.
2. Provide an existing approved HTTPS tunnel forwarding only to `http://127.0.0.1:3003`; configure the App webhook URL as `<tunnel-origin>/rr03/webhooks/github`, JSON content type and the same locally configured webhook secret. Do not tunnel port 3002. Enable only the sandbox webhook needed for lifecycle proof, then deliver/redeliver a GitHub event. No tunnel tool is installed or selected by these scripts.

Do not expose either service to a public interface directly. Shutdown with Ctrl+C. Live OAuth and real provider-origin webhook delivery remain unproved until those manual actions occur. This experiment does not adopt AD13 or provide production hosting/recovery guarantees.
