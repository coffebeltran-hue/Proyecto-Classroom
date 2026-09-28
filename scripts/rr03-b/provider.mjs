// Independent provider model: no access to subjects, attempts, or reconciler code.
import http from 'node:http';
import { EventEmitter } from 'node:events';
export async function startProvider(observeTransaction) {
  const events = [], bus = new EventEmitter(), states = new Map(), plans = [], holds = new Map();
  let sequence = 0;
  const log = (event, detail = {}) => { const row = { seq: ++sequence, at: new Date().toISOString(), event, ...detail }; events.push(row); bus.emit('event', row); return row; };
  const wait = (predicate) => {
    const prior = events.find(predicate); if (prior) return Promise.resolve(prior);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { bus.off('event', handler); reject(new Error('PROVIDER_BARRIER_WATCHDOG')); }, 15000);
      const handler = row => { if (predicate(row)) { clearTimeout(timer); bus.off('event', handler); resolve(row); } }; bus.on('event', handler);
    });
  };
  const barrier = async (id, phase, enabled) => {
    if (!enabled) return;
    await new Promise(resolve => { holds.set(`${id}:${phase}`, resolve); log('held', { id, phase }); });
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (!url.pathname.startsWith('/subject/')) { res.writeHead(404).end(); return; }
      const key = decodeURIComponent(url.pathname.slice(9)), id = String(req.headers['x-call-id']);
      let body = ''; for await (const chunk of req) body += chunk;
      const input = body ? JSON.parse(body) : {};
      const index = plans.findIndex(p => p.key === key && p.method === req.method);
      const plan = index < 0 ? {} : plans.splice(index, 1)[0];
      const observed = await observeTransaction(Number(req.headers['x-db-pid']));
      log('received', { id, key, method: req.method, observed });
      if (observed.xact_start !== null) { log('transaction-violation', { id, key }); res.writeHead(500).end(JSON.stringify({ error: 'OPEN_DB_TRANSACTION' })); return; }
      await barrier(id, 'apply', plan.holdApply);
      if (plan.status) { log('error', { id, key, status: plan.status }); res.writeHead(plan.status).end(JSON.stringify({ error: 'INJECTED' })); return; }
      const state = states.get(key) || { member: false, invitations: [] };
      if (req.method === 'PUT') {
        if (plan.mode === 'invitation') state.invitations.push(`invite-${id}`); else state.member = true;
        states.set(key, state); log('grant-applied', { id, key, state: structuredClone(state) });
      } else if (req.method === 'DELETE') {
        if (input.kind === 'invitation') state.invitations = state.invitations.filter(v => v !== input.invitationId);
        else state.member = false;
        states.set(key, state); log('remove-applied', { id, key, kind: input.kind, state: structuredClone(state) });
      } else if (req.method !== 'GET') { throw new Error('METHOD_NOT_SUPPORTED'); }
      const result = structuredClone(state);
      await barrier(id, 'reply', plan.holdReply);
      if (plan.dropReply) { log('response-lost', { id, key }); res.destroy(); return; }
      log('response', { id, key, state: result });
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result));
    } catch { if (!res.destroyed) res.writeHead(500).end(JSON.stringify({ error: 'PROVIDER_INTERNAL' })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    origin: `http://127.0.0.1:${server.address().port}`, events,
    plan: p => plans.push(p), wait,
    release(id, phase) { const release = holds.get(`${id}:${phase}`); if (!release) throw new Error('MISSING_PROVIDER_LATCH'); holds.delete(`${id}:${phase}`); release(); },
    state: key => structuredClone(states.get(key) || { member: false, invitations: [] }),
    async close() { for (const release of holds.values()) release(); holds.clear(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  };
}
