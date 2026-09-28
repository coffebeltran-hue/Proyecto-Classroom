// Isolated experimental worker. Credentials arrive through private IPC, not argv/files.
import pg from 'pg';
import { randomUUID } from 'node:crypto';
let db, origin, backendPid, inTransaction = false;
const latches = new Map();
function ensure(value, message) { if (!value) throw new Error(message); }
async function phase(name, options) {
  process.send({ type: 'phase', name, key: options.key, pid: process.pid });
  if (options.pause === name) await new Promise(resolve => latches.set(name, resolve));
}
async function tx(fn) {
  ensure(!inTransaction, 'NESTED_TRANSACTION'); await db.query('BEGIN'); inTransaction = true;
  try { const result = await fn(); await db.query('COMMIT'); return result; }
  catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { inTransaction = false; }
}
async function audit(event, key, detail = {}, unique = randomUUID()) {
  await db.query('INSERT INTO audit(event_key,event,subject,detail,worker_pid) VALUES($1,$2,$3,$4,$5) ON CONFLICT(event_key) DO NOTHING', [unique, event, key, detail, process.pid]);
}
async function subject(key) { return (await db.query('SELECT * FROM subject WHERE key=$1', [key])).rows[0]; }
async function watch(key) { await db.query('INSERT INTO watch(subject) VALUES($1) ON CONFLICT(subject) DO UPDATE SET active=true', [key]); }
async function io(method, key, body = {}, options = {}) {
  ensure(options.bypassTxGuard || !inTransaction, 'NETWORK_WITH_OPEN_TRANSACTION');
  const url = new URL(`/subject/${encodeURIComponent(key)}`, origin);
  ensure(url.hostname === '127.0.0.1' && url.origin === origin && url.protocol === 'http:', 'LOOPBACK_ONLY');
  if (method !== 'GET' && !options.bypassIntent) {
    const a = (await db.query('SELECT * FROM attempt WHERE id=$1', [body.attemptId])).rows[0];
    ensure(a && a.subject === key && a.state === 'possibly_issued', 'DURABLE_INTENT_REQUIRED');
  }
  const callId = body.attemptId || randomUUID();
  await audit('IO_BEGIN', key, { method, callId, transactionOpen: inTransaction });
  const controller = new AbortController();
  if (options.controlledTimeout) latches.set('abortIO', () => controller.abort());
  const timer = setTimeout(() => controller.abort(), 15000); // watchdog, not settlement
  process.send({ type: 'phase', name: 'io-start', key, callId, pid: process.pid });
  try {
    const response = await fetch(url, { method, redirect: 'error', signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-db-pid': String(backendPid), 'x-call-id': callId },
      ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) });
    ensure(response.status === 200, `PROVIDER_${response.status}`); return await response.json();
  } finally { clearTimeout(timer); latches.delete('abortIO'); }
}
async function prepare(key, id, generation, action, options = {}) {
  return tx(async () => {
    const s = (await db.query('SELECT * FROM subject WHERE key=$1 FOR UPDATE', [key])).rows[0];
    ensure(s && s.generation === generation, 'GENERATION_CONFLICT');
    ensure(action !== 'grant' || s.desired === 'GRANTED', 'GRANT_REVOKED');
    const insert = await db.query("INSERT INTO attempt(id,subject,generation,action,state) VALUES($1,$2,$3,$4,'prepared') ON CONFLICT DO NOTHING RETURNING id", [id, key, generation, action]);
    if (insert.rowCount) await audit('INTENT_PREPARED', key, { id, generation, action, requester: 'authorized-test-controller' });
    await phase('beforeIntentCommit', options); return insert.rowCount;
  });
}
async function dispatch(key, id, generation, action) {
  return tx(async () => {
    const s = (await db.query('SELECT * FROM subject WHERE key=$1 FOR UPDATE', [key])).rows[0];
    if (s.generation !== generation || (action === 'grant' && s.desired !== 'GRANTED') || (action !== 'grant' && s.desired !== 'REVOKED')) return false;
    const claim = await db.query("UPDATE attempt SET state='possibly_issued',updated_at=clock_timestamp() WHERE id=$1 AND state='prepared' RETURNING id", [id]);
    if (claim.rowCount) await audit('DISPATCH_DURABLE', key, { id, generation, action }); return !!claim.rowCount;
  });
}
async function complete(id, options = {}) {
  return tx(async () => {
    const hint = (await db.query('SELECT subject FROM attempt WHERE id=$1', [id])).rows[0]; ensure(hint,'ATTEMPT_MISSING');
    await db.query('SELECT key FROM subject WHERE key=$1 FOR UPDATE',[hint.subject]);
    const a = (await db.query('SELECT * FROM attempt WHERE id=$1 FOR UPDATE', [id])).rows[0]; ensure(a, 'ATTEMPT_MISSING');
    if (a.state === 'succeeded') return 'DUPLICATE';
    ensure(['possibly_issued', 'unknown'].includes(a.state), 'INVALID_COMPLETION');
    await db.query("UPDATE attempt SET state='succeeded',updated_at=clock_timestamp() WHERE id=$1", [id]);
    let match;
    if (options.mutateCAS) match = await db.query("UPDATE subject SET desired='GRANTED' WHERE key=$1 RETURNING key", [a.subject]);
    else match = await db.query('UPDATE subject SET version=version+1 WHERE key=$1 AND generation=$2 RETURNING key', [a.subject, a.generation]);
    const result = match.rowCount ? 'CURRENT' : 'STALE';
    await audit('COMPLETION_' + result, a.subject, { id, generation: a.generation, action: a.action }, `completion:${id}`);
    await watch(a.subject); return result;
  });
}
async function grant(o) {
  const s = await subject(o.key), generation = o.generation ?? s.generation;
  await prepare(o.key, o.id, generation, 'grant', o); await phase('afterPrepared', o);
  if (!await dispatch(o.key, o.id, generation, 'grant')) return { dispatch: false };
  await phase('afterIntent', o);
  const current = await subject(o.key);
  if (current.generation !== generation || current.desired !== 'GRANTED') {
    await db.query("UPDATE attempt SET state='definitive_no_effect' WHERE id=$1", [o.id]);
    await audit('CANCELLED_BEFORE_IO', o.key, { id: o.id }); return { dispatch: false };
  }
  try {
    const response = await io('PUT', o.key, { attemptId: o.id }, o); await phase('afterResponse', o);
    const result = await complete(o.id, o); await phase('afterCompletion', o); return { result, response };
  } catch(error) {
    await tx(async () => { await db.query("UPDATE attempt SET state='unknown',updated_at=clock_timestamp() WHERE id=$1 AND state<>'succeeded'", [o.id]); await audit('OUTCOME_UNKNOWN', o.key, { id:o.id, reason:error.message }); await watch(o.key); });
    return { outcome: 'UNKNOWN', reason: error.message };
  }
}
async function revoke(o) {
  const result = await tx(async () => {
    const s = await subject(o.key);
    const r = await db.query("UPDATE subject SET desired='REVOKED',generation=generation+1,version=version+1,academic=false,cleanup='pending' WHERE key=$1 AND generation=$2 RETURNING *", [o.key, o.generation ?? s.generation]);
    ensure(r.rowCount === 1, 'REVOKE_CAS'); await audit('REVOKE', o.key, { generation:r.rows[0].generation, requester:'authorized-test-controller' });
    await watch(o.key); await db.query('INSERT INTO outbox(subject,generation) VALUES($1,$2)', [o.key,r.rows[0].generation]); return r.rows[0];
  }); await phase('afterRevoke', o); return result;
}
async function remove(o, generation, kind, invitationId) {
  const latest=await subject(o.key); if(latest.generation!==generation||latest.desired!=='REVOKED')return;
  const id = o.removalId || randomUUID();
  await prepare(o.key,id,generation,'remove_' + kind,o);
  if (!await dispatch(o.key,id,generation,'remove_' + kind)) return;
  await io('DELETE',o.key,{ attemptId:id,kind,invitationId },o);
  await phase('afterRemoveResponse',o); await complete(id); return id;
}
async function reconcile(o) {
  const s = await subject(o.key); ensure(s,'SUBJECT_MISSING');
  const unresolved = (await db.query("SELECT id,generation,action,state FROM attempt WHERE subject=$1 AND state IN ('possibly_issued','unknown')",[o.key])).rows;
  await audit('DISCOVER',o.key,{ unresolved, generation:s.generation });
  try {
    let observed = await io('GET',o.key,{},o);
    await audit('OBSERVATION',o.key,{ observed,generation:s.generation });
    await phase('afterObservation',o);
    if (s.desired === 'REVOKED') {
      for (const invitation of observed.invitations) await remove(o,s.generation,'invitation',invitation);
      if (observed.member) await remove(o,s.generation,'member');
      observed = await io('GET',o.key,{},o);
    }
    return await tx(async () => {
      const uncertain = Number((await db.query("SELECT count(*) AS n FROM attempt WHERE subject=$1 AND action='grant' AND state IN ('possibly_issued','unknown')",[o.key])).rows[0].n);
      const absent = !observed.member && observed.invitations.length===0;
      const cleanup = s.desired==='REVOKED' && absent && uncertain===0 ? 'observed_absent' : 'pending';
      const updated = await db.query('UPDATE subject SET observed=$1,observed_at=clock_timestamp(),cleanup=$2,version=version+1 WHERE key=$3 AND generation=$4 RETURNING key',[observed,cleanup,o.key,s.generation]);
      await audit(updated.rowCount?'RECONCILED':'STALE_OBSERVATION',o.key,{ generation:s.generation,observed,uncertain,cleanup:updated.rowCount?cleanup:'not-applied' });
      if (updated.rowCount && cleanup==='observed_absent') await db.query('UPDATE watch SET active=false WHERE subject=$1',[o.key]);
      else await watch(o.key);
      return { cleanup:updated.rowCount?cleanup:'STALE',uncertain,observed };
    });
  } catch(error) {
    await tx(async()=>{await db.query("UPDATE subject SET cleanup='blocked' WHERE key=$1 AND generation=$2",[o.key,s.generation]); await watch(o.key); await audit('BLOCKED',o.key,{ reason:error.message,generation:s.generation });});
    return {cleanup:'blocked',reason:error.message};
  }
}
async function scan(o={}) {
  if(o.mutateWatch)return [];
  // Keyset cursor is durable; wrap when exhausted. Outbox retention is not required.
  const cursor=(await db.query('SELECT cursor FROM sweep WHERE id=1')).rows[0].cursor;
  const sql="SELECT s.key FROM subject s WHERE s.key>$1 AND (EXISTS(SELECT 1 FROM watch w WHERE w.subject=s.key AND w.active) OR EXISTS(SELECT 1 FROM attempt a WHERE a.subject=s.key AND a.state IN ('possibly_issued','unknown'))) ORDER BY s.key LIMIT 100";
  let rows=(await db.query(sql,[cursor])).rows;
  if(!rows.length)rows=(await db.query(sql,[''])).rows;
  await db.query('UPDATE sweep SET cursor=$1 WHERE id=1',[rows.at(-1)?.key||'']);
  await audit('SWEEP',null,{ subjects:rows.map(r=>r.key) });return rows.map(r=>r.key);
}
async function command(o) {
  if(o.op==='seed')return tx(async()=>{await db.query("INSERT INTO subject(key,desired,generation,academic,cleanup) VALUES($1,'GRANTED',1,false,'pending')",[o.key]);await watch(o.key);await audit('GRANT_REQUESTED',o.key,{generation:1,requester:'authorized-test-controller'});});
  if(o.op==='grant')return grant(o);
  if(o.op==='revoke')return revoke(o);
  if(o.op==='complete')return complete(o.id,o);
  if(o.op==='reconcile')return reconcile(o);
  if(o.op==='scan')return scan(o);
  if(o.op==='regrant')return tx(async()=>{const r=await db.query("UPDATE subject SET desired='GRANTED',generation=generation+1,version=version+1,cleanup='pending' WHERE key=$1 RETURNING *",[o.key]);await watch(o.key);await audit('REGRANT_REQUESTED',o.key,{generation:r.rows[0].generation});return r.rows[0];});
  if(o.op==='repeatRemoval'){const s=await subject(o.key);return remove(o,s.generation,'member');}
  if(o.op==='exhaust'){await db.query('DELETE FROM outbox WHERE subject=$1',[o.key]);await db.query('UPDATE watch SET failures=8 WHERE subject=$1',[o.key]);return audit('TASK_BUDGET_EXHAUSTED',o.key);}
  if(o.op==='unsafeIntent')return io('PUT',o.key,{attemptId:'missing'},o);
  if(o.op==='unsafeTransaction')return tx(()=>io('GET',o.key,{},o));
  throw new Error('UNKNOWN_COMMAND');
}
process.on('message',async message=>{
  if(message.type==='release'){const release=latches.get(message.name);if(release){latches.delete(message.name);release()}return;}
  if(message.type==='init'){
    try{origin=message.origin;ensure(new URL(origin).hostname==='127.0.0.1','LOOPBACK_ONLY');db=new pg.Client(message.database);db.on('error',()=>{});await db.connect();backendPid=(await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;await audit('WORKER_START',null,{pid:process.pid,backendPid});const discovered=await scan();process.send({type:'ready',pid:process.pid,backendPid,discovered});}
    catch{process.send({type:'init-error'});process.exitCode=1;}return;
  }
  if(message.type==='command'){
    try{const result=await command(message.options);process.send({type:'result',id:message.id,result});}
    catch(error){process.send({type:'result',id:message.id,error:error.message});}
  }
});
