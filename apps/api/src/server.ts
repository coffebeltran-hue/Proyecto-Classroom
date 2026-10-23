import {
  createDatabase,
  createAdminRepository,
  createAuthRepository,
  createInstitutionAccessRepository,
} from '@classroom/database';
import { createGitHubAuth } from '@classroom/github';

import { createApp } from './app.js';

const requiredEnvironmentNames = [
  'DATABASE_URL',
  'AUTH_GITHUB_CLIENT_ID',
  'AUTH_GITHUB_CLIENT_SECRET',
  'AUTH_GITHUB_CALLBACK_URL',
  'FRONTEND_ORIGIN',
] as const;

function requiredEnvironment(name: (typeof requiredEnvironmentNames)[number]) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

const missingEnvironment = requiredEnvironmentNames.filter(
  name => !process.env[name]?.trim(),
);

let database: ReturnType<typeof createDatabase> | undefined;

const app =
  missingEnvironment.length === 0
    ? (() => {
        database = createDatabase(requiredEnvironment('DATABASE_URL'));

        const auth = createAuthRepository(database.pool);
        const access = createInstitutionAccessRepository(database.pool);
        const admin = createAdminRepository(database.pool);

        const githubAuth = createGitHubAuth({
          clientId: requiredEnvironment('AUTH_GITHUB_CLIENT_ID'),
          clientSecret: requiredEnvironment('AUTH_GITHUB_CLIENT_SECRET'),
          callbackUrl: requiredEnvironment('AUTH_GITHUB_CALLBACK_URL'),
        });

        return createApp({
          auth,
          access,
          admin,
          githubAuth,
          frontendOrigin: requiredEnvironment('FRONTEND_ORIGIN'),
          secureCookies:
            process.env.VERCEL_ENV === 'production' ||
            process.env.NODE_ENV === 'production',
          defaultInstitutionSlug: 'unisabana',
        });
      })()
    : (() => {
        const fallback = createApp();

        fallback.get('/me', async (_request, reply) =>
          reply.code(503).send({
            error: 'SERVICE_CONFIGURATION_REQUIRED',
          }),
        );

        fallback.all('/auth/*', async (_request, reply) =>
          reply.code(503).send({
            error: 'SERVICE_CONFIGURATION_REQUIRED',
          }),
        );

        fallback.all('/admin/*', async (_request, reply) =>
          reply.code(503).send({
            error: 'SERVICE_CONFIGURATION_REQUIRED',
          }),
        );

        return fallback;
      })();

const close = async () => {
  await app.close().catch(() => {});
  await database?.close().catch(() => {});
};

process.once('SIGINT', close);
process.once('SIGTERM', close);

await app.listen({
  port: Number(process.env.PORT ?? 3000),
});
