import { port } from '@classroom/shared';
import { createApp } from './app.js';
let app: ReturnType<typeof createApp> | undefined;
try {
  const listenPort = port(process.env.PORT);
  app = createApp();
  const close = async () => { await app?.close(); };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  await app.listen({ port: listenPort, host: '127.0.0.1' });
  console.log(`API listening on http://127.0.0.1:${listenPort} (process liveness only)`);
} catch (error) {
  console.error(error instanceof Error && error.message === 'Invalid PORT' ? error.message : 'API startup failed');
  await app?.close();
  process.exitCode = 1;
}
