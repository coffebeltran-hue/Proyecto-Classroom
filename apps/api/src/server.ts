import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/health/live', async () => {
  return {
    status: 'alive',
    scope: 'vercel-fastify',
  };
});

fastify.listen({
  port: Number(process.env.PORT ?? 3000),
});
