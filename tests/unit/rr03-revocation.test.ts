import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserRevocationProbe, type RevocationObservation } from '../../packages/github/src/index.js';
import { createRevocationServer } from '../../scripts/rr03-revocation-server.js';

const syntheticToken = 'SYNTHETIC_TOKEN_MUST_NOT_BE_SERIALIZED';
beforeEach(() => {
  const values = { GITHUB_APP_ID: '4990040', GITHUB_INSTALLATION_ID: '162753561', GITHUB_SANDBOX_OWNER: 'classroom-rr03-juan', GITHUB_CLIENT_ID: 'Iv23li5WIsPocsfDyGbK', GITHUB_SANDBOX_REPOSITORY: 'rr03-allowed', GITHUB_UNSELECTED_REPOSITORY: 'rr03-denied', GITHUB_APP_PRIVATE_KEY_PATH: '.local/rr03/app.private-key.pem', GITHUB_CLIENT_SECRET: 'synthetic-secret', GITHUB_CALLBACK_URL: 'http://127.0.0.1:3002/rr03/oauth/callback' };
  for (const [key,value] of Object.entries(values)) vi.stubEnv(key,value);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function simulate(statuses: number[]) {
  let exchanges = 0;
  const authorizations: string[] = [];
  vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
    if (input === 'https://github.com/login/oauth/access_token') {
      exchanges++;
      expect(JSON.parse(String(init.body)).code_verifier).toBe('synthetic-verifier');
      return new Response(JSON.stringify({ access_token: syntheticToken, expires_in: 3600 }), { headers: { 'content-type': 'application/json' } });
    }
    expect(input).toBe('https://api.github.com/user');
    authorizations.push(new Headers(init.headers).get('authorization') ?? '');
    const status = statuses.shift() ?? 200;
    return new Response(JSON.stringify(status === 200 ? { id: 1 } : { message: 'Bad credentials' }), { status, headers: { 'content-type': 'application/json' } });
  });
  return { authorizations, exchanges: () => exchanges };
}

describe('RR03 isolated user revocation probe, all provider responses simulated', () => {
  it('holds same token across baseline200, transient200 and actual simulated HTTP401; never serializes or refreshes', async () => {
    vi.useFakeTimers();
    const provider = simulate([200,200,401]);
    const evidence: RevocationObservation[] = [];
    const probe = createUserRevocationProbe(async observation => { evidence.push(observation); });
    await probe.complete('synthetic-code','synthetic-verifier');
    expect(provider.authorizations).toHaveLength(1);
    await expect(probe.complete('replacement-code','synthetic-verifier')).rejects.toThrow();
    const result = probe.probeAfterManualRevocation();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await result).toBe('revoked-401');
    expect(provider.exchanges()).toBe(1);
    expect(provider.authorizations).toHaveLength(3);
    expect(new Set(provider.authorizations).size).toBe(1);
    expect(provider.authorizations[0]).toContain(syntheticToken);
    expect(evidence.map(item => item.status)).toEqual([200,'holding-static-token','probe-started',200,401,'revoked-401']);
    expect(evidence.every(item => Object.keys(item).sort().join(',') === 'at,status')).toBe(true);
    expect(JSON.stringify({ probe, evidence })).not.toContain(syntheticToken);
    await expect(probe.probeAfterManualRevocation()).rejects.toThrow();
    probe.dispose();
  });
  it('times out after60 seconds with same static token and no refresh/re-OAuth', async () => {
    vi.useFakeTimers();
    const provider = simulate([200]);
    const evidence: RevocationObservation[] = [];
    const probe = createUserRevocationProbe(async item => { evidence.push(item); });
    await probe.complete('synthetic-code','synthetic-verifier');
    const result = probe.probeAfterManualRevocation();
    await vi.advanceTimersByTimeAsync(60000);
    expect(await result).toBe('timeout');
    expect(provider.exchanges()).toBe(1);
    expect(provider.authorizations.length).toBeLessThanOrEqual(31);
    expect(new Set(provider.authorizations).size).toBe(1);
    expect(evidence.at(-1)?.status).toBe('timeout');
    await expect(probe.probeAfterManualRevocation()).rejects.toThrow();
  });
  it('discards after15 minute hold without polling or minting another token', async () => {
    vi.useFakeTimers();
    const provider = simulate([200]);
    const evidence: RevocationObservation[] = [];
    const probe = createUserRevocationProbe(async item => { evidence.push(item); });
    await probe.complete('synthetic-code','synthetic-verifier');
    await vi.advanceTimersByTimeAsync(900000);
    expect(evidence.at(-1)?.status).toBe('discarded');
    await expect(probe.probeAfterManualRevocation()).rejects.toThrow();
    expect(provider.authorizations).toHaveLength(1); expect(provider.exchanges()).toBe(1);
  });
  it('rejects failed baseline and refuses a replacement exchange', async () => {
    const provider = simulate([401]);
    const evidence: RevocationObservation[] = [];
    const probe = createUserRevocationProbe(async item => { evidence.push(item); });
    await expect(probe.complete('synthetic-code','synthetic-verifier')).rejects.toThrow();
    await expect(probe.complete('replacement','synthetic-verifier')).rejects.toThrow();
    await expect(probe.probeAfterManualRevocation()).rejects.toThrow();
    expect(provider.exchanges()).toBe(1);
    expect(evidence.map(item => item.status)).toEqual([401,'baseline-failed']);
  });
  it('uses registered local callback, consumes state once, and makes no installation claim', async () => {
    const complete = vi.fn(async (_code: string,_verifier: string) => {});
    const server = createRevocationServer({ authorize: state => `https://github.com/login/oauth/authorize?state=${state}`, complete });
    try {
      expect((await server.inject({ method: 'GET', url: '/rr03/oauth/start', headers: { host: 'public-tunnel.example' } })).statusCode).toBe(403);
      const start = await server.inject({ method: 'GET', url: '/rr03/oauth/start', headers: { host: '127.0.0.1:3002' } });
      const state = new URL(String(start.headers.location)).searchParams.get('state');
      const cookie = String(start.headers['set-cookie']).split(';')[0];
      const request = { method: 'GET' as const, url: `/rr03/oauth/callback?state=${state}&code=synthetic`, headers: { host: '127.0.0.1:3002', cookie } };
      const callback = await server.inject(request);
      expect(callback.json().status).toBe('baseline-200-token-held');
      expect(callback.body).not.toContain('installation');
      expect((await server.inject(request)).statusCode).toBe(400);
      expect(complete).toHaveBeenCalledOnce();
    } finally { await server.close(); }
  });
  it('permanently disposes and aborts an in-flight exchange; late response cannot retain a token', async () => {
    let finish!: (response: Response) => void;
    let signal: AbortSignal | null | undefined;
    const fetchMock = vi.fn((_input: string,init: RequestInit) => { signal = init.signal; return new Promise<Response>(resolve => { finish = resolve; }); });
    vi.stubGlobal('fetch',fetchMock);
    const observations: RevocationObservation[] = [];
    const probe = createUserRevocationProbe(async item => { observations.push(item); });
    const complete = probe.complete('synthetic-code','synthetic-verifier');
    probe.dispose();
    expect(signal?.aborted).toBe(true);
    finish(new Response(JSON.stringify({ access_token: syntheticToken, expires_in: 3600 }), { headers: { 'content-type':'application/json' } }));
    await expect(complete).rejects.toThrow();
    await expect(probe.complete('new-code','synthetic-verifier')).rejects.toThrow();
    await expect(probe.probeAfterManualRevocation()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(observations.map(item => item.status)).toEqual(['baseline-failed']);
    expect(JSON.stringify(observations)).not.toContain(syntheticToken);
  });
});
