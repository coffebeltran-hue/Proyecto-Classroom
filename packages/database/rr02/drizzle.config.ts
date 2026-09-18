import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './packages/database/rr02/schema.ts',
  out: './packages/database/rr02/migrations',
});
