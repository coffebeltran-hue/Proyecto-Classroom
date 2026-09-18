import Fastify from 'fastify';
import { liveness } from '@classroom/shared';
export function createApp() {
  const app = Fastify({ logger: false });
  app.get('/health/live', async () => liveness);
  return app;
}
