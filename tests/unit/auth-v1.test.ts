import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../apps/api/src/app.js';
import {
  OAUTH_COOKIE,
  SESSION_COOKIE,
  encodeOAuthCookie,
} from '../../apps/api/src/auth-http.js';

const token = (character: string) => character.repeat(43);

function createDependencies() {
  const auth = {
    createOAuthAttempt: vi.fn(
      async (_state: string, _binding: string): Promise<void> => {},
    ),
    consumeOAuthAttempt: vi.fn(async () => true),
    resolveGitHubIdentity: vi.fn(async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      githubUserId: 123456789n,
      login: 'octocat',
      avatarUrl: 'https://example.test/avatar.png',
    })),
    createSession: vi.fn(async () => ({
      secret: token('s'),
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    findSession: vi.fn(async () => ({
      userId: '11111111-1111-4111-8111-111111111111',
      githubUserId: 123456789n,
      login: 'octocat',
      avatarUrl: 'https://example.test/avatar.png',
    })),
    revokeSession: vi.fn(async () => {}),
  };

  const githubAuth = {
    createAuthorizationUrl: vi.fn(
      ({ state, challenge }: { state: string; challenge: string }) =>
        `https://github.com/login/oauth/authorize?state=${state}&code_challenge=${challenge}`,
    ),
    exchangeCode: vi.fn(
      async (
        _input: { code: string; verifier: string },
      ): Promise<{
        id: bigint;
        login: string;
        avatarUrl: string | null;
      }> => ({
        id: 123456789n,
        login: 'octocat',
        avatarUrl: 'https://example.test/avatar.png',
      }),
    ),
  };

  return {
    auth,
    githubAuth,
    frontendOrigin: 'https://vmat.example',
    secureCookies: true,
  };
}

describe('Auth v1 HTTP boundary', () => {
  it('starts GitHub OAuth with durable attempt, PKCE and protected temporary cookie', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/github',
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(300);
      expect(response.statusCode).toBeLessThan(400);

      expect(dependencies.auth.createOAuthAttempt).toHaveBeenCalledTimes(1);
      expect(
        dependencies.githubAuth.createAuthorizationUrl,
      ).toHaveBeenCalledTimes(1);

      const [state, binding] =
        dependencies.auth.createOAuthAttempt.mock.calls[0]!;

      const authorizationInput =
        dependencies.githubAuth.createAuthorizationUrl.mock.calls[0]![0];

      expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(binding).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(authorizationInput.state).toBe(state);
      expect(authorizationInput.challenge).toMatch(
        /^[A-Za-z0-9_-]{43}$/,
      );

      const cookie = response.headers['set-cookie'];
      expect(cookie).toContain(`${OAUTH_COOKIE}=`);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('Path=/auth/github/callback');

      expect(response.headers.location).toContain(
        'https://github.com/login/oauth/authorize',
      );
    } finally {
      await app.close();
    }
  });

  it('rejects callback without valid state/code before provider exchange', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/github/callback?state=bad&code=',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: 'OAUTH_CALLBACK_INVALID',
      });

      expect(
        dependencies.auth.consumeOAuthAttempt,
      ).not.toHaveBeenCalled();

      expect(
        dependencies.githubAuth.exchangeCode,
      ).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('fails closed when state and browser binding cannot be consumed', async () => {
    const dependencies = createDependencies();
    dependencies.auth.consumeOAuthAttempt.mockResolvedValueOnce(false);

    const app = createApp(dependencies);

    try {
      const state = token('a');
      const binding = token('b');
      const verifier = token('v');

      const response = await app.inject({
        method: 'GET',
        url: `/auth/github/callback?state=${state}&code=github-code`,
        headers: {
          cookie:
            `${OAUTH_COOKIE}=` +
            encodeOAuthCookie(binding, verifier),
        },
      });

      expect(response.statusCode).toBe(400);

      expect(
        dependencies.auth.consumeOAuthAttempt,
      ).toHaveBeenCalledWith(state, binding);

      expect(
        dependencies.githubAuth.exchangeCode,
      ).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('consumes OAuth attempt before provider I/O and creates the session on success', async () => {
    const dependencies = createDependencies();

    const order: string[] = [];

    dependencies.auth.consumeOAuthAttempt.mockImplementationOnce(
      async () => {
        order.push('consume');
        return true;
      },
    );

    dependencies.githubAuth.exchangeCode.mockImplementationOnce(
      async () => {
        order.push('exchange');
        return {
          id: 123456789n,
          login: 'octocat',
          avatarUrl: null,
        };
      },
    );

    const app = createApp(dependencies);

    try {
      const state = token('a');
      const binding = token('b');
      const verifier = token('v');

      const response = await app.inject({
        method: 'GET',
        url: `/auth/github/callback?state=${state}&code=github-code`,
        headers: {
          cookie:
            `${OAUTH_COOKIE}=` +
            encodeOAuthCookie(binding, verifier),
        },
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(300);
      expect(response.statusCode).toBeLessThan(400);
      expect(order).toEqual(['consume', 'exchange']);

      expect(
        dependencies.githubAuth.exchangeCode,
      ).toHaveBeenCalledWith({
        code: 'github-code',
        verifier,
      });

      expect(
        dependencies.auth.resolveGitHubIdentity,
      ).toHaveBeenCalledWith({
        githubUserId: 123456789n,
        login: 'octocat',
        avatarUrl: null,
      });

      expect(dependencies.auth.createSession).toHaveBeenCalledTimes(1);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(String(cookies)).toContain(`${SESSION_COOKIE}=`);
      expect(String(cookies)).toContain('HttpOnly');
      expect(String(cookies)).toContain('Secure');

      expect(response.headers.location).toBe(
        'https://vmat.example/',
      );
    } finally {
      await app.close();
    }
  });

  it('rejects replay of an already consumed OAuth attempt', async () => {
    const dependencies = createDependencies();

    dependencies.auth.consumeOAuthAttempt
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const app = createApp(dependencies);

    try {
      const state = token('a');
      const binding = token('b');
      const verifier = token('v');
      const cookie =
        `${OAUTH_COOKIE}=` +
        encodeOAuthCookie(binding, verifier);

      const first = await app.inject({
        method: 'GET',
        url: `/auth/github/callback?state=${state}&code=first-code`,
        headers: { cookie },
      });

      const replay = await app.inject({
        method: 'GET',
        url: `/auth/github/callback?state=${state}&code=replay-code`,
        headers: { cookie },
      });

      expect(first.statusCode).toBeGreaterThanOrEqual(300);
      expect(first.statusCode).toBeLessThan(400);

      expect(replay.statusCode).toBe(400);
      expect(replay.json()).toEqual({
        error: 'OAUTH_CALLBACK_INVALID',
      });

      expect(
        dependencies.auth.consumeOAuthAttempt,
      ).toHaveBeenCalledTimes(2);

      expect(
        dependencies.githubAuth.exchangeCode,
      ).toHaveBeenCalledTimes(1);

      expect(
        dependencies.auth.createSession,
      ).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });

  it('fails closed after consuming OAuth state when GitHub exchange fails', async () => {
    const dependencies = createDependencies();

    dependencies.githubAuth.exchangeCode.mockRejectedValueOnce(
      new Error('provider failure'),
    );

    const app = createApp(dependencies);

    try {
      const state = token('a');
      const binding = token('b');
      const verifier = token('v');

      const response = await app.inject({
        method: 'GET',
        url: `/auth/github/callback?state=${state}&code=github-code`,
        headers: {
          cookie:
            `${OAUTH_COOKIE}=` +
            encodeOAuthCookie(binding, verifier),
        },
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        error: 'GITHUB_AUTHENTICATION_FAILED',
      });

      expect(
        dependencies.auth.consumeOAuthAttempt,
      ).toHaveBeenCalledTimes(1);

      expect(
        dependencies.auth.resolveGitHubIdentity,
      ).not.toHaveBeenCalled();

      expect(
        dependencies.auth.createSession,
      ).not.toHaveBeenCalled();

      expect(String(response.headers['set-cookie'])).toContain(
        `${OAUTH_COOKIE}=`,
      );
    } finally {
      await app.close();
    }
  });

  it('does not expose storage internals when session lookup fails', async () => {
    const dependencies = createDependencies();

    dependencies.auth.findSession.mockRejectedValueOnce(
      new Error('AUTH_STORAGE_UNAVAILABLE'),
    );

    const app = createApp(dependencies);

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          cookie: `${SESSION_COOKIE}=${token('s')}`,
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'AUTH_UNAVAILABLE',
      });

      expect(response.body).not.toContain(
        'AUTH_STORAGE_UNAVAILABLE',
      );
    } finally {
      await app.close();
    }
  });

  it('does not send malformed session tokens to storage', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          cookie: `${SESSION_COOKIE}=malformed`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'UNAUTHENTICATED',
      });

      expect(dependencies.auth.findSession).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('returns authenticated identity with GitHub bigint serialized as string', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const session = token('s');

      const response = await app.inject({
        method: 'GET',
        url: '/me',
        headers: {
          cookie: `${SESSION_COOKIE}=${session}`,
        },
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toEqual({
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          github: {
            id: '123456789',
            login: 'octocat',
            avatarUrl: 'https://example.test/avatar.png',
          },
          academicIdentity: null,
        },
      });

      expect(dependencies.auth.findSession).toHaveBeenCalledWith(
        session,
      );
    } finally {
      await app.close();
    }
  });

  it('rejects cross-origin logout without revoking the session', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          origin: 'https://evil.example',
          cookie: `${SESSION_COOKIE}=${token('s')}`,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        error: 'ORIGIN_FORBIDDEN',
      });

      expect(dependencies.auth.revokeSession).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('revokes a valid session only from the configured origin', async () => {
    const dependencies = createDependencies();
    const app = createApp(dependencies);

    try {
      const session = token('s');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          origin: 'https://vmat.example',
          cookie: `${SESSION_COOKIE}=${session}`,
        },
      });

      expect(response.statusCode).toBe(204);
      expect(dependencies.auth.revokeSession).toHaveBeenCalledWith(
        session,
      );

      expect(response.headers['set-cookie']).toContain(
        `${SESSION_COOKIE}=`,
      );
    } finally {
      await app.close();
    }
  });
});
