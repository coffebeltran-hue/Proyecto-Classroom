// Read-only repository proof; only credential mint/revocation mutate auth state.
import { App, Octokit } from 'octokit';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const owner = 'classroom-rr03-juan', target = 'rr03-user-template-final-01';
const directory = `.local/rr03/template-readback-${Date.now()}`;
await mkdir(directory, { recursive: true });
const evidence = { status: 'running', observations: [], inventory: [] };
const save = () => writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2));
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const Client = Octokit.defaults({ retry: { enabled: false }, throttle: { enabled: false }, log: quiet, request: { fetch: (url, init) => {
  if (new URL(String(url)).origin !== 'https://api.github.com') throw new Error();
  return fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
} } });
let client;
async function get(path) {
  try {
    const result = await client.request(`GET ${path}`);
    evidence.observations.push({ path, status: result.status, at: new Date().toISOString() }); await save();
    return { status: result.status, data: result.data };
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 0;
    evidence.observations.push({ path, status, at: new Date().toISOString() }); await save();
    return { status };
  }
}
try {
  const baseline = JSON.parse(await readFile('.local/rr03/user-template-final-01/evidence.json', 'utf8'));
  const app = new App({ appId: 4990040, privateKey: await readFile('.local/rr03/app.private-key.pem', 'utf8'), Octokit: Client, log: quiet });
  const grant = (await app.octokit.request('POST /app/installations/162753561/access_tokens', { permissions: { contents: 'read', administration: 'read', metadata: 'read' } })).data;
  client = new Client({ auth: grant.token }); grant.token = undefined;
  evidence.permissions = grant.permissions;
  const scope = await get('/installation/repositories?per_page=100');
  evidence.selectedRepositoryIds = scope.data?.repositories?.map(repo => repo.id);
  for (const name of ['rr03-generated-1789779803890', 'rr03-diagnostic-template-01', target]) {
    const repo = await get(`/repos/${owner}/${name}`);
    const item = { name, status: repo.status };
    if (repo.status === 200) {
      Object.assign(item, { id: repo.data.id, private: repo.data.private, ownerId: repo.data.owner.id });
      const commit = await get(`/repos/${owner}/${name}/commits?per_page=1`);
      item.commitStatus = commit.status;
      if (commit.status === 200 && commit.data.length) item.commit = commit.data[0].sha;
    }
    evidence.inventory.push(item); await save();
  }
  const repo = evidence.inventory.find(repo => repo.name === target);
  if (repo?.id !== 1376607049 || repo.private !== true || !repo.commit) throw new Error();
  const commit = await get(`/repos/${owner}/${target}/commits/${repo.commit}`);
  const treeSha = commit.data?.commit?.tree?.sha;
  if (!treeSha) throw new Error();
  const tree = await get(`/repos/${owner}/${target}/git/trees/${treeSha}?recursive=1`);
  if (tree.status !== 200 || tree.data.truncated || tree.data.tree.length > 5000) throw new Error();
  const manifest = tree.data.tree.map(({ path, mode, type, sha }) => ({ path, mode, type, sha })).sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const marker = manifest.find(entry => entry.path === '.github/workflows/rr03-marker.yml' && entry.type === 'blob');
  if (!marker) throw new Error();
  const blob = await get(`/repos/${owner}/${target}/git/blobs/${marker.sha}`);
  if (blob.status !== 200 || blob.data.encoding !== 'base64' || blob.data.size > 4096) throw new Error();
  const bytes = Buffer.from(blob.data.content, 'base64');
  const markerSha256 = createHash('sha256').update(bytes).digest('hex');
  evidence.target = { id: repo.id, commit: repo.commit, tree: treeSha, manifest, markerSha256 };
  evidence.manifestEqual = JSON.stringify(manifest) === JSON.stringify(baseline.sourceSnapshot.manifest);
  evidence.markerEqual = bytes.length === blob.data.size && markerSha256 === baseline.sourceSnapshot.markerSha256;
  evidence.sourceSnapshotCommit = baseline.sourceSnapshot.commit;
  evidence.status = evidence.manifestEqual && evidence.markerEqual ? 'readback-pass' : 'content-mismatch';
} catch { evidence.status = 'readback-blocked-or-incomplete'; }
finally {
  if (client) { try { evidence.tokenRevocationStatus = (await client.request('DELETE /installation/token')).status; } catch { evidence.tokenRevocationStatus = 'unverified'; } }
  client = undefined; await save(); console.log(`${evidence.status}: ${directory}/evidence.json`);
}
