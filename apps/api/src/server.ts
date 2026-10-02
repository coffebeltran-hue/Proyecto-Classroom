console.log('[BOOT 0] server.ts entered');

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

let app: any;

try {
  console.log('[BOOT 1] importing pg');
  const { Pool } = await import('pg');
  console.log('[BOOT 1] pg OK');

  console.log('[BOOT 2] importing auth repository');
  const { createAuthRepository } =
    await import('../../../packages/database/src/auth.js');
  console.log('[BOOT 2] auth repository OK');

  console.log('[BOOT 3] importing access repository');
  const { createInstitutionAccessRepository } =
    await import('../../../packages/database/src/access.js');
  console.log('[BOOT 3] access repository OK');

  console.log('[BOOT 4] importing admin repository');
  const { createAdminRepository } =
    await import('../../../packages/database/src/admin.js');
  console.log('[BOOT 4] admin repository OK');

  console.log('[BOOT 5] importing GitHub module');
  const { createGitHubAuth } =
    await import('../../../packages/github/src/index.js');
  console.log('[BOOT 5] GitHub module OK');

  console.log('[BOOT 6] importing app');
  const { createApp } =
    await import('./app.js');
  console.log('[BOOT 6] app OK');

  console.log('[BOOT 7] checking environment', {
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
  });

  const databaseUrl = requiredEnvironment('DATABASE_URL');

  console.log('[BOOT 8] creating pool');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
    statement_timeout: 5000,
    query_timeout: 6000,
  });

  console.log('[BOOT 9] creating repositories');
  const auth = createAuthRepository(pool);
  const access = createInstitutionAccessRepository(pool);
  const admin = createAdminRepository(pool);

  console.log('[BOOT 10] creating GitHub auth');
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

  console.log('[BOOT 11] creating Fastify app');
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

  console.log('[BOOT 12] calling listen', { port });

  await app.listen({
    port,
    host: '0.0.0.0',
  });

  console.log('[BOOT 13] listening');
} catch (error) {
  console.error(
    '[BOOT FAILED]',
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
