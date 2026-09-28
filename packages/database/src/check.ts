import { sql } from 'drizzle-orm';
import { createDatabase } from './index.js';
let database: ReturnType<typeof createDatabase> | undefined;
try {
  database = createDatabase(process.env.DATABASE_URL);
  await database.db.execute(sql`SELECT 1 AS connection_check`);
  console.log('Database connection check passed (SELECT only)');
} catch (error) {
  console.error(error instanceof Error && error.message === 'Invalid DATABASE_URL' ? error.message : 'Database connection check failed');
  process.exitCode = 1;
} finally { await database?.close(); }

