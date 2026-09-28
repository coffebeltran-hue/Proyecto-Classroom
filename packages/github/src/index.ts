import { App, Octokit } from 'octokit';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

function loadSandboxConfig() {
  const required = (key: string) => { const value = process.env[key]; if (!value?.trim()) throw new Error('GITHUB_CONFIGURATION_MISSING'); return value.trim(); };
  const appId = Number(required('GITHUB_APP_ID'));
  const installationId = Number(required('GITHUB_INSTALLATION_ID'));
  const owner = required('GITHUB_SANDBOX_OWNER');
  const clientId = required('GITHUB_CLIENT_ID');
  const repository = required('GITHUB_SANDBOX_REPOSITORY');
  const unselected = required('GITHUB_UNSELECTED_REPOSITORY');
  const privateKeyPath = resolve(required('GITHUB_APP_PRIVATE_KEY_PATH'));
  if (appId !== 4990040 || installationId !== 162753561 || owner !== 'classroom-rr03-juan' || clientId !== 'Iv23li5WIsPocsfDyGbK' || repository !== 'rr03-allowed' || unselected !== 'rr03-denied' || privateKeyPath !== resolve('.local/rr03/app.private-key.pem')) throw new Error('SANDBOX_CONFIGURATION_MISMATCH');
  return { appId, installationId, owner, clientId, repository, unselected, privateKeyPath };
}
/** Construction only. Provider operations belong in future explicitly designed methods. */
export interface GitHubAdapter { readonly provider: 'github' }
export function createGitHubAdapter(): GitHubAdapter {
  const client = new Octokit();
  // Keep provider client private; do not expose a generic request proxy.
  void client;
  return Object.freeze({ provider: 'github' });
}

/** Disposable RR03 authority proof. All clients and credentials stay private. */
export async function proveSandboxAuthority(record: (step: string, detail: Record<string, unknown>) => Promise<void>): Promise<void> {
  const { appId, installationId, owner, clientId, repository, unselected, privateKeyPath } = loadSandboxConfig();
  const safeFetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== 'https://api.github.com') throw new Error('PROVIDER_ORIGIN_REJECTED');
    return fetch(input, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
  };
  const Client = Octokit.defaults({ request: { fetch: safeFetch }, retry: { enabled: false }, throttle: { enabled: false }, log: { debug() {}, info() {}, warn() {}, error() {} } });
  const privateKey = await readFile(privateKeyPath, 'utf8').catch(() => { throw new Error('APP_KEY_UNAVAILABLE'); });
  const app = new App({ appId, privateKey, Octokit: Client, log: { debug() {}, info() {}, warn() {}, error() {} } });
  const requireProof = (value: unknown, code: string) => { if (!value) throw new Error(code); };
  const { data: identity } = await app.octokit.request('GET /app');
  const safeIdentity = (value: unknown) => ({ present: value !== undefined && value !== null, type: typeof value, value: typeof value === 'number' && Number.isSafeInteger(value) || typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null });
  await record('app-identity-observation', { expected: { appId, slug: owner, clientId }, returned: { appId: safeIdentity(identity?.id), slug: safeIdentity(identity?.slug), clientId: safeIdentity(identity?.client_id) } });
  requireProof(identity?.id === appId && identity.slug === owner && (identity.client_id === undefined || identity.client_id === clientId), 'APP_IDENTITY_MISMATCH');
  await record('app-identity', { appId: identity!.id, slug: identity!.slug });
  const { data: organization } = await new Client().request('GET /orgs/{org}', { org: owner });
  requireProof(organization.login === owner && organization.type === 'Organization' && Number.isSafeInteger(organization.id), 'ACCOUNT_IDENTITY_MISMATCH');
  const { data: installation } = await app.octokit.request('GET /app/installations/{installation_id}', { installation_id: installationId });
  requireProof(installation.app_id === appId && installation.id === installationId && installation.account?.id === organization.id && 'type' in installation.account && installation.account.type === 'Organization', 'INSTALLATION_IDENTITY_MISMATCH');
  await record('installation-identity', { appId, installationId, accountId: organization.id, accountType: organization.type, repositorySelection: installation.repository_selection, contentsPermission: installation.permissions.contents ?? 'none', suspended: installation.suspended_at !== null });
  requireProof(!installation.suspended_at && installation.repository_selection === 'selected' && installation.permissions.contents === 'read', 'INSTALLATION_CONFIGURATION_REQUIRED');
  const { data: grant } = await app.octokit.request('POST /app/installations/{installation_id}/access_tokens', { installation_id: installationId, repositories: [repository], permissions: { contents: 'read', metadata: 'read' } });
  requireProof(Date.parse(grant.expires_at) > Date.now() + 30000 && grant.permissions?.contents === 'read' && Object.entries(grant.permissions).every(([key,value]) => ['contents','metadata'].includes(key) && value === 'read'), 'TOKEN_SCOPE_MISMATCH');
  const client = new Client({ auth: grant.token, request: { fetch: async (...args: Parameters<typeof fetch>) => {
    if (Date.now() >= Date.parse(grant.expires_at)) throw new Error('TOKEN_SCOPE_MISMATCH');
    return safeFetch(...args);
  } } });
  const { data: scope } = await client.request('GET /installation/repositories', { per_page: 100 });
  await record('repository-scope-observation', { totalCount: scope.total_count, repositories: scope.repositories.map(repo => ({ id: repo.id, expectedName: repo.name === repository, private: repo.private, ownerId: repo.owner.id })), expiresAt: grant.expires_at, permissions: { contents: grant.permissions?.contents, metadata: grant.permissions?.metadata } });
  requireProof(scope.total_count === 1 && scope.repositories.length === 1 && scope.repositories[0]?.name === repository && scope.repositories[0].private && scope.repositories[0].owner.id === organization.id, 'REPOSITORY_SCOPE_MISMATCH');
  await record('token-scope', { expiresAt: grant.expires_at, repositoryIds: scope.repositories.map(repo => repo.id), contentsPermission: grant.permissions!.contents });
  const { data: readme } = await client.request('GET /repos/{owner}/{repo}/readme', { owner, repo: repository });
  await record('allowed-readme', { repositoryId: scope.repositories[0]!.id, status: 200, digest: createHash('sha256').update(readme.content).digest('hex') });
  for (const route of ['GET /repos/{owner}/{repo}', 'GET /repos/{owner}/{repo}/readme'] as const) {
    let status = 0;
    try { await client.request(route, { owner, repo: unselected }); } catch (error) { status = sanitizeProviderError(error).status ?? 0; }
    requireProof(status === 404, 'UNSELECTED_REPOSITORY_NOT_DENIED');
    await record(route.endsWith('/readme') ? 'unselected-readme-denied' : 'unselected-repository-denied', { status });
  }
}

/** Never serialize provider errors: they can carry Authorization and request data. */
const safeCodes = new Set(['GITHUB_CONFIGURATION_MISSING', 'SANDBOX_CONFIGURATION_MISMATCH', 'PROVIDER_ORIGIN_REJECTED', 'APP_KEY_UNAVAILABLE', 'APP_IDENTITY_MISMATCH', 'ACCOUNT_IDENTITY_MISMATCH', 'INSTALLATION_IDENTITY_MISMATCH', 'INSTALLATION_CONFIGURATION_REQUIRED', 'TOKEN_SCOPE_MISMATCH', 'REPOSITORY_SCOPE_MISMATCH', 'UNSELECTED_REPOSITORY_NOT_DENIED', 'OAUTH_CONFIGURATION_INVALID', 'OAUTH_EXCHANGE_FAILED', 'OAUTH_USER_INVALID', 'OAUTH_INSTALLATION_UNVERIFIED', 'OAUTH_TOKEN_EXPIRED']);
export function sanitizeProviderError(error: unknown): { code: string; status?: number; transportCode?: string; rate?: Record<string, number> } {
  const candidate = error as { status?: unknown; message?: unknown; response?: { headers?: Record<string, unknown> }; cause?: { code?: unknown; cause?: { code?: unknown } } } | null;
  const status = typeof candidate?.status === 'number' && candidate.status >= 400 && candidate.status <= 599 ? candidate.status : undefined;
  const code = typeof candidate?.message === 'string' && safeCodes.has(candidate.message) ? candidate.message : 'PROVIDER_REQUEST_FAILED';
  const causeCode = candidate?.cause?.cause?.code ?? candidate?.cause?.code;
  const transportCode = typeof causeCode === 'string' && ['ECONNREFUSED','ENOTFOUND','ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'].includes(causeCode) ? causeCode : undefined;
  const rate: Record<string, number> = {};
  for (const key of ['x-ratelimit-limit','x-ratelimit-remaining','x-ratelimit-reset','retry-after']) {
    const value = candidate?.response?.headers?.[key];
    if (typeof value === 'string' && /^\d{1,12}$/.test(value)) rate[key] = Number(value);
  }
  return { code, ...(status ? { status } : {}), ...(transportCode ? { transportCode } : {}), ...(Object.keys(rate).length ? { rate } : {}) };
}

/** Narrow user authority proof; no user token, refresh token or generic client escapes. */
export function createSandboxOAuth() {
  const config = loadSandboxConfig();
  const secret = process.env.GITHUB_CLIENT_SECRET;
  const callback = process.env.GITHUB_CALLBACK_URL;
  if (!secret || !callback || !['http://127.0.0.1:3002/rr03/oauth/callback', 'http://localhost:3002/rr03/oauth/callback'].includes(callback)) throw new Error('OAUTH_CONFIGURATION_INVALID');
  let generation = 0;
  const pending = new Set<AbortController>();
  const boundedFetch: typeof fetch = async (input, init) => {
    const controller = new AbortController();
    pending.add(controller);
    try { return await fetch(input, { ...init, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), redirect: 'error' }); }
    finally { pending.delete(controller); }
  };
  return {
    origin: new URL(callback).origin,
    invalidate() { generation++; for (const controller of pending) controller.abort(); },
    authorize(state: string, challenge: string) {
      const url = new URL('https://github.com/login/oauth/authorize');
      url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: callback, state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
      return url.href;
    },
    async complete(code: string, verifier: string) {
      const startedGeneration = generation;
      // Pinned OAuth SDK drops code_verifier; this one fixed endpoint explicitly sends it.
      const response = await boundedFetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: config.clientId, client_secret: secret, redirect_uri: callback, code, code_verifier: verifier }) });
      if (!response.ok) throw new Error('OAUTH_EXCHANGE_FAILED');
      const grant = await response.json() as { access_token?: unknown; expires_in?: unknown; error?: unknown };
      if (grant.error || typeof grant.access_token !== 'string' || !grant.access_token || (grant.expires_in !== undefined && (typeof grant.expires_in !== 'number' || !Number.isFinite(grant.expires_in) || grant.expires_in <= 30))) throw new Error('OAUTH_EXCHANGE_FAILED');
      // Non-expiring provider tokens are used only for this bounded proof and then discarded.
      const expires = grant.expires_in === undefined ? Date.now() + 60000 : Date.now() + Number(grant.expires_in) * 1000;
      const client = new Octokit({ auth: grant.access_token, request: { fetch: async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        if (Date.now() >= expires || startedGeneration !== generation) throw new Error('OAUTH_TOKEN_EXPIRED');
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
        if (url.origin !== 'https://api.github.com') throw new Error('PROVIDER_ORIGIN_REJECTED');
        return boundedFetch(input, init);
      } }, retry: { enabled: false }, throttle: { enabled: false }, log: { debug() {}, info() {}, warn() {}, error() {} } });
      const { data: user } = await client.request('GET /user');
      if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('OAUTH_USER_INVALID');
      // Bounded pagination; inability to locate the installation grants no authority.
      let associated = false;
      for (let page = 1; page <= 10; page++) {
        const { data } = await client.request('GET /user/installations', { per_page: 100, page });
        associated = data.installations.some(installation => installation.id === config.installationId && installation.app_id === config.appId && installation.account?.id === 330894124 && 'type' in installation.account && installation.account.type === 'Organization' && !installation.suspended_at);
        if (associated || page * 100 >= data.total_count) break;
      }
      if (!associated || startedGeneration !== generation) throw new Error('OAUTH_INSTALLATION_UNVERIFIED');
      return { userId: user.id, appId: config.appId, installationId: config.installationId, accountId: 330894124, installationAssociated: true, organizationAdminAuthority: false, academicLinkage: false, providerExpirySeconds: grant.expires_in ?? null };
    },
  };
}

export interface RevocationObservation { status: number | 'baseline-failed' | 'holding-static-token' | 'probe-started' | 'revoked-401' | 'timeout' | 'discarded' | 'unavailable'; at: string }

/** Isolated RR03 experiment: retain ONE user token, never refresh/re-authorize it. */
export function createUserRevocationProbe(record: (observation: RevocationObservation) => Promise<void>) {
  const { clientId } = loadSandboxConfig();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callback = process.env.GITHUB_CALLBACK_URL;
  if (!clientSecret || callback !== 'http://127.0.0.1:3002/rr03/oauth/callback') throw new Error('OAUTH_CONFIGURATION_INVALID');
  let client: Octokit | undefined;
  let exchanged = false;
  let disposed = false;
  let polling = false;
  let providerExpiry = Infinity;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let active: AbortController | undefined;
  const observe = (status: RevocationObservation['status']) => record({ status, at: new Date().toISOString() });
  const discard = () => { clearTimeout(holdTimer); client = undefined; active?.abort(); };
  const statusRequest = async (deadline: number) => {
    if (!client) return 0;
    active = new AbortController();
    const timeout = Math.max(1, Math.min(5000, deadline - Date.now()));
    try {
      const response = await client.request('GET /user', { request: { signal: AbortSignal.any([active.signal, AbortSignal.timeout(timeout)]) } });
      return response.status;
    } catch (error) {
      const status = (error as { status?: unknown })?.status;
      return typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 ? status : 0;
    } finally { active = undefined; }
  };
  return Object.freeze({
    authorize(state: string, challenge: string) {
      if (exchanged || disposed) throw new Error('OAUTH_EXCHANGE_FAILED');
      const url = new URL('https://github.com/login/oauth/authorize');
      url.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
      return url.href;
    },
    async complete(code: string, verifier: string) {
      if (exchanged || disposed) throw new Error('OAUTH_EXCHANGE_FAILED');
      exchanged = true;
      try {
        active = new AbortController();
        const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', redirect: 'error', signal: AbortSignal.any([active.signal,AbortSignal.timeout(15000)]), headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, redirect_uri: callback, code, code_verifier: verifier }) });
        if (!response.ok) throw new Error('OAUTH_EXCHANGE_FAILED');
        const grant = await response.json() as { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown; error?: unknown };
        active = undefined;
        if (disposed) throw new Error('OAUTH_EXCHANGE_FAILED');
        if (grant.error || typeof grant.access_token !== 'string' || !grant.access_token || (grant.expires_in !== undefined && (typeof grant.expires_in !== 'number' || !Number.isFinite(grant.expires_in) || grant.expires_in <= 120))) throw new Error('OAUTH_EXCHANGE_FAILED');
        providerExpiry = grant.expires_in === undefined ? Infinity : Date.now() + Number(grant.expires_in) * 1000;
        // Static token auth has no refresh strategy or token getter. Never replace it.
        client = new Octokit({ auth: grant.access_token, request: { fetch: async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
          if (String(input) !== 'https://api.github.com/user') throw new Error('PROVIDER_ORIGIN_REJECTED');
          return fetch(input, { ...init, redirect: 'error' });
        } }, retry: { enabled: false }, throttle: { enabled: false }, log: { debug() {}, info() {}, warn() {}, error() {} } });
        grant.access_token = undefined;
        grant.refresh_token = undefined;
        const status = await statusRequest(Date.now() + 5000);
        await observe(status || 'unavailable');
        if (status !== 200 || disposed) throw new Error('OAUTH_EXCHANGE_FAILED');
        holdTimer = setTimeout(() => { discard(); void observe('discarded').catch(() => {}); }, Math.min(900000, providerExpiry - Date.now() - 60000));
        holdTimer.unref();
        await observe('holding-static-token');
      } catch { discard(); await observe('baseline-failed'); throw new Error('OAUTH_EXCHANGE_FAILED'); }
    },
    async probeAfterManualRevocation(): Promise<'revoked-401' | 'timeout'> {
      if (!client || polling || providerExpiry <= Date.now() + 60000) { discard(); throw new Error('OAUTH_TOKEN_EXPIRED'); }
      polling = true;
      clearTimeout(holdTimer);
      const deadline = Date.now() + 60000;
      try {
        await observe('probe-started');
        while (client && Date.now() < deadline) {
          const status = await statusRequest(deadline);
          await observe(status || 'unavailable');
          if (status === 401) { await observe('revoked-401'); return 'revoked-401'; }
          if (Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, Math.min(2000, deadline - Date.now())));
        }
        await observe('timeout');
        return 'timeout';
      } finally { discard(); }
    },
    dispose() { disposed = true; discard(); },
  });
}
