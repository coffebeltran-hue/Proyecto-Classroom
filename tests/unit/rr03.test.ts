import { describe, it, expect, vi } from 'vitest';
import { createHmac, createHash } from 'node:crypto';
import { MAX_WEBHOOK_BYTES, OAuthStateStore, parseIntake, verifyWebhook } from '../../packages/github/src/security.js';
import { createSandboxOAuth, sanitizeProviderError } from '../../packages/github/src/index.js';
import { createProofServer } from '../../scripts/rr03-server.js';

describe('RR03 security, simulated provider/HTTP except official HMAC vector', () => {
  it('accepts the official raw SHA256 vector and rejects altered/missing/malformed signatures and oversized body', () => {
    const bytes = Buffer.from('Hello, World!');
    const secret = "It's a Secret to Everybody";
    const signature = 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17';
    expect(verifyWebhook(bytes,signature,secret)).toBe(true);
    for (const invalid of [undefined, [], '', signature.toUpperCase(), 'sha256=' + '0'.repeat(64), 'sha1=abc']) expect(verifyWebhook(bytes,invalid,secret)).toBe(false);
    expect(verifyWebhook(Buffer.from('Hello, World! '),signature,secret)).toBe(false);
    expect(verifyWebhook(Buffer.alloc(MAX_WEBHOOK_BYTES + 1),signature,secret)).toBe(false);
    expect(verifyWebhook(bytes,signature,'')).toBe(false);
  });
  it('binds expiring single-use state to its browser, with S256 and restart fail-closed', () => {
    let now = 0;
    const states = new OAuthStateStore(() => now);
    const first = states.issue();
    const verifier = states.consume(first.state,first.binding);
    expect(createHash('sha256').update(verifier).digest('base64url')).toBe(first.challenge);
    expect(() => states.consume(first.state,first.binding)).toThrow('OAUTH_STATE_INVALID');
    const second = states.issue();
    expect(() => states.consume(second.state,first.binding)).toThrow('OAUTH_STATE_INVALID');
    expect(() => states.consume(second.state,second.binding)).toThrow('OAUTH_STATE_INVALID');
    const third = states.issue(); now = 300000;
    expect(() => states.consume(third.state,third.binding)).toThrow('OAUTH_STATE_INVALID');
    expect(() => new OAuthStateStore().consume(third.state,third.binding)).toThrow('OAUTH_STATE_INVALID');
  });
  it('bounds outstanding state storage', () => {
    const states = new OAuthStateStore();
    for (let i = 0; i < 100; i++) states.issue();
    expect(() => states.issue()).toThrow('OAUTH_CAPACITY');
  });
  it('retains only digest/IDs and never activates capability from lifecycle hints', () => {
    for (const action of ['suspend','deleted','unsuspend','created']) {
      const receipt = parseIntake(Buffer.from(JSON.stringify({ action, installation: { id: 162753561 }, secret: 'ignored' })), 'delivery', 'installation', { appId: 4990040, installationId: 162753561 });
      expect(receipt.capability).toBe(['suspend','deleted'].includes(action) ? 'invalidated' : 'verification-required');
      expect(JSON.stringify(receipt)).not.toContain('ignored');
    }
    expect(() => parseIntake(Buffer.from('{'),'delivery','ping',{ appId: 4990040, installationId: 162753561 })).toThrow('WEBHOOK_JSON_INVALID');
    expect(() => parseIntake(Buffer.from('{"installation":{"id":1}}'),'delivery','installation',{ appId: 4990040, installationId: 162753561 })).toThrow('WEBHOOK_AUTHORITY_MISMATCH');
  });
  it('sanitizes uppercase secret-looking messages, headers, URLs and transport causes', () => {
    for (const message of ['SECRET_PASSWORD','https://github.com/?code=secret','Authorization: bearer secret']) expect(sanitizeProviderError({ message, request: { authorization: 'secret' }, cause: { code: 'SECRET_PASSWORD' } })).toEqual({ code: 'PROVIDER_REQUEST_FAILED' });
    expect(sanitizeProviderError({ status: 429, response: { headers: { 'retry-after': '10', 'x-ratelimit-remaining': '0', authorization: 'secret', 'x-ratelimit-reset': 'secret' } } })).toEqual({ code: 'PROVIDER_REQUEST_FAILED', status: 429, rate: { 'x-ratelimit-remaining': 0, 'retry-after': 10 } });
  });
  it('authenticates before parsing and before any intake or invalidation', async () => {
    const intake = vi.fn(async () => 'accepted' as const);
    const invalidate = vi.fn();
    const server = createProofServer({ secret: 'synthetic', intake, oauth: { authorize: () => '', complete: async () => null, invalidate }, recordUser: async () => {} });
    try {
      for (const payload of ['{', '{}']) {
        const result = await server.inject({ method: 'POST', url: '/rr03/webhooks/github', payload, headers: { 'content-type': 'application/json', 'x-github-event': 'github_app_authorization', 'x-github-delivery': 'test' } });
        expect(result.statusCode).toBe(401);
      }
      expect(intake).not.toHaveBeenCalled(); expect(invalidate).not.toHaveBeenCalled();
      const payload = '{}';
      const result = await server.inject({ method: 'POST', url: '/rr03/webhooks/github', payload, headers: { 'content-type': 'application/json', 'x-github-event': 'github_app_authorization', 'x-github-delivery': 'test', 'x-hub-signature-256': `sha256=${createHmac('sha256','synthetic').update(payload).digest('hex')}` } });
      expect(result.statusCode).toBe(200); expect(invalidate).toHaveBeenCalledOnce(); expect(intake).toHaveBeenCalledOnce();
    } finally { await server.close(); }
  });
  it('chains start/callback on registered 127.0.0.1 origin, consumes state, rejects foreign origin', async () => {
    const complete = vi.fn(async (_code: string, _verifier: string) => ({ userId: 1 }));
    const recordUser = vi.fn(async () => {});
    const server = createProofServer({ controlOrigin: 'http://127.0.0.1:3002', secret: 'synthetic', intake: async () => 'accepted', oauth: { authorize: (state,challenge) => `https://github.com/login/oauth/authorize?state=${state}&code_challenge=${challenge}`, complete, invalidate() {} }, recordUser });
    try {
      expect((await server.inject({ method: 'GET', url: '/rr03/oauth/start', headers: { host: 'tunnel.example' } })).statusCode).toBe(403);
      expect((await server.inject({ method: 'GET', url: '/rr03/oauth/start', headers: { host: '127.0.0.1:3002', origin: 'https://evil.example' } })).statusCode).toBe(403);
      const start = await server.inject({ method: 'GET', url: '/rr03/oauth/start', headers: { host: '127.0.0.1:3002' } });
      expect(start.statusCode).toBe(302);
      const state = new URL(String(start.headers.location)).searchParams.get('state');
      const cookie = String(start.headers['set-cookie']).split(';')[0];
      const callback = { method: 'GET' as const, url: `/rr03/oauth/callback?state=${state}&code=simulated`, headers: { host: '127.0.0.1:3002', cookie } };
      expect((await server.inject(callback)).statusCode).toBe(200);
      expect((await server.inject(callback)).statusCode).toBe(400);
      expect(complete).toHaveBeenCalledOnce(); expect(recordUser).toHaveBeenCalledOnce();
      expect(complete.mock.calls[0]?.[1]).toHaveLength(43);
    } finally { await server.close(); }
  });
  it('exposes no OAuth/control route on webhook-only listener even with spoofed local Host', async () => {
    const server = createProofServer({ webhookOnly: true, secret: 'synthetic', intake: async () => 'accepted', oauth: { authorize: () => '', complete: async () => null, invalidate() {} }, recordUser: async () => {} });
    try {
      for (const url of ['/rr03/oauth/start','/rr03/oauth/callback','/status']) expect((await server.inject({ method: 'GET', url, headers: { host: '127.0.0.1:3002' } })).statusCode).toBe(404);
    } finally { await server.close(); }
  });
  it('sends PKCE verifier to fixed token endpoint and verifies user/install association with simulated responses', async () => {
    const values = { GITHUB_APP_ID: '4990040', GITHUB_INSTALLATION_ID: '162753561', GITHUB_SANDBOX_OWNER: 'classroom-rr03-juan', GITHUB_CLIENT_ID: 'Iv23li5WIsPocsfDyGbK', GITHUB_SANDBOX_REPOSITORY: 'rr03-allowed', GITHUB_UNSELECTED_REPOSITORY: 'rr03-denied', GITHUB_APP_PRIVATE_KEY_PATH: '.local/rr03/app.private-key.pem', GITHUB_CLIENT_SECRET: 'synthetic-only', GITHUB_CALLBACK_URL: 'http://127.0.0.1:3002/rr03/oauth/callback' };
    for (const [key,value] of Object.entries(values)) vi.stubEnv(key,value);
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
      calls.push(input);
      let data;
      if (input === 'https://github.com/login/oauth/access_token') {
        expect(JSON.parse(String(init.body))).toMatchObject({ code_verifier: 'simulated-verifier', code: 'simulated-code', redirect_uri: values.GITHUB_CALLBACK_URL });
        data = { access_token: 'synthetic-memory-only', expires_in: 3600 };
      } else if (input === 'https://api.github.com/user') data = { id: 123 };
      else if (input === 'https://api.github.com/user/installations?per_page=100&page=1') data = { total_count: 1, installations: [{ id: 162753561, app_id: 4990040, account: { id: 330894124, type: 'Organization' }, suspended_at: null }] };
      else throw new Error('UNEXPECTED_SIMULATED_URL');
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    });
    try {
      const oauth = createSandboxOAuth();
      const url = new URL(oauth.authorize('state','challenge'));
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      const result = await oauth.complete('simulated-code','simulated-verifier');
      expect(result).toMatchObject({ userId: 123, installationAssociated: true, academicLinkage: false, organizationAdminAuthority: false });
      expect(JSON.stringify(result)).not.toContain('synthetic-memory-only'); expect(calls).toHaveLength(3);
    } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); }
  });
});
