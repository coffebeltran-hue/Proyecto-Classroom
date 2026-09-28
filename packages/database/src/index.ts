import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { databaseUrl } from '@classroom/shared';
export function createDatabase(value: string | undefined) {
  const pool = new Pool({ connectionString: databaseUrl(value), max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 1000, statement_timeout: 5000, query_timeout: 6000 });
  return { db: drizzle(pool), pool, close: () => pool.end() };
}
