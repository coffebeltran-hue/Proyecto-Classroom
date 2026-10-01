import Fastify from 'fastify';
import { liveness } from '@classroom/shared';
import type {
  createAdminRepository,
  createAuthRepository,
  createInstitutionAccessRepository,
} from '@classroom/database';
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
type InstitutionAccessRepository = ReturnType<
  typeof createInstitutionAccessRepository
>;
type AdminRepository = ReturnType<typeof createAdminRepository>;
type GitHubAuth = ReturnType<typeof createGitHubAuth>;

export interface AppDependencies {
  auth: AuthRepository;
  access: InstitutionAccessRepository;
  admin: AdminRepository;
  githubAuth: GitHubAuth;
  frontendOrigin: string;
  secureCookies: boolean;
  defaultInstitutionSlug: string;
}

function validUuid(value: string | undefined): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
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
    access,
    admin,
    githubAuth,
    secureCookies,
    defaultInstitutionSlug,
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

    if (
      error instanceof Error &&
      (
        error.message === 'ACCESS_STORAGE_UNAVAILABLE' ||
        error.message === 'ADMIN_STORAGE_UNAVAILABLE'
      )
    ) {
      return reply.code(503).send({
        error: 'SERVICE_UNAVAILABLE',
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

    const accessResult = await access.ensurePendingRequest(
      user.userId,
      defaultInstitutionSlug,
    );

    if (accessResult === 'INSTITUTION_NOT_FOUND') {
      reply.header('set-cookie', clearOAuth);

      return reply.code(503).send({
        error: 'INSTITUTION_UNAVAILABLE',
      });
    }

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

    const institutions = await auth.getUserAccessContext(
      user.userId,
    );

    const accessRequest = await access.findAccessRequest(
      user.userId,
      defaultInstitutionSlug,
    );

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
        institutions,
        accessRequest,
      },
    };
  });

  app.get<{
    Params: {
      institutionId: string;
    };
  }>(
    '/admin/institutions/:institutionId/access-requests',
    async (request, reply) => {
      const { institutionId } = request.params;

      if (!validUuid(institutionId)) {
        return reply.code(400).send({
          error: 'INVALID_INSTITUTION_ID',
        });
      }

      const secret = readCookie(
        request.headers.cookie,
        SESSION_COOKIE,
      );

      if (!validOpaqueToken(secret)) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const user = await auth.findSession(secret);

      if (!user) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const result = await admin.listPendingAccessRequests(
        user.userId,
        institutionId,
      );

      if (result.status === 'FORBIDDEN') {
        return reply.code(403).send({
          error: 'FORBIDDEN',
        });
      }

      return {
        requests: result.requests,
      };
    },
  );

  app.get<{
    Params: {
      institutionId: string;
    };
    Querystring: {
      role?: string;
    };
  }>(
    '/admin/institutions/:institutionId/members',
    async (request, reply) => {
      const { institutionId } = request.params;
      const role = request.query.role;

      if (!validUuid(institutionId)) {
        return reply.code(400).send({
          error: 'INVALID_INSTITUTION_ID',
        });
      }

      if (role !== 'TEACHER' && role !== 'STUDENT') {
        return reply.code(400).send({
          error: 'INVALID_ROLE',
        });
      }

      const secret = readCookie(
        request.headers.cookie,
        SESSION_COOKIE,
      );

      if (!validOpaqueToken(secret)) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const user = await auth.findSession(secret);

      if (!user) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const result = await admin.listInstitutionMembers(
        user.userId,
        institutionId,
        role,
      );

      if (result.status === 'FORBIDDEN') {
        return reply.code(403).send({
          error: 'FORBIDDEN',
        });
      }

      return {
        members: result.members,
      };
    },
  );

  app.post<{
    Params: {
      institutionId: string;
      requestId: string;
    };
    Body: {
      role?: string;
    };
  }>(
    '/admin/institutions/:institutionId/access-requests/:requestId/approve',
    async (request, reply) => {
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

      const { institutionId, requestId } = request.params;

      if (
        !validUuid(institutionId) ||
        !validUuid(requestId)
      ) {
        return reply.code(400).send({
          error: 'INVALID_REQUEST',
        });
      }

      const role = request.body?.role;

      if (role !== 'TEACHER' && role !== 'STUDENT') {
        return reply.code(400).send({
          error: 'INVALID_ROLE',
        });
      }

      const secret = readCookie(
        request.headers.cookie,
        SESSION_COOKIE,
      );

      if (!validOpaqueToken(secret)) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const user = await auth.findSession(secret);

      if (!user) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const result = await admin.approveAccessRequest({
        actorUserId: user.userId,
        institutionId,
        requestId,
        role,
      });

      if (result.status === 'FORBIDDEN') {
        return reply.code(403).send({
          error: 'FORBIDDEN',
        });
      }

      if (result.status === 'NOT_FOUND') {
        return reply.code(404).send({
          error: 'ACCESS_REQUEST_NOT_FOUND',
        });
      }

      if (result.status === 'ALREADY_DECIDED') {
        return reply.code(409).send({
          error: 'ACCESS_REQUEST_ALREADY_DECIDED',
        });
      }

      return {
        decision: result,
      };
    },
  );

  app.post<{
    Params: {
      institutionId: string;
      requestId: string;
    };
  }>(
    '/admin/institutions/:institutionId/access-requests/:requestId/deny',
    async (request, reply) => {
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

      const { institutionId, requestId } = request.params;

      if (
        !validUuid(institutionId) ||
        !validUuid(requestId)
      ) {
        return reply.code(400).send({
          error: 'INVALID_REQUEST',
        });
      }

      const secret = readCookie(
        request.headers.cookie,
        SESSION_COOKIE,
      );

      if (!validOpaqueToken(secret)) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const user = await auth.findSession(secret);

      if (!user) {
        return reply.code(401).send({
          error: 'UNAUTHENTICATED',
        });
      }

      const result = await admin.denyAccessRequest({
        actorUserId: user.userId,
        institutionId,
        requestId,
      });

      if (result.status === 'FORBIDDEN') {
        return reply.code(403).send({
          error: 'FORBIDDEN',
        });
      }

      if (result.status === 'NOT_FOUND') {
        return reply.code(404).send({
          error: 'ACCESS_REQUEST_NOT_FOUND',
        });
      }

      if (result.status === 'ALREADY_DECIDED') {
        return reply.code(409).send({
          error: 'ACCESS_REQUEST_ALREADY_DECIDED',
        });
      }

      return {
        decision: result,
      };
    },
  );

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
