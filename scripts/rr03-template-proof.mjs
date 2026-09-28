import { App, Octokit } from 'octokit';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// One explicitly authorized disposable template creation; no retries of the POST.
const owner = 'classroom-rr03-juan', source = 'rr03-allowed';
const appId = 4990040, installationId = 162753561, accountId = 330894124, sourceId = 1375855376;
const markerPath = '.github/workflows/rr03-marker.yml';
const expectedMarker = 'name: RR03 reproduction marker\non: workflow_dispatch\njobs:\n  marker:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "RR03 template marker"';
const timestamp = Date.now();
const target = `rr03-generated-${timestamp}`;
const directory = `.local/rr03/template_${timestamp}_${randomBytes(3).toString('hex')}`;
await mkdir(directory,{ recursive: true });
const evidence = { status: 'running', appId, installationId, accountId, sourceId, target, markerPath, checks: [] };
const save = () => writeFile(`${directory}/evidence.json`,JSON.stringify(evidence,null,2));
const record = async (step,detail = {}) => { evidence.checks.push({ step,at: new Date().toISOString(),...detail }); await save(); console.log(step); };
class Failure extends Error { constructor(code) { super(code); this.code = code; } }
const requireProof = (value,code) => { if (!value) throw new Failure(code); };
const safeError = error => ({ code: error instanceof Failure ? error.code : 'PROVIDER_REQUEST_FAILED', ...(Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599 ? { status: error.status } : {}) });
const tokens = [];
let deadline = Date.now() + 240000;
const quiet = { debug() {},info() {},warn() {},error() {} };
const Client = Octokit.defaults({ retry: { enabled: false },throttle: { enabled: false },log: quiet,request: { fetch: async (input,init) => {
  requireProof(new URL(String(input)).origin === 'https://api.github.com','FIXED_ORIGIN_REQUIRED');
  requireProof(Date.now() < deadline,'PROOF_DEADLINE');
  return fetch(input,{ ...init,redirect: 'error',signal: AbortSignal.timeout(Math.max(1,Math.min(10000,deadline - Date.now()))) });
} } });
const scopeFailure = error => [403,404,422].includes(error?.status);
const normalize = text => text.replace(/\r\n/g,'\n').split('\n').map(line => line.replace(/[ \t]+$/,'')).filter(line => line.trim().length > 0).join('\n').trim();
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const mint = async (app,repositoryIds) => {
  const { data: grant } = await app.octokit.request('POST /app/installations/{installation_id}/access_tokens',{ installation_id: installationId,repository_ids: repositoryIds,permissions: { administration: 'write',contents: 'read',metadata: 'read' } });
  const expires = Date.parse(grant.expires_at);
  const client = new Client({ auth: grant.token,request: { fetch: async (input,init) => {
    const revoking = new URL(String(input)).pathname === '/installation/token' && init?.method === 'DELETE';
    requireProof(revoking || Date.now() < expires,'TOKEN_EXPIRED');
    requireProof(new URL(String(input)).origin === 'https://api.github.com' && Date.now() < deadline,'FIXED_ORIGIN_OR_DEADLINE');
    return fetch(input,{ ...init,redirect: 'error',signal: AbortSignal.timeout(Math.max(1,Math.min(10000,deadline - Date.now()))) });
  } } });
  tokens.push(client); grant.token = undefined;
  requireProof(expires > Date.now() + 300000 && grant.permissions?.administration === 'write' && grant.permissions.contents === 'read' && Object.entries(grant.permissions).every(([key,value]) => ['administration','contents','metadata'].includes(key) && value === (key === 'administration' ? 'write' : 'read')),'TOKEN_SCOPE_MISMATCH');
  const { data: scope } = await client.request('GET /installation/repositories',{ per_page: 100 });
  const actual = scope.repositories.map(repository => repository.id).sort((a,b) => a - b);
  await record('token-scope',{ requestedIds: repositoryIds,actualIds: actual,expiresAt: grant.expires_at });
  requireProof(scope.total_count === repositoryIds.length && JSON.stringify(actual) === JSON.stringify([...repositoryIds].sort((a,b) => a - b)),'TOKEN_REPOSITORY_SCOPE_MISMATCH');
  return client;
};
const commit = async (client,repo,ref) => (await client.request('GET /repos/{owner}/{repo}/commits/{ref}',{ owner,repo,ref })).data;
const tree = async (client,repo,treeSha) => {
  const { data } = await client.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}',{ owner,repo,tree_sha: treeSha,recursive: '1' });
  requireProof(!data.truncated && data.tree.length <= 5000,'TREE_NOT_BOUNDED_COMPLETE');
  const manifest = data.tree.map(entry => {
    requireProof(typeof entry.path === 'string' && typeof entry.mode === 'string' && ['blob','tree','commit'].includes(entry.type) && /^[a-f0-9]{40}$/.test(entry.sha),'TREE_ENTRY_INVALID');
    return { path: entry.path,mode: entry.mode,type: entry.type,...(entry.type !== 'tree' ? { blobSha: entry.sha } : {}) };
  }).sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return manifest;
};
const marker = async (client,repo,manifest) => {
  const workflows = manifest.filter(entry => entry.type !== 'tree' && entry.path.startsWith('.github/workflows/'));
  requireProof(workflows.length === 1 && workflows[0].path === markerPath && workflows[0].type === 'blob' && workflows[0].mode === '100644','WORKFLOW_SET_UNEXPECTED');
  const { data } = await client.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}',{ owner,repo,file_sha: workflows[0].blobSha });
  requireProof(data.encoding === 'base64' && data.size <= 4096,'MARKER_BLOB_INVALID');
  const bytes = Buffer.from(data.content,'base64');
  requireProof(bytes.length === data.size && normalize(bytes.toString('utf8')) === expectedMarker,'MARKER_NOT_DISPATCH_ONLY');
  return digest(bytes);
};
await save();
try {
  requireProof(process.env.GITHUB_APP_ID === String(appId) && process.env.GITHUB_INSTALLATION_ID === String(installationId) && process.env.GITHUB_SANDBOX_OWNER === owner && process.env.GITHUB_SANDBOX_REPOSITORY === source && process.env.GITHUB_CLIENT_ID === 'Iv23li5WIsPocsfDyGbK' && resolve(process.env.GITHUB_APP_PRIVATE_KEY_PATH ?? '') === resolve('.local/rr03/app.private-key.pem'),'SANDBOX_CONFIGURATION_MISMATCH');
  const files = ['scripts/rr03-template-proof.mjs','package-lock.json','node_modules/octokit/dist-src/index.js'];
  evidence.fingerprints = Object.fromEntries(await Promise.all(files.map(async file => [file,digest(await readFile(file))])));
  evidence.versions = { node: process.version,octokit: JSON.parse(await readFile('node_modules/octokit/package.json','utf8')).version };
  await save();
  const app = new App({ appId,privateKey: await readFile('.local/rr03/app.private-key.pem','utf8'),Octokit: Client,log: quiet });
  const { data: appIdentity } = await app.octokit.request('GET /app');
  requireProof(appIdentity?.id === appId && appIdentity.slug === owner && (appIdentity.client_id === undefined || appIdentity.client_id === process.env.GITHUB_CLIENT_ID),'APP_IDENTITY_MISMATCH');
  const { data: installation } = await app.octokit.request('GET /app/installations/{installation_id}',{ installation_id: installationId });
  requireProof(installation.id === installationId && installation.app_id === appId && installation.account?.id === accountId && installation.account.type === 'Organization' && !installation.suspended_at && installation.repository_selection === 'selected' && installation.permissions.administration === 'write' && installation.permissions.contents === 'read','INSTALLATION_AUTHORITY_MISMATCH');
  const sourceClient = await mint(app,[sourceId]);
  const { data: sourceRepository } = await sourceClient.request('GET /repos/{owner}/{repo}',{ owner,repo: source });
  requireProof(sourceRepository.id === sourceId && sourceRepository.owner.id === accountId && sourceRepository.private && sourceRepository.is_template === true,'SOURCE_NOT_PRIVATE_TEMPLATE');
  const before = await commit(sourceClient,source,sourceRepository.default_branch);
  const sourceManifest = await tree(sourceClient,source,before.commit.tree.sha);
  const sourceMarkerDigest = await marker(sourceClient,source,sourceManifest);
  evidence.source = { branch: sourceRepository.default_branch,commit: before.sha,tree: before.commit.tree.sha,manifest: sourceManifest,markerSha256: sourceMarkerDigest };
  await record('before-single-generate',{ target,private: true,includeAllBranches: false });
  evidence.creationAttempted = true; await save();
  // Never retry this mutation, including timeouts/5xx. Target name is recoverable.
  const generated = await sourceClient.request('POST /repos/{template_owner}/{template_repo}/generate',{ template_owner: owner,template_repo: source,owner,name: target,private: true,include_all_branches: false });
  requireProof(generated.status === 201 && Number.isSafeInteger(generated.data.id) && generated.data.owner.id === accountId && generated.data.private && generated.data.name === target,'GENERATED_IDENTITY_MISMATCH');
  evidence.targetId = generated.data.id;
  await record('generated-private-repository',{ repositoryId: generated.data.id,status: generated.status });
  const after = await commit(sourceClient,source,sourceRepository.default_branch);
  requireProof(after.sha === before.sha && after.commit.tree.sha === before.commit.tree.sha,'SOURCE_CHANGED_DURING_GENERATION');
  await record('source-unchanged-after-generation',{ commit: after.sha,tree: after.commit.tree.sha });
  let targetClient;
  try { targetClient = await mint(app,[sourceId,generated.data.id]); }
  catch (error) { if (scopeFailure(error)) { evidence.status = 'awaiting-manual-selection'; throw new Failure('TARGET_INSTALLATION_SCOPE_REQUIRED'); } throw error; }
  try {
    const { data: targetRepository } = await targetClient.request('GET /repos/{owner}/{repo}',{ owner,repo: target });
    requireProof(targetRepository.id === generated.data.id && targetRepository.private && targetRepository.owner.id === accountId,'TARGET_IDENTITY_MISMATCH');
  } catch (error) { if (scopeFailure(error)) { evidence.status = 'awaiting-manual-selection'; throw new Failure('TARGET_INSTALLATION_SCOPE_REQUIRED'); } throw error; }
  let targetCommit;
  for (let attempt = 0; attempt < 8; attempt++) {
    try { targetCommit = await commit(targetClient,target,sourceRepository.default_branch); break; }
    catch (error) {
      if (error?.status === 403) { evidence.status = 'awaiting-manual-selection'; throw new Failure('TARGET_INSTALLATION_SCOPE_REQUIRED'); }
      // Repository metadata was accessible above: 404/409 can mean generation not ready.
      if (![404,409].includes(error?.status)) throw error;
      if (attempt < 7) await new Promise(resolve => setTimeout(resolve,1000));
    }
  }
  requireProof(targetCommit,'GENERATED_TREE_NOT_READY');
  const targetManifest = await tree(targetClient,target,targetCommit.commit.tree.sha);
  const targetMarkerDigest = await marker(targetClient,target,targetManifest);
  evidence.generated = { commit: targetCommit.sha,tree: targetCommit.commit.tree.sha,manifest: targetManifest,markerSha256: targetMarkerDigest };
  await save();
  requireProof(JSON.stringify(targetManifest) === JSON.stringify(sourceManifest) && targetMarkerDigest === sourceMarkerDigest,'GENERATED_CONTENT_MISMATCH');
  await record('tree-and-marker-identical',{ commitMayDiffer: true });
  evidence.status = 'pass';
} catch (error) {
  if (evidence.status !== 'awaiting-manual-selection') evidence.status = evidence.creationAttempted && !evidence.targetId ? 'creation-outcome-unconfirmed-do-not-retry' : 'fail';
  evidence.error = safeError(error); process.exitCode = 1;
} finally {
  deadline = Date.now() + 30000;
  for (const client of tokens) {
    try { await record('own-token-revoked',{ status: (await client.request('DELETE /installation/token')).status }); }
    catch (error) { (evidence.tokenRevocationErrors ??= []).push(safeError(error)); process.exitCode = 1; }
  }
  tokens.length = 0;
  await save(); console.log(`RR03 ${evidence.status}: ${directory}/evidence.json`);
}
