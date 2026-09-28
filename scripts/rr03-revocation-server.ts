import Fastify from 'fastify';
import { OAuthStateStore } from '../packages/github/src/security.js';

/** Local-only callback surface for the isolated same-token revocation experiment. */
export function createRevocationServer(probe: { authorize: (state: string, challenge: string) => string; complete: (code: string, verifier: string) => Promise<void> }) {
  const server = Fastify({ logger: false, requestTimeout: 20000, connectionTimeout: 20000, bodyLimit: 1024 });
  const states = new OAuthStateStore();
  server.setErrorHandler((_error, _request, reply) => { void reply.code(400).send({ status: 'rejected' }); });
  server.addHook('onRequest', async (request, reply) => {
    reply.header('cache-control','no-store').header('referrer-policy','no-referrer');
    if (request.headers.host !== '127.0.0.1:3002' || request.headers.origin !== undefined && request.headers.origin !== 'http://127.0.0.1:3002') return reply.code(403).send({ status: 'local-only' });
  });
  server.get('/rr03/oauth/start', async (_request, reply) => {
    const { state, binding, challenge } = states.issue();
    reply.header('set-cookie', `rr03_revocation=${binding}; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=300`);
    return reply.redirect(probe.authorize(state,challenge));
  });
  server.get('/rr03/oauth/callback', async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const bindings = (request.headers.cookie ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith('rr03_revocation='));
    reply.header('set-cookie','rr03_revocation=; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=0');
    try {
      const verifier = states.consume(query.state,bindings.length === 1 ? bindings[0]!.slice('rr03_revocation='.length) : undefined);
      if (typeof query.code !== 'string' || !query.code || query.code.length > 1000 || query.error !== undefined) return reply.code(400).send({ status: 'rejected' });
      await probe.complete(query.code,verifier);
      return reply.send({ status: 'baseline-200-token-held', next: 'Report baseline readiness; keep this process open. Do not press Enter until instructed after manual revocation. The hold expires after at most 15 minutes. Do not authorize again.' });
    } catch { return reply.code(400).send({ status: 'rejected' }); }
  });
  return server;
}
