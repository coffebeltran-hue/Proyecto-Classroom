// Isolated, explicitly authorized RR03 experiment; not a product endpoint.
import Fastify from 'fastify';
import { mkdir, readFile, writeFile, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { OAuthStateStore } from '../packages/github/src/security.ts';

const owner = 'classroom-rr03-juan', source = 'rr03-allowed', target = 'rr03-user-template-final-01';
const clientId = 'Iv23li5WIsPocsfDyGbK', installationId = 162753561;
const callback = 'http://127.0.0.1:3002/rr03/oauth/callback';
const directory = '.local/rr03/user-template-final-01';
const evidenceFile = `${directory}/evidence.json`;
const markerPath = '.github/workflows/rr03-marker.yml';
const targets = ['rr03-generated-1789779803890', 'rr03-diagnostic-template-01', target];
let token, used = false, started = false, timer;
const evidence = { status: 'awaiting-oauth', target, source: `${owner}/${source}`, credential: 'github-app-user-access-token', generationRequests: 0, observations: [], inventory: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const save = () => writeFile(evidenceFile, JSON.stringify(evidence, null, 2));
const clean = value => String(value).replaceAll(token || '\u0000', '[REDACTED]').replaceAll(process.env.GITHUB_CLIENT_SECRET || '\u0000', '[REDACTED]').replace(/(?:gh[opusr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)/g, '[REDACTED]').slice(0, 2000);
function safeErrors(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map(item => typeof item === 'string' ? clean(item) : Object.fromEntries(['resource', 'field', 'code', 'message'].filter(key => typeof item?.[key] === 'string').map(key => [key, clean(item[key])])));
}
const ensure = (condition, code) => { if (!condition) throw new Error(code); };
async function request(path, method = 'GET', body) {
  ensure(path.startsWith('/') && !path.startsWith('//'), 'INVALID_PATH');
  ensure(method === 'GET' || method === 'POST' && path === `/repos/${owner}/${source}/generate`, 'MUTATION_NOT_ALLOWED');
  const response = await fetch(`https://api.github.com${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(15000), headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'rr03-single-user-template-proof' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data; try { data = await response.json(); } catch { data = {}; }
  evidence.observations.push({ method, path, status: response.status, at: new Date().toISOString(), requestId: response.headers.get('x-github-request-id'), ...(!response.ok ? { message: clean(data.message ?? 'No JSON message'), errors: safeErrors(data.errors) } : {}) });
  await save();
  return { status: response.status, data };
}
async function get(path) { const result = await request(path); ensure(result.status === 200, 'READ_FAILED'); return result.data; }
async function snapshot(repo, branch) {
  const commit = await get(`/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`);
  const tree = await get(`/repos/${owner}/${repo}/git/trees/${commit.commit.tree.sha}?recursive=1`);
  ensure(!tree.truncated && tree.tree.length <= 5000, 'INCOMPLETE_TREE');
  const manifest = tree.tree.map(({ path, mode, type, sha }) => ({ path, mode, type, sha })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const workflows = manifest.filter(entry => entry.path.startsWith('.github/workflows/') && entry.type !== 'tree');
  ensure(workflows.length === 1 && workflows[0].path === markerPath && workflows[0].type === 'blob', 'UNEXPECTED_WORKFLOWS');
  const blob = await get(`/repos/${owner}/${repo}/git/blobs/${workflows[0].sha}`);
  ensure(blob.encoding === 'base64' && blob.size <= 4096, 'INVALID_MARKER');
  const bytes = Buffer.from(blob.content, 'base64');
  ensure(bytes.length === blob.size, 'MARKER_SIZE_MISMATCH');
  return { commit: commit.sha, tree: commit.commit.tree.sha, manifest, markerSha256: hash(bytes) };
}
async function inventory() {
  for (const repo of targets) {
    try {
      const result = await request(`/repos/${owner}/${repo}`);
      const item = { name: repo, status: result.status, visibility: result.status === 200 ? 'visible' : 'not-established-with-this-credential' };
      if (result.status === 200) {
        Object.assign(item, { id: result.data.id, private: result.data.private, ownerId: result.data.owner?.id });
        const commits = await request(`/repos/${owner}/${repo}/commits?per_page=1`);
        item.commitStatus = commits.status;
        item.contentState = commits.status === 200 && commits.data.length ? 'has-commit' : commits.status === 409 ? 'empty-or-incomplete' : 'unverified';
        if (commits.status === 200 && commits.data.length) item.headCommit = commits.data[0].sha;
      }
      evidence.inventory.push(item);
    } catch { evidence.inventory.push({ name: repo, visibility: 'unverified', error: 'READ_UNAVAILABLE' }); }
    await save();
  }
}
async function run(code, verifier) {
  used = true; clearTimeout(timer);
  try {
    evidence.status = 'oauth-exchange-started'; await save();
    const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: clientId, client_secret: process.env.GITHUB_CLIENT_SECRET, redirect_uri: callback, code, code_verifier: verifier }) });
    ensure(response.ok, 'OAUTH_EXCHANGE_FAILED');
    const grant = await response.json();
    token = grant.access_token; grant.access_token = undefined; grant.refresh_token = undefined;
    ensure(typeof token === 'string' && token.length > 0 && !grant.error, 'OAUTH_EXCHANGE_FAILED');
    const user = await get('/user');
    ensure(user.login === 'coffebeltran-hue', 'WRONG_USER');
    evidence.user = { id: user.id, login: user.login };
    const installations = await get('/user/installations?per_page=100');
    const current = installations.installations.find(item => item.id === installationId);
    ensure(current?.app_id === 4990040 && current.account?.id === 330894124 && current.repository_selection === 'selected' && !current.suspended_at && current.permissions?.administration === 'write' && current.permissions?.contents === 'read' && Object.entries(current.permissions).every(([key, value]) => ['administration', 'contents', 'metadata'].includes(key) && value === (key === 'administration' ? 'write' : 'read')), 'INSTALLATION_PERMISSIONS_MISMATCH');
    evidence.permissions = current.permissions;
    evidence.repositorySelection = current.repository_selection;
    const installation = await get(`/user/installations/${installationId}/repositories?per_page=100`);
    evidence.visibleRepositoryIds = installation.repositories.map(repo => repo.id);
    ensure(installation.repositories.some(repo => repo.id === 1375855376), 'SOURCE_NOT_IN_INSTALLATION');
    const repo = await get(`/repos/${owner}/${source}`);
    ensure(repo.id === 1375855376 && repo.owner?.id === 330894124 && repo.private && repo.is_template, 'SOURCE_MISMATCH');
    evidence.sourceSnapshot = await snapshot(source, repo.default_branch);
    ensure(evidence.sourceSnapshot.commit === '0ca44601747fe3173fcf8053bb75e90607d3aa5c' && evidence.sourceSnapshot.markerSha256 === 'b0d4300331fa26d3f1dba063d593a8c227f843e7cb6786afe71d149312dc5072', 'SOURCE_CHANGED');
    const existing = await request(`/repos/${owner}/${target}`);
    ensure(existing.status === 404, 'TARGET_ALREADY_VISIBLE_OR_PREFLIGHT_FAILED');
    // Durable exclusive sentinel: even a timeout/crash cannot authorize a retry.
    const lock = await open(`${directory}/generation-attempted.json`, 'wx');
    try { await lock.writeFile(JSON.stringify({ target, at: new Date().toISOString(), maximumRequests: 1 })); await lock.sync(); } finally { await lock.close(); }
    evidence.generationRequests = 1; evidence.status = 'single-post-dispatching'; await save();
    const generated = await request(`/repos/${owner}/${source}/generate`, 'POST', { owner, name: target, private: true, include_all_branches: false });
    evidence.generationStatus = generated.status;
    if (generated.status !== 201) { evidence.status = 'generation-error-stop'; return; }
    ensure(generated.data.name === target && generated.data.private && generated.data.owner?.id === 330894124, 'TARGET_IDENTITY_MISMATCH');
    evidence.targetId = generated.data.id;
    evidence.targetSnapshot = await snapshot(target, generated.data.default_branch || repo.default_branch);
    const after = await get(`/repos/${owner}/${source}/commits/${encodeURIComponent(repo.default_branch)}`);
    ensure(after.sha === evidence.sourceSnapshot.commit, 'SOURCE_CHANGED_DURING_GENERATION');
    ensure(JSON.stringify(evidence.sourceSnapshot.manifest) === JSON.stringify(evidence.targetSnapshot.manifest) && evidence.sourceSnapshot.markerSha256 === evidence.targetSnapshot.markerSha256, 'REPRODUCTION_MISMATCH');
    evidence.status = 'user-token-template-reproduction-pass';
  } catch { evidence.status = evidence.generationRequests ? 'partial-after-single-attempt-no-retry' : 'preflight-or-oauth-failed-no-generation'; }
  finally {
    if (token) await inventory();
    token = undefined;
    evidence.tokenDiscarded = true; evidence.finishedAt = new Date().toISOString();
    await save(); console.log(`RR03 ${evidence.status}; evidence: ${evidenceFile}`);
  }
}
const server = Fastify({ logger: false, requestTimeout: 20000, connectionTimeout: 20000, bodyLimit: 1024 });
server.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) => done(null, body));
const states = new OAuthStateStore();
server.setErrorHandler((_error, _request, reply) => reply.code(400).send({ status: 'rejected' }));
server.addHook('onRequest', async (request, reply) => {
  // The local form needs a same-origin POST Origin. no-referrer on its page
  // can make browsers send Origin: null, which our strict guard correctly denies.
  // Keep OAuth callback URLs suppressed; never allow null/foreign origins.
  reply.header('cache-control', 'no-store').header('referrer-policy', request.url === '/rr03/oauth/start' ? 'same-origin' : 'no-referrer');
  if (request.headers.host !== '127.0.0.1:3002' || request.headers.origin !== undefined && request.headers.origin !== 'http://127.0.0.1:3002') return reply.code(403).send({ status: 'local-only' });
});
server.get('/rr03/oauth/start', async (_request, reply) => {
  return reply.type('text/html').send('<!doctype html><meta charset="utf-8"><title>RR03 final</title><h1>Prueba final RR03</h1><p>Inicia con coffebeltran-hue. Una generación como máximo.</p><form method="post" action="/rr03/oauth/start"><button type="submit">Autorizar con GitHub</button></form>');
});
server.post('/rr03/oauth/start', async (_request, reply) => {
  if (started || used) return reply.code(409).send({ status: 'already-started-no-repeat' });
  started = true;
  const { state, binding, challenge } = states.issue();
  reply.header('set-cookie', `rr03_final=${binding}; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=300`);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
  return reply.code(303).redirect(url.href);
});
server.get('/rr03/oauth/callback', async (request, reply) => {
  if (used) return reply.code(409).send({ status: 'already-used' });
  const bindings = (request.headers.cookie ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith('rr03_final='));
  reply.header('set-cookie', 'rr03_final=; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=0');
  const verifier = states.consume(request.query.state, bindings.length === 1 ? bindings[0].slice('rr03_final='.length) : undefined);
  ensure(typeof request.query.code === 'string' && request.query.code.length > 0 && request.query.code.length < 1000 && !request.query.error, 'INVALID_CALLBACK');
  await run(request.query.code, verifier);
  void reply.send({ status: evidence.status, evidence: evidenceFile, next: 'Report completion. Do not repeat OAuth or generation.' });
  setImmediate(() => { void server.close(); });
});
try {
  ensure(process.env.GITHUB_CLIENT_ID === clientId && process.env.GITHUB_CALLBACK_URL === callback && process.env.GITHUB_CLIENT_SECRET, 'CONFIGURATION_INVALID');
  await mkdir(directory, { recursive: true });
  // Resume only a receiver that never reached OAuth/provider work. Never reset a POST guard.
  try {
    await writeFile(evidenceFile, JSON.stringify(evidence, null, 2), { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const previous = JSON.parse(await readFile(evidenceFile, 'utf8'));
    ensure(previous.status === 'awaiting-oauth' && previous.generationRequests === 0 && previous.observations?.length === 0 && previous.inventory?.length === 0, 'EXISTING_RUN_NOT_RESTARTABLE');
    let attempted = false;
    try { await readFile(`${directory}/generation-attempted.json`); attempted = true; } catch (readError) { if (readError.code !== 'ENOENT') throw readError; }
    ensure(!attempted, 'GENERATION_ALREADY_ATTEMPTED');
    evidence.receiverRestarts = [...(previous.receiverRestarts ?? []), { at: new Date().toISOString(), previousScriptSha256: previous.scriptSha256 }];
  }
  evidence.scriptSha256 = hash(await readFile(new URL(import.meta.url))); await save();
  await server.listen({ host: '127.0.0.1', port: 3002 });
  timer = setTimeout(() => { token = undefined; void server.close(); }, 900000);
  console.log('RR03 final ready: http://127.0.0.1:3002/rr03/oauth/start — open ONCE as coffebeltran-hue. One generation maximum.');
} catch (error) {
  token = undefined;
  const known = ['EADDRINUSE', 'EACCES', 'EPERM', 'ENOENT', 'EEXIST', 'CONFIGURATION_INVALID', 'EXISTING_RUN_NOT_RESTARTABLE', 'GENERATION_ALREADY_ATTEMPTED'];
  const code = known.includes(error?.code) ? error.code : known.includes(error?.message) ? error.message : 'UNCLASSIFIED_START_FAILURE';
  console.error(`RR03_FINAL_START_UNAVAILABLE: ${code} — no automatic retry`);
  process.exitCode = 1; await server.close();
}
