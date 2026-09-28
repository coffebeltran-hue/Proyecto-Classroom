// Bounded provider experiment: revokes only the token minted by this process.
import { App, Octokit } from 'octokit';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = `.local/rr03/token-revocation_${Date.now()}`;
await mkdir(directory, { recursive: true });
const evidence = { source: 'real GitHub API', status: 'incomplete', checks: [] };
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const Client = Octokit.defaults({ log: quiet, retry: { enabled: false }, throttle: { enabled: false }, request: { fetch: async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== 'https://api.github.com') throw new Error('ORIGIN');
  return fetch(input, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
} } });
let tokenClient, revoked = false;
const record = (step, status) => evidence.checks.push({ step, status, observedAt: new Date().toISOString() });
try {
  evidence.scriptSha256 = createHash('sha256').update(await readFile('scripts/rr03-token-revocation.mjs')).digest('hex');
  evidence.octokitVersion = JSON.parse(await readFile('node_modules/octokit/package.json', 'utf8')).version;
  const app = new App({ appId: 4990040, privateKey: await readFile('.local/rr03/app.private-key.pem', 'utf8'), Octokit: Client, log: quiet });
  const { data: installation } = await app.octokit.request('GET /app/installations/{installation_id}', { installation_id: 162753561 });
  if (installation.app_id !== 4990040 || installation.account?.id !== 330894124 || installation.suspended_at) throw new Error('STATE');
  const { data: grant } = await app.octokit.request('POST /app/installations/{installation_id}/access_tokens', { installation_id: 162753561, repositories: ['rr03-allowed'], permissions: { contents: 'read', metadata: 'read' } });
  tokenClient = new Client({ auth: grant.token });
  evidence.expiresAt = grant.expires_at;
  const before = await tokenClient.request('GET /installation/repositories', { per_page: 1 });
  record('same-token-before-revocation', before.status);
  const removal = await tokenClient.request('DELETE /installation/token');
  revoked = removal.status === 204;
  record('revoke-own-token', removal.status);
  let afterStatus;
  for (const delayMs of [0, 1000, 3000, 10000]) {
    if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
    try { afterStatus = (await tokenClient.request('GET /installation/repositories', { per_page: 1, headers: { 'cache-control': 'no-cache' } })).status; }
    catch (error) { afterStatus = Number.isInteger(error.status) ? error.status : null; }
    record('same-token-after-revocation', afterStatus);
    if (afterStatus === 401) break;
  }
  evidence.status = before.status === 200 && revoked && afterStatus === 401 ? 'pass' : 'fail';
} catch (error) {
  evidence.status = 'fail';
  evidence.error = { code: 'PROOF_FAILED', httpStatus: Number.isInteger(error.status) ? error.status : null };
} finally {
  if (tokenClient && !revoked) {
    try { record('cleanup-own-token', (await tokenClient.request('DELETE /installation/token')).status); }
    catch { record('cleanup-own-token', 'unconfirmed'); }
  }
  await writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ directory, ...evidence }));
  if (evidence.status !== 'pass') process.exitCode = 1;
}
