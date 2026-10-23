import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health/live', async () => ({
  status: 'alive',
  scope: 'vercel-fastify',
}));

app.listen({
  port: Number(process.env.PORT ?? 3000),
});
