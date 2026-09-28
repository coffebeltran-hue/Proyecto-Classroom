import Fastify from 'fastify';
import { OAuthStateStore, parseIntake, verifyWebhook, MAX_WEBHOOK_BYTES } from '../packages/github/src/security.js';

export interface ProofServerOptions {
  controlOrigin?: string;
  webhookOnly?: boolean;
  secret: string;
  intake: (record: ReturnType<typeof parseIntake>) => Promise<'accepted' | 'duplicate' | 'conflict'>;
  oauth: { authorize: (state: string, challenge: string) => string; complete: (code: string, verifier: string) => Promise<unknown>; invalidate: () => void };
  recordUser: (result: unknown) => Promise<void>;
}
export function createProofServer(options: ProofServerOptions) {
  if (!options.secret) throw new Error('WEBHOOK_SECRET_MISSING');
  const controlOrigin = options.controlOrigin ?? 'http://127.0.0.1:3002';
  if (!['http://127.0.0.1:3002','http://localhost:3002'].includes(controlOrigin)) throw new Error('CONTROL_ORIGIN_INVALID');
  const server = Fastify({ logger: false, bodyLimit: MAX_WEBHOOK_BYTES, requestTimeout: 20000, connectionTimeout: 20000 });
  const states = new OAuthStateStore();
  server.removeAllContentTypeParsers();
  server.addContentTypeParser('*', { parseAs: 'buffer', bodyLimit: MAX_WEBHOOK_BYTES }, (_request, body, done) => done(null, body));
  server.setErrorHandler((_error, _request, reply) => { void reply.code(400).send({ code: 'REQUEST_REJECTED' }); });
  server.addHook('onRequest', async (request, reply) => {
    reply.header('cache-control', 'no-store').header('referrer-policy', 'no-referrer').header('x-content-type-options', 'nosniff');
    if (request.url.split('?')[0] !== '/rr03/webhooks/github') {
      if (options.webhookOnly) return reply.code(404).send({ code: 'NOT_FOUND' });
      if (request.headers.host !== new URL(controlOrigin).host || (request.headers.origin !== undefined && request.headers.origin !== controlOrigin)) return reply.code(403).send({ code: 'LOCAL_ORIGIN_REQUIRED' });
    }
  });
  server.post('/rr03/webhooks/github', async (request, reply) => {
    const raw = request.body;
    if (!Buffer.isBuffer(raw) || !verifyWebhook(raw, request.headers['x-hub-signature-256'], options.secret)) return reply.code(401).send({ code: 'WEBHOOK_SIGNATURE_INVALID' });
    let receipt;
    try { receipt = parseIntake(raw, request.headers['x-github-delivery'], request.headers['x-github-event'], { appId: 4990040, installationId: 162753561 }); }
    catch { return reply.code(400).send({ code: 'WEBHOOK_INVALID' }); }
    if (receipt.event === 'github_app_authorization' || receipt.capability) options.oauth.invalidate();
    try {
      const result = await options.intake(receipt);
      return reply.code(result === 'conflict' ? 409 : 200).send({ status: result });
    } catch { return reply.code(503).send({ code: 'INTAKE_UNAVAILABLE' }); }
  });
  if (options.webhookOnly) return server;
  server.get('/rr03/oauth/start', async (_request, reply) => {
    const { state, binding, challenge } = states.issue();
    reply.header('set-cookie', `rr03_binding=${binding}; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=300`);
    return reply.redirect(options.oauth.authorize(state, challenge));
  });
  server.get('/rr03/oauth/callback', async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const bindings = (request.headers.cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith('rr03_binding='));
    reply.header('set-cookie', 'rr03_binding=; HttpOnly; SameSite=Lax; Path=/rr03/oauth; Max-Age=0');
    let verifier;
    try { verifier = states.consume(query.state, bindings.length === 1 ? bindings[0]!.slice('rr03_binding='.length) : undefined); }
    catch { return reply.code(400).send({ code: 'OAUTH_STATE_INVALID' }); }
    if (typeof query.code !== 'string' || query.code.length < 1 || query.code.length > 1000 || query.error !== undefined) return reply.code(400).send({ code: 'OAUTH_CALLBACK_REJECTED' });
    try {
      const result = await options.oauth.complete(query.code, verifier);
      await options.recordUser(result);
      return reply.send({ status: 'user-and-installation-verified', organizationAdminAuthority: false, academicLinkage: false });
    } catch { return reply.code(502).send({ code: 'OAUTH_PROOF_FAILED' }); }
  });
  return server;
}
