import { Pool } from 'pg';

import { createInstitutionAccessRepository } from '../../../packages/database/src/access.js';
import { createAdminRepository } from '../../../packages/database/src/admin.js';
import { createAuthRepository } from '../../../packages/database/src/auth.js';
import { createGitHubAuth } from '../../../packages/github/src/index.js';

import { createApp } from './app.js';

console.log('[BOOT] server.ts loaded');

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

let app: ReturnType<typeof createApp> | undefined;

try {
  console.log('[BOOT] environment presence', {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_GITHUB_CLIENT_ID: Boolean(
      process.env.AUTH_GITHUB_CLIENT_ID,
    ),
    AUTH_GITHUB_CLIENT_SECRET: Boolean(
      process.env.AUTH_GITHUB_CLIENT_SECRET,
    ),
    AUTH_GITHUB_CALLBACK_URL: Boolean(
      process.env.AUTH_GITHUB_CALLBACK_URL,
    ),
    FRONTEND_ORIGIN: Boolean(
      process.env.FRONTEND_ORIGIN,
    ),
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  });

  console.log('[BOOT] reading DATABASE_URL');
  const databaseUrl = requiredEnvironment('DATABASE_URL');

  console.log('[BOOT] creating postgres pool');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
    statement_timeout: 5000,
    query_timeout: 6000,
  });

  console.log('[BOOT] creating repositories');
  const auth = createAuthRepository(pool);
  const access = createInstitutionAccessRepository(pool);
  const admin = createAdminRepository(pool);

  console.log('[BOOT] creating GitHub auth');
  const githubAuth = createGitHubAuth({
    clientId: requiredEnvironment(
      'AUTH_GITHUB_CLIENT_ID',
    ),
    clientSecret: requiredEnvironment(
      'AUTH_GITHUB_CLIENT_SECRET',
    ),
    callbackUrl: requiredEnvironment(
      'AUTH_GITHUB_CALLBACK_URL',
    ),
  });

  console.log('[BOOT] creating Fastify app');
  app = createApp({
    auth,
    access,
    admin,
    githubAuth,
    frontendOrigin: requiredEnvironment(
      'FRONTEND_ORIGIN',
    ),
    secureCookies: true,
    defaultInstitutionSlug: 'unisabana',
  });

  const port = Number(process.env.PORT ?? '3000');

  console.log('[BOOT] starting Fastify', {
    port,
  });

  await app.listen({
    port,
    host: '0.0.0.0',
  });

  console.log('[BOOT] Fastify listening');
} catch (error) {
  console.error(
    '[BOOT] FAILED',
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : String(error),
  );

  throw error;
}

export default app;
