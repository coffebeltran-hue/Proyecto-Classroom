import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/e2e', use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium' }, webServer: [
  { command: 'npm run dev:api', url: 'http://127.0.0.1:3001/health/live', reuseExistingServer: false, env: { PORT: '3001' } },
  { command: 'npm run dev:web', url: 'http://127.0.0.1:5173', reuseExistingServer: false }
] });
