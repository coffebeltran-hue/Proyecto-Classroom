import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'] }, resolve: { alias: { '@classroom/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)) } } });
