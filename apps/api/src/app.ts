import Fastify from 'fastify';
import { liveness } from '@classroom/shared';
import type { createAuthRepository } from '@classroom/database';
import type { createGitHubAuth } from '@classroom/github';

import {
  SESSION_COOKIE,
  OAUTH_COOKIE,
  createOAuthSecrets,
  encodeOAuthCookie,
  decodeOAuthCookie,
  readCookie,
  serializeCookie,
  clearCookie,
  validState,
  validOAuthCode,
  validOpaqueToken,
  validOrigin,
} from './auth-http.js';

type AuthRepository = ReturnType<typeof createAuthRepository>;
type GitHubAuth = ReturnType<typeof createGitHubAuth>;

export interface AppDependencies {
  auth: AuthRepository;
  githubAuth: GitHubAuth;
  frontendOrigin: string;
  secureCookies: boolean;
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  const loopback =
    url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost';

  if (
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && loopback)) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.origin === 'null'
  ) {
    throw new Error('FRONTEND_ORIGIN_INVALID');
  }

  return url.origin;
}

export function createApp(dependencies?: AppDependencies) {
  const app = Fastify({ logger: false });

  app.get('/health/live', async () => liveness);

  /*
   * Keeping dependencies optional preserves the process-liveness app used
   * by existing infrastructure checks. Auth routes only exist when the
   * product auth dependencies are explicitly supplied.
   */
  if (!dependencies) {
    return app;
  }

  const {
    auth,
    githubAuth,
    secureCookies,
  } = dependencies;

  const frontendOrigin = normalizeOrigin(dependencies.frontendOrigin);

  app.setErrorHandler((error, _request, reply) => {
    if (
      error instanceof Error &&
      error.message === 'AUTH_STORAGE_UNAVAILABLE'
    ) {
      return reply.code(503).send({
        error: 'AUTH_UNAVAILABLE',
      });
    }

    return reply.code(500).send({
      error: 'INTERNAL_ERROR',
    });
  });

  app.get('/auth/github', async (_request, reply) => {
    const {
      state,
      binding,
      verifier,
      challenge,
    } = createOAuthSecrets();

    await auth.createOAuthAttempt(state, binding);

    const authorizationUrl = githubAuth.createAuthorizationUrl({
      state,
      challenge,
    });

    reply.header(
      'set-cookie',
      serializeCookie(
        OAUTH_COOKIE,
        encodeOAuthCookie(binding, verifier),
        {
          secure: secureCookies,
          path: '/auth/github/callback',
          maxAge: 10 * 60,
        },
      ),
    );

    return reply.redirect(authorizationUrl);
  });

  app.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
    };
  }>('/auth/github/callback', async (request, reply) => {
    const clearOAuth = clearCookie(
      OAUTH_COOKIE,
      secureCookies,
      '/auth/github/callback',
    );

    /*
     * The provider may return an OAuth error instead of a code.
     * Do not reflect provider-controlled error text back to the browser.
     */
    if (request.query.error) {
      reply.header('set-cookie', clearOAuth);
      return reply.code(400).send({
        error: 'GITHUB_AUTHORIZATION_FAILED',
      });
    }

    const { state, code } = request.query;

    if (!validState(state) || !validOAuthCode(code)) {
      reply.header('set-cookie', clearOAuth);
      return reply.code(400).send({
        error: 'OAUTH_CALLBACK_INVALID',
      });
    }

    const oauthCookie = decodeOAuthCookie(
      readCookie(request.headers.cookie, OAUTH_COOKIE),
    );

    if (!oauthCookie) {
      reply.header('set-cookie', clearOAuth);
      return reply.code(400).send({
        error: 'OAUTH_CALLBACK_INVALID',
      });
    }

    /*
     * Claim the state before provider I/O.
     * Replays and concurrent callbacks therefore fail closed.
     */
    const consumed = await auth.consumeOAuthAttempt(
      state,
      oauthCookie.binding,
    );

    if (!consumed) {
      reply.header('set-cookie', clearOAuth);
      return reply.code(400).send({
        error: 'OAUTH_CALLBACK_INVALID',
      });
    }

    let identity;

    try {
      identity = await githubAuth.exchangeCode({
        code,
        verifier: oauthCookie.verifier,
      });
    } catch {
      reply.header('set-cookie', clearOAuth);
      return reply.code(502).send({
        error: 'GITHUB_AUTHENTICATION_FAILED',
      });
    }

    const user = await auth.resolveGitHubIdentity({
      githubUserId: identity.id,
      login: identity.login,
      avatarUrl: identity.avatarUrl,
    });

    const session = await auth.createSession(user.userId);

    reply.header('set-cookie', [
      clearOAuth,
      serializeCookie(SESSION_COOKIE, session.secret, {
        secure: secureCookies,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        expires: session.expiresAt,
      }),
    ]);

    return reply.redirect(`${frontendOrigin}/`);
  });

  app.get('/me', async (request, reply) => {
    const secret = readCookie(
      request.headers.cookie,
      SESSION_COOKIE,
    );

    if (!validOpaqueToken(secret)) {
      if (secret) {
        reply.header(
          'set-cookie',
          clearCookie(SESSION_COOKIE, secureCookies),
        );
      }

      return reply.code(401).send({
        error: 'UNAUTHENTICATED',
      });
    }

    const user = await auth.findSession(secret);

    if (!user) {
      reply.header(
        'set-cookie',
        clearCookie(SESSION_COOKIE, secureCookies),
      );

      return reply.code(401).send({
        error: 'UNAUTHENTICATED',
      });
    }

    /*
     * BigInt is deliberately converted to a string at the HTTP boundary.
     * GitHub login is presentation data, not the stable external key.
     */
    return {
      user: {
        id: user.userId,
        github: {
          id: user.githubUserId.toString(),
          login: user.login,
          avatarUrl: user.avatarUrl,
        },
        academicIdentity: null,
      },
    };
  });

  app.post('/auth/logout', async (request, reply) => {
    if (
      !validOrigin(
        request.headers.origin,
        frontendOrigin,
      )
    ) {
      return reply.code(403).send({
        error: 'ORIGIN_FORBIDDEN',
      });
    }

    const secret = readCookie(
      request.headers.cookie,
      SESSION_COOKIE,
    );

    if (validOpaqueToken(secret)) {
      await auth.revokeSession(secret);
    }

    reply.header(
      'set-cookie',
      clearCookie(SESSION_COOKIE, secureCookies),
    );

    return reply.code(204).send();
  });

  return app;
}
