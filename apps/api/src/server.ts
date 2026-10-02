import {
  createDatabase,
  createAdminRepository,
  createAuthRepository,
  createInstitutionAccessRepository,
} from '@classroom/database';
import { createGitHubAuth } from '@classroom/github';
import { port } from '@classroom/shared';

import { createApp } from './app.js';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

const database = createDatabase(process.env.DATABASE_URL);

const auth = createAuthRepository(database.pool);
const access = createInstitutionAccessRepository(database.pool);
const admin = createAdminRepository(database.pool);

const githubAuth = createGitHubAuth({
  clientId: requiredEnvironment('AUTH_GITHUB_CLIENT_ID'),
  clientSecret: requiredEnvironment('AUTH_GITHUB_CLIENT_SECRET'),
  callbackUrl: requiredEnvironment(
    'AUTH_GITHUB_CALLBACK_URL',
  ),
});

const frontendOrigin = requiredEnvironment(
  'FRONTEND_ORIGIN',
);

const app = createApp({
  auth,
  access,
  admin,
  githubAuth,
  frontendOrigin,
  secureCookies: true,
  defaultInstitutionSlug: 'unisabana',
});

await app.listen({
  port: port(process.env.PORT),
  host: '0.0.0.0',
});

export default app;
