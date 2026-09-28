// Final read-only permission verification; no repository mutations.
import { App, Octokit } from 'octokit';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const directory = `.local/rr03/permission-rollback-${Date.now()}`;
await mkdir(directory, { recursive: true });
const evidence = { status: 'incomplete', observations: [] };
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const Client = Octokit.defaults({ retry: { enabled: false }, throttle: { enabled: false }, log: quiet, request: { fetch: (url, init) => {
  if (new URL(String(url)).origin !== 'https://api.github.com') throw new Error();
  return fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
} } });
let client;
const minimal = permissions => permissions?.contents === 'read' && permissions?.metadata === 'read' && Object.keys(permissions).every(key => ['contents', 'metadata'].includes(key));
async function observe(path) {
  try {
    const response = await client.request(`GET ${path}`);
    evidence.observations.push({ path, status: response.status, at: new Date().toISOString() });
    return response;
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 0;
    evidence.observations.push({ path, status, at: new Date().toISOString() });
    return { status };
  }
}
try {
  const app = new App({ appId: 4990040, privateKey: await readFile('.local/rr03/app.private-key.pem', 'utf8'), Octokit: Client, log: quiet });
  const installation = (await app.octokit.request('GET /app/installations/162753561')).data;
  evidence.installation = { id: installation.id, appId: installation.app_id, accountId: installation.account?.id, selection: installation.repository_selection, permissions: installation.permissions };
  if (installation.app_id !== 4990040 || installation.account?.id !== 330894124 || installation.repository_selection !== 'selected' || !minimal(installation.permissions)) throw new Error();
  // No permissions override: verify the installation's full effective default grant.
  const grant = (await app.octokit.request('POST /app/installations/162753561/access_tokens')).data;
  client = new Client({ auth: grant.token }); grant.token = undefined;
  evidence.tokenPermissions = grant.permissions;
  const scope = await observe('/installation/repositories?per_page=100');
  evidence.repositoryIds = scope.data?.repositories?.map(repo => repo.id);
  const allowed = await observe('/repos/classroom-rr03-juan/rr03-allowed');
  const denied = await observe('/repos/classroom-rr03-juan/rr03-denied');
  const administrative = await observe('/repos/classroom-rr03-juan/rr03-allowed/invitations?per_page=1');
  evidence.status = minimal(grant.permissions) && scope.data?.total_count === 1 && evidence.repositoryIds?.[0] === 1375855376 && allowed.status === 200 && denied.status === 404 && administrative.status === 403 ? 'pass' : 'unexpected-result';
} catch { evidence.status = 'incomplete-or-permission-mismatch'; }
finally {
  if (client) { try { evidence.tokenRevocationStatus = (await client.request('DELETE /installation/token')).status; } catch { evidence.tokenRevocationStatus = 'unverified'; } }
  client = undefined;
  await writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2));
  console.log(`${evidence.status}: ${directory}/evidence.json`);
}
