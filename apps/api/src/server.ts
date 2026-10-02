import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health/live', async () => {
  return {
    status: 'alive',
    scope: 'vercel-minimal-test'
  };
});

const port = Number(process.env.PORT ?? '3000');

await app.listen({
  port,
  host: '0.0.0.0'
});

export default app;
