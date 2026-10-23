import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health/live', async () => {
  return {
    status: 'alive',
    scope: 'vercel-minimal-test',
  };
});

export default app;
