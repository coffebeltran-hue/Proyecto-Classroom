import { createDatabase, createAuthRepository } from '@classroom/database';
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

function environmentMode(
  value: string | undefined,
): 'development' | 'test' | 'production' {
  if (
    value === 'development' ||
    value === 'test' ||
    value === 'production'
  ) {
    return value;
  }

  throw new Error('Invalid NODE_ENV');
}

let app: ReturnType<typeof createApp> | undefined;
let database: ReturnType<typeof createDatabase> | undefined;

try {
  const listenPort = port(process.env.PORT);

  database = createDatabase(process.env.DATABASE_URL);

  const auth = createAuthRepository(database.pool);

  const githubAuth = createGitHubAuth({
    clientId: requiredEnvironment('AUTH_GITHUB_CLIENT_ID'),
    clientSecret: requiredEnvironment('AUTH_GITHUB_CLIENT_SECRET'),
    callbackUrl: requiredEnvironment('AUTH_GITHUB_CALLBACK_URL'),
  });

  const frontendOrigin = requiredEnvironment('FRONTEND_ORIGIN');

  const mode = environmentMode(process.env.NODE_ENV);
  const secureCookies = mode === 'production';

  app = createApp({
    auth,
    githubAuth,
    frontendOrigin,
    secureCookies,
  });

  const close = async () => {
    await app?.close();
    await database?.close();
  };

  process.once('SIGINT', close);
  process.once('SIGTERM', close);

  await app.listen({
    port: listenPort,
    host: '127.0.0.1',
  });

  console.log(
    `API listening on http://127.0.0.1:${listenPort}`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? `API startup failed: ${error.message}`
      : 'API startup failed',
  );

  await app?.close().catch(() => {});
  await database?.close().catch(() => {});

  process.exitCode = 1;
}
