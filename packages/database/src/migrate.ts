import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase } from './index.js';

const database = createDatabase(process.env.DATABASE_URL);

try {
  await migrate(database.db, {
    migrationsFolder: 'packages/database/product/migrations',
  });

  console.log('Product database migrations applied successfully.');
} catch {
  console.error('Product database migration failed.');
  process.exitCode = 1;
} finally {
  await database.close();
}
