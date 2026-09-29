import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './packages/database/product/schema.ts',
  out: './packages/database/product/migrations',
});