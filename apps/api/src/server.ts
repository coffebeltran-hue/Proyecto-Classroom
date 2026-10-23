import { createApp } from './app.js';

const app = createApp();

app.get('/me', async (_request, reply) =>
  reply.code(503).send({
    error: 'SERVICE_CONFIGURATION_REQUIRED',
  }),
);

app.all('/auth/*', async (_request, reply) =>
  reply.code(503).send({
    error: 'SERVICE_CONFIGURATION_REQUIRED',
  }),
);

app.all('/admin/*', async (_request, reply) =>
  reply.code(503).send({
    error: 'SERVICE_CONFIGURATION_REQUIRED',
  }),
);

await app.listen({
  port: Number(process.env.PORT ?? 3000),
});
