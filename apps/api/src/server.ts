import { Pool } from 'pg';

import { createInstitutionAccessRepository } from '../../../packages/database/src/access.js';
import { createAdminRepository } from '../../../packages/database/src/admin.js';
import { createAuthRepository } from '../../../packages/database/src/auth.js';
import { createGitHubAuth } from '../../../packages/github/src/index.js';

import { createApp } from './app.js';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

const databaseUrl = requiredEnvironment('DATABASE_URL');

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 1000,
  statement_timeout: 5000,
  query_timeout: 6000,
});

const auth = createAuthRepository(pool);
const access = createInstitutionAccessRepository(pool);
const admin = createAdminRepository(pool);

const githubAuth = createGitHubAuth({
  clientId: requiredEnvironment('AUTH_GITHUB_CLIENT_ID'),
  clientSecret: requiredEnvironment(
    'AUTH_GITHUB_CLIENT_SECRET',
  ),
  callbackUrl: requiredEnvironment(
    'AUTH_GITHUB_CALLBACK_URL',
  ),
});

const app = createApp({
  auth,
  access,
  admin,
  githubAuth,
  frontendOrigin: requiredEnvironment('FRONTEND_ORIGIN'),
  secureCookies: true,
  defaultInstitutionSlug: 'unisabana',
});

const port = Number(process.env.PORT ?? '3000');

await app.listen({
  port,
  host: '0.0.0.0',
});

export default app;
