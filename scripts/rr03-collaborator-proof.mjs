import { App, Octokit } from 'octokit';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Disposable, operator-authorized sandbox experiment. No product integration.
const owner = 'classroom-rr03-juan', repo = 'rr03-allowed', username = 'coffebeltran-maker';
const appId = 4990040, installationId = 162753561, accountId = 330894124, repositoryId = 1375855376;
const expectedInviteeId = 331091390;
const mode = process.argv[2] ?? 'cancel-invitation';
const directory = `.local/rr03/collaborator_${Date.now()}_${randomBytes(3).toString('hex')}`;
await mkdir(directory, { recursive: true });
const evidence = { mode, status: 'running', appId, installationId, accountId, repositoryId, checks: [] };
const save = () => writeFile(`${directory}/evidence.json`, JSON.stringify(evidence,null,2));
const record = async (step, detail = {}) => { evidence.checks.push({ step, at: new Date().toISOString(), ...detail }); await save(); console.log(step); };
class ProofFailure extends Error { constructor(code) { super(code); this.code = code; } }
const requireProof = (value, code) => { if (!value) throw new ProofFailure(code); };
const safeError = error => ({ code: error instanceof ProofFailure ? error.code : 'PROVIDER_REQUEST_FAILED', ...(Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599 ? { status: error.status } : {}) });
let client, inviteeId, baselineSafe = false, attemptedMutation = false, retainInvitation = false;
let deadline = Date.now() + 240000;
let expiresAt = Infinity;
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const Client = Octokit.defaults({ retry: { enabled: false }, throttle: { enabled: false }, log: quiet, request: { fetch: async (input, init) => {
  const url = new URL(String(input));
  requireProof(url.origin === 'https://api.github.com', 'FIXED_ORIGIN_REQUIRED');
  const revokingOwnToken = url.pathname === '/installation/token' && init?.method === 'DELETE';
  requireProof(Date.now() < (revokingOwnToken ? deadline : Math.min(deadline,expiresAt)), 'PROOF_DEADLINE');
  return fetch(input,{ ...init, redirect: 'error', signal: AbortSignal.timeout(Math.max(1,Math.min(10000,deadline - Date.now()))) });
} } });
const publicClient = new Client();
const pending = async () => {
  const target = [];
  for (let page = 1; page <= 5; page++) {
    const { data } = await client.request('GET /repos/{owner}/{repo}/invitations',{ owner,repo,per_page: 100,page });
    for (const invitation of data) if (invitation.invitee?.id === inviteeId) {
      requireProof(Number.isSafeInteger(invitation.id) && invitation.repository?.id === repositoryId, 'INVITATION_IDENTITY_MISMATCH');
      target.push({ id: invitation.id, inviteeId: invitation.invitee.id, permission: invitation.permissions });
    }
    if (data.length < 100) return target;
  }
  throw new ProofFailure('INVITATION_PAGE_LIMIT');
};
const accessStatus = async () => {
  try { return (await client.request('GET /repos/{owner}/{repo}/collaborators/{username}',{ owner,repo,username })).status; }
  catch (error) { if (error?.status === 404) return 404; throw error; }
};
const verifyNoAccess = async () => {
  requireProof(await accessStatus() === 404,'UNEXPECTED_COLLABORATOR_ACCESS');
  try {
    const { data } = await client.request('GET /repos/{owner}/{repo}/collaborators/{username}/permission',{ owner,repo,username });
    requireProof(data.permission === 'none' && (!data.user || data.user.id === inviteeId),'UNEXPECTED_EFFECTIVE_ACCESS');
  } catch (error) { if (error?.status !== 404) throw error; }
};
const removeNewEffects = async () => {
  if (!baselineSafe || !attemptedMutation || !client) return;
  // Baseline is persisted before our sole PUT. Never remove pre-existing grants.
  for (const invitation of await pending()) {
    await record('before-cleanup-invitation',{ invitationId: invitation.id, inviteeId });
    const result = await client.request('DELETE /repos/{owner}/{repo}/invitations/{invitation_id}',{ owner,repo,invitation_id: invitation.id });
    await record('cleanup-invitation',{ invitationId: invitation.id,status: result.status });
  }
  if (await accessStatus() === 204) {
    const { data: identity } = await publicClient.request('GET /users/{username}',{ username });
    requireProof(identity.id === inviteeId && identity.login.toLowerCase() === username,'CLEANUP_IDENTITY_MISMATCH');
    await record('before-cleanup-new-grant',{ inviteeId });
    const result = await client.request('DELETE /repos/{owner}/{repo}/collaborators/{username}',{ owner,repo,username });
    await record('cleanup-new-grant',{ inviteeId,status: result.status });
  }
  requireProof((await pending()).length === 0,'CLEANUP_INVITATION_REMAINS');
  await verifyNoAccess();
  await record('cleanup-no-invitation-no-access',{ inviteeId,status: 404 });
};
await save();
try {
  requireProof(['cancel-invitation','invite-for-acceptance'].includes(mode),'MODE_INVALID');
  requireProof(process.env.GITHUB_APP_ID === String(appId) && process.env.GITHUB_INSTALLATION_ID === String(installationId) && process.env.GITHUB_SANDBOX_OWNER === owner && process.env.GITHUB_SANDBOX_REPOSITORY === repo && process.env.GITHUB_CLIENT_ID === 'Iv23li5WIsPocsfDyGbK' && resolve(process.env.GITHUB_APP_PRIVATE_KEY_PATH ?? '') === resolve('.local/rr03/app.private-key.pem'),'SANDBOX_CONFIGURATION_MISMATCH');
  const files = ['scripts/rr03-collaborator-proof.mjs','package-lock.json','node_modules/octokit/dist-src/index.js','node_modules/@octokit/auth-app/dist-src/get-app-authentication.js'];
  evidence.fingerprints = Object.fromEntries(await Promise.all(files.map(async file => [file,createHash('sha256').update(await readFile(file)).digest('hex')])));
  evidence.versions = { node: process.version,octokit: JSON.parse(await readFile('node_modules/octokit/package.json','utf8')).version };
  await save();
  const app = new App({ appId,privateKey: await readFile('.local/rr03/app.private-key.pem','utf8'),Octokit: Client,log: quiet });
  const { data: identity } = await app.octokit.request('GET /app');
  requireProof(identity?.id === appId && identity.slug === owner && (identity.client_id === undefined || identity.client_id === process.env.GITHUB_CLIENT_ID),'APP_IDENTITY_MISMATCH');
  const { data: installation } = await app.octokit.request('GET /app/installations/{installation_id}',{ installation_id: installationId });
  requireProof(installation.id === installationId && installation.app_id === appId && installation.account?.id === accountId && installation.account.type === 'Organization' && !installation.suspended_at && installation.repository_selection === 'selected' && installation.permissions.administration === 'write' && installation.permissions.contents === 'read','INSTALLATION_AUTHORITY_MISMATCH');
  const { data: user } = await publicClient.request('GET /users/{username}',{ username });
  requireProof(user.id === expectedInviteeId && user.type === 'User' && user.login.toLowerCase() === username,'INVITEE_IDENTITY_MISMATCH');
  inviteeId = user.id;
  await record('verified-app-installation-invitee',{ inviteeId });
  const { data: grant } = await app.octokit.request('POST /app/installations/{installation_id}/access_tokens',{ installation_id: installationId,repositories: [repo],permissions: { administration: 'write',contents: 'read',metadata: 'read' } });
  // Construct private client immediately so even validation failures revoke our token.
  client = new Client({ auth: grant.token });
  expiresAt = Date.parse(grant.expires_at);
  requireProof(expiresAt > Date.now() + 300000 && grant.permissions?.administration === 'write' && grant.permissions.contents === 'read' && Object.entries(grant.permissions).every(([key,value]) => ['administration','contents','metadata'].includes(key) && value === (key === 'administration' ? 'write' : 'read')),'TOKEN_SCOPE_MISMATCH');
  grant.token = undefined;
  const { data: repositories } = await client.request('GET /installation/repositories',{ per_page: 100 });
  requireProof(repositories.total_count === 1 && repositories.repositories.length === 1 && repositories.repositories[0].id === repositoryId && repositories.repositories[0].private && repositories.repositories[0].owner.id === accountId,'REPOSITORY_SCOPE_MISMATCH');
  requireProof((await pending()).length === 0,'PREEXISTING_INVITATION_STOP');
  await verifyNoAccess();
  baselineSafe = true;
  await record('baseline-no-invitation-no-access',{ inviteeId,status: 404,expiresAt: new Date(expiresAt).toISOString() });
  await record('before-read-invitation',{ inviteeId,permission: 'pull' });
  attemptedMutation = true;
  // Exactly one PUT. A transport error is reconciled by cleanup; never blind-retry.
  const result = await client.request('PUT /repos/{owner}/{repo}/collaborators/{username}',{ owner,repo,username,permission: 'pull' });
  requireProof(result.status === 201 && result.data?.invitee?.id === inviteeId && Number.isSafeInteger(result.data.id),'INVITATION_CREATE_UNEXPECTED');
  const invitationId = result.data.id;
  await record('created-read-invitation',{ invitationId,inviteeId,status: result.status });
  const invitations = await pending();
  requireProof(invitations.length === 1 && invitations[0].id === invitationId && invitations[0].permission === 'read','INVITATION_SCOPE_MISMATCH');
  await verifyNoAccess();
  await record('listed-read-invitation-no-access',{ invitationId,inviteeId,status: 404 });
  if (mode === 'invite-for-acceptance') {
    await record('awaiting-manual-acceptance',{ invitationId,inviteeId });
    retainInvitation = true;
    evidence.status = 'awaiting-manual-acceptance';
  } else {
    await removeNewEffects();
    attemptedMutation = false;
    evidence.status = 'pass';
  }
} catch (error) {
  evidence.status = 'fail'; evidence.error = safeError(error); process.exitCode = 1;
  await save().catch(() => {});
} finally {
  deadline = Date.now() + 90000;
  if (attemptedMutation && !retainInvitation) {
    try { await removeNewEffects(); }
    catch (error) { evidence.cleanupError = safeError(error); evidence.status = 'cleanup-required'; process.exitCode = 1; }
  }
  if (client) {
    try {
      const result = await client.request('DELETE /installation/token');
      await record('own-token-revoked',{ status: result.status });
    } catch (error) { evidence.tokenRevocationError = safeError(error); evidence.status = 'token-revocation-unconfirmed'; process.exitCode = 1; }
    client = undefined;
  }
  await save();
  console.log(`RR03 ${evidence.status}: ${directory}/evidence.json`);
}
