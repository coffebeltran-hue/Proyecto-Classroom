import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'postgresql', schema: './packages/database/rr03/schema.ts', out: './packages/database/rr03/migrations' });
