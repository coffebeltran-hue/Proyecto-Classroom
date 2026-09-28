import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { startProvider } from './provider.mjs';

const run = `rr03b_${Date.now()}_${randomBytes(3).toString('hex')}`;
const reviews = '_bmad-output/planning-artifacts/architecture/architecture-Proyecto-Desarrollo-2026-09-11/reviews';
const evidencePath = `${reviews}/rr03-evidence/${run}.json`;
const evidence = { run, status:'running', source:'isolated local PostgreSQL + loopback provider + real child process crashes', checks:[], processEvents:[], negativeControls:[], transactionObservations:[], sourceHashes:{}, githubCalls:0 };
const workers = new Set(); let admin, fixture, provider, config;
const selected = new Set((process.env.RR03_B_SCENARIOS || '').split(',').filter(Boolean));
const save=()=>writeFile(evidencePath,JSON.stringify(evidence,null,2));
const qname=name=>{assert.match(name,/^[a-z0-9_]+$/);return '"'+name+'"'};
async function snapshot(key) { return {
  subject:(await fixture.query('SELECT * FROM subject WHERE key=$1',[key])).rows[0],
  attempts:(await fixture.query('SELECT * FROM attempt WHERE subject=$1 ORDER BY created_at,id',[key])).rows,
  audit:(await fixture.query('SELECT * FROM audit WHERE subject=$1 ORDER BY seq',[key])).rows,
  watch:(await fixture.query('SELECT * FROM watch WHERE subject=$1',[key])).rows[0],remote:provider.state(key)
}; }
async function start() {
  const child=fork(fileURLToPath(new URL('./worker.mjs',import.meta.url)),[],{execPath:process.execPath,stdio:['ignore','pipe','pipe','ipc'],env:{SystemRoot:process.env.SystemRoot,PATH:process.env.PATH},windowsHide:true});
  const messages=[], bus=new EventEmitter();let exited=false;
  child.stdout.on('data',()=>{});child.stderr.on('data',()=>{}); // never publish raw worker exceptions/configuration
  child.on('message',m=>{messages.push(m);bus.emit('message',m)});
  child.on('exit',(code,signal)=>{exited=true;evidence.processEvents.push({event:'exit',pid:child.pid,code,signal,at:new Date().toISOString()});bus.emit('exit')});
  function wait(predicate){const prior=messages.find(predicate);if(prior)return Promise.resolve(prior);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{bus.off('message',handler);reject(new Error('WORKER_BARRIER_WATCHDOG'))},15000);const handler=m=>{if(predicate(m)){clearTimeout(timer);bus.off('message',handler);resolve(m)}};bus.on('message',handler)});}
  const w={pid:child.pid,wait,
    call(options){const id=randomUUID();child.send({type:'command',id,options});return wait(m=>m.type==='result'&&m.id===id).then(m=>{if(m.error)throw new Error(m.error);return m.result})},
    release(name){child.send({type:'release',name})},
    async kill(key,window='shutdown'){if(exited)return;const ended=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGKILL');await ended;
      if(key)await fixture.query('INSERT INTO audit(event_key,event,subject,detail,worker_pid) VALUES($1,$2,$3,$4,$5)',[randomUUID(),'CONTROLLER_OBSERVED_CRASH',key,{window,pid:child.pid},child.pid]);
      workers.delete(w);
    }
  };workers.add(w);child.send({type:'init',database:config,origin:provider.origin});
  const ready=await wait(m=>m.type==='ready'||m.type==='init-error');assert.equal(ready.type,'ready');evidence.processEvents.push({event:'start',...ready,at:new Date().toISOString()});return w;
}
function pending(promise){promise.catch(()=>{});return promise;}
const phase=(w,key,name)=>w.wait(m=>m.type==='phase'&&m.key===key&&m.name===name);
const pEvent=(id,event)=>provider.wait(e=>e.id===id&&e.event===event);
async function seed(w,key){await w.call({op:'seed',key})}
async function assertRevoked(key,cleanup){const s=await snapshot(key);assert.equal(s.subject.desired,'REVOKED');assert.equal(s.subject.academic,false);if(cleanup)assert.equal(s.subject.cleanup,cleanup);return s}
async function late(key,mode,{killAtCompletion=false}={}){
  const w=await start(), control=await start();await seed(w,key);const id=key+'-grant';
  provider.plan({key,method:'PUT',holdApply:true,mode});
  const job=pending(w.call({op:'grant',key,id,...(killAtCompletion?{pause:'afterCompletion'}:{})}));
  await pEvent(id,'held');await control.call({op:'revoke',key});const before=await control.call({op:'reconcile',key});assert.equal(before.cleanup,'pending');
  provider.release(id,'apply');await pEvent(id,'grant-applied');
  if(killAtCompletion){await phase(w,key,'afterCompletion');await w.kill(key,'after stale completion persisted / before queue ack');}
  else assert.equal((await job).result,'STALE');
  const recovered=await start();await recovered.call({op:'reconcile',key});const s=await assertRevoked(key,'observed_absent');
  assert.equal(s.remote.member,false);assert.equal(s.remote.invitations.length,0);
  const events=s.audit.map(x=>x.event);for(const event of ['GRANT_REQUESTED','INTENT_PREPARED','DISPATCH_DURABLE','REVOKE','COMPLETION_STALE','DISCOVER','RECONCILED'])assert.ok(events.includes(event));
  const intent=s.audit.findIndex(x=>x.event==='DISPATCH_DURABLE'&&x.detail.id===id),io=s.audit.findIndex(x=>x.event==='IO_BEGIN'&&x.detail.callId===id);assert.ok(intent<io);
  assert.equal(await recovered.call({op:'complete',id}),'DUPLICATE');
  return {key,id,snapshot:s};
}
async function check(id,fn){if(selected.size&&!selected.has(id))return;const start=new Date().toISOString();try{const detail=await fn();evidence.checks.push({id,status:'PASS',start,finishedAt:new Date().toISOString(),detail});await save();console.log(`PASS ${id}`);}catch(error){evidence.checks.push({id,status:'FAIL',start,error:{name:error.name,message:error.message},classification:'UNKNOWN_PENDING_INSPECTION'});await save();throw error;}}
try{
  await mkdir(`${reviews}/rr03-evidence`,{recursive:true});await save();
  // Private IPC only; deliberately no historical-cluster configuration fallback.
  assert.ok(process.send,'ISOLATED_CONTROLLER_REQUIRED');
  const input=await new Promise(resolve=>{process.once('message',resolve);process.send({type:'config-ready'})});
  assert.equal(input.type,'isolated-cluster');assert.equal(input.database.host,'127.0.0.1');assert.notEqual(input.database.port,54329);
  assert.ok(input.database.port>1024&&input.database.port<65536);assert.match(input.database.user,/^rr03b_/);
  const base={...input.database,connectionTimeoutMillis:3000,statement_timeout:6000};
  evidence.isolation={port:base.port,host:base.host,logicalDirectory:input.logicalDirectory,oldClusterUsed:false};
  admin=new pg.Client({...base,database:'postgres'});await admin.connect();
  const database=run+'_db',role=run+'_worker',password=randomBytes(24).toString('hex');
  await admin.query(`CREATE ROLE ${qname(role)} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
  await admin.query(`CREATE DATABASE ${qname(database)} TEMPLATE template0`);
  await admin.query(`REVOKE ALL ON DATABASE ${qname(database)} FROM PUBLIC`);await admin.query(`GRANT CONNECT ON DATABASE ${qname(database)} TO ${qname(role)}`);
  fixture=new pg.Client({...base,database});await fixture.connect();
  await fixture.query(`REVOKE ALL ON SCHEMA public FROM PUBLIC;
    CREATE TABLE subject(key text PRIMARY KEY,desired text NOT NULL CHECK(desired IN ('GRANTED','REVOKED')),generation integer NOT NULL,version integer NOT NULL DEFAULT 1,academic boolean NOT NULL,cleanup text NOT NULL,observed jsonb,observed_at timestamptz);
    CREATE TABLE attempt(id text PRIMARY KEY,subject text NOT NULL REFERENCES subject(key),generation integer NOT NULL,action text NOT NULL,state text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
    CREATE TABLE audit(seq bigserial PRIMARY KEY,event_key text UNIQUE NOT NULL,event text NOT NULL,subject text,detail jsonb NOT NULL,worker_pid integer NOT NULL,at timestamptz NOT NULL DEFAULT clock_timestamp());
    CREATE TABLE watch(subject text PRIMARY KEY REFERENCES subject(key),active boolean NOT NULL DEFAULT true,failures integer NOT NULL DEFAULT 0);
    CREATE TABLE outbox(id bigserial PRIMARY KEY,subject text NOT NULL REFERENCES subject(key),generation integer NOT NULL);
    CREATE TABLE sweep(id integer PRIMARY KEY,cursor text NOT NULL);INSERT INTO sweep VALUES(1,'');
    GRANT USAGE ON SCHEMA public TO ${qname(role)};
    GRANT SELECT,INSERT,UPDATE ON subject,attempt,watch,sweep TO ${qname(role)};
    GRANT SELECT,INSERT ON audit TO ${qname(role)};
    GRANT SELECT,INSERT,DELETE ON outbox TO ${qname(role)};
    GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ${qname(role)};`);
  config={...base,database,user:role,password,application_name:run};
  evidence.fixture={database,workerRole:role,credentialsPersisted:false,retainedForInspection:true};
  evidence.versions={node:process.version,postgres:(await fixture.query('SHOW server_version')).rows[0].server_version};
  for(const name of ['worker.mjs','provider.mjs','run.mjs'])evidence.sourceHashes[name]=createHash('sha256').update(await readFile(new URL(name,import.meta.url))).digest('hex');
  provider=await startProvider(async pid=>{const row=(await fixture.query('SELECT pid,xact_start,state FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0];assert.ok(row);const observation={...row,at:new Date().toISOString()};evidence.transactionObservations.push(observation);return observation});

  await check('B01',async()=>{const w=await start(),key='B01/t/r/a';await seed(w,key);await assert.rejects(w.call({op:'unsafeIntent',key}),/DURABLE_INTENT_REQUIRED/);assert.equal(provider.events.filter(e=>e.key===key).length,0);return {guard:'DURABLE_INTENT_REQUIRED',providerRequests:0}});
  await check('B02',async()=>{const a=await start(),b=await start(),key='B02/t/r/a',id='B02-grant';await seed(a,key);const results=await Promise.all([a.call({op:'grant',key,id}),b.call({op:'grant',key,id})]);assert.equal(results.filter(x=>x.dispatch===false).length,1);assert.equal(provider.events.filter(e=>e.event==='received'&&e.method==='PUT'&&e.key===key).length,1);return {results,snapshot:await snapshot(key)}});
  await check('B03',()=>late('B03/t/r/a','invitation',{killAtCompletion:true}));
  await check('B04',()=>late('B04/t/r/a','member'));
  await check('B05',async()=>{const w=await start(),key='B05/t/r/a',id='B05-grant';await seed(w,key);provider.plan({key,method:'PUT',holdReply:true});const job=pending(w.call({op:'grant',key,id}));await pEvent(id,'held');const c=await start();await c.call({op:'revoke',key});provider.release(id,'reply');assert.equal((await job).result,'STALE');assert.equal(await c.call({op:'complete',id}),'DUPLICATE');const s=await assertRevoked(key);assert.equal(s.audit.filter(e=>e.event==='COMPLETION_STALE').length,1);return s});
  await check('B06',async()=>{
    const windows=[];
    for(const pause of ['beforeIntentCommit','afterPrepared','afterIntent']){
      const w=await start(),key=`B06/${pause}/r/a`,id=key+'-grant';await seed(w,key);pending(w.call({op:'grant',key,id,pause}));await phase(w,key,pause);await w.kill(key,pause);
      const restarted=await start();await restarted.call({op:'revoke',key});await restarted.call({op:'reconcile',key});const s=await assertRevoked(key,pause==='afterIntent'?'pending':'observed_absent');
      assert.equal(provider.events.filter(e=>e.key===key&&e.method==='PUT').length,0);windows.push({window:pause,oldPid:w.pid,newPid:restarted.pid,snapshot:s});
    }
    for(const window of ['in-flight','remote-success-before-completion']){
      const w=await start(),c=await start(),key=`B06/${window}/r/a`,id=key+'-grant';await seed(w,key);provider.plan({key,method:'PUT',holdApply:true,holdReply:window!=='in-flight'});
      pending(w.call({op:'grant',key,id}));await pEvent(id,'held');await c.call({op:'revoke',key});
      if(window!=='in-flight'){provider.release(id,'apply');await pEvent(id,'grant-applied');await provider.wait(e=>e.id===id&&e.event==='held'&&e.phase==='reply')}
      await w.kill(key,window);
      if(window==='in-flight'){provider.release(id,'apply');await pEvent(id,'grant-applied')}else provider.release(id,'reply');
      const restarted=await start();assert.ok((await restarted.call({op:'scan'})).includes(key));await restarted.call({op:'reconcile',key});const s=await assertRevoked(key,'pending');assert.equal(s.remote.member,false);assert.ok(s.attempts.some(a=>a.id===id&&a.state==='possibly_issued'));windows.push({window,oldPid:w.pid,newPid:restarted.pid,snapshot:s});
    }
    const w=await start(),key='B06/revoke/r/a';await seed(w,key);pending(w.call({op:'revoke',key,pause:'afterRevoke'}));await phase(w,key,'afterRevoke');await w.kill(key,'revoke commit before queue publication');const restarted=await start();assert.ok((await restarted.call({op:'scan'})).includes(key));await restarted.call({op:'reconcile',key});windows.push({window:'afterRevoke',snapshot:await assertRevoked(key,'observed_absent')});return windows;
  });
  await check('B07',async()=>{const w=await start(),c=await start(),key='B07/t/r/a',id='B07-grant';await seed(w,key);provider.plan({key,method:'PUT',holdApply:true});const job=pending(w.call({op:'grant',key,id,controlledTimeout:true}));await pEvent(id,'held');await c.call({op:'revoke',key});w.release('abortIO');assert.equal((await job).outcome,'UNKNOWN');for(let i=0;i<3;i++)assert.equal((await c.call({op:'reconcile',key})).cleanup,'pending');provider.release(id,'apply');await pEvent(id,'grant-applied');await c.call({op:'reconcile',key});const s=await assertRevoked(key,'pending');assert.equal(s.remote.member,false);return s});
  await check('B08',async()=>{const w=await start(),key='B08/t/r/a';await seed(w,key);await w.call({op:'grant',key,id:'B08-grant'});await w.call({op:'revoke',key});pending(w.call({op:'reconcile',key,pause:'afterRemoveResponse'}));await phase(w,key,'afterRemoveResponse');await w.kill(key,'DELETE success before completion');const restarted=await start();await restarted.call({op:'reconcile',key});await restarted.call({op:'repeatRemoval',key});await restarted.call({op:'repeatRemoval',key});await restarted.call({op:'reconcile',key});return assertRevoked(key,'observed_absent')});
  await check('B09',async()=>{const w=await start(),key='B09/t/r/a';await seed(w,key);await w.call({op:'revoke',key});const results=[];for(const status of [401,403,503]){provider.plan({key,method:'GET',status});const result=await w.call({op:'reconcile',key});assert.equal(result.cleanup,'blocked');assert.equal((await snapshot(key)).watch.active,true);results.push({status,result})}await w.call({op:'reconcile',key});return {results,snapshot:await assertRevoked(key,'observed_absent')}});
  await check('B10',async()=>{const w=await start(),key='B10/t/r/a';await seed(w,key);await w.call({op:'revoke',key});await w.call({op:'exhaust',key});await w.kill(key,'budget exhausted and queue message absent');const restarted=await start();assert.ok((await restarted.call({op:'scan'})).includes(key));await restarted.call({op:'reconcile',key});return assertRevoked(key,'observed_absent')});
  await check('B11',async()=>{const w=await start(),keys=['B11/tenant1/repo1/old','B11/tenant1/repo1/new','B11/tenant2/repo2/old'];for(const key of keys){await seed(w,key);await w.call({op:'grant',key,id:key+'-grant'})}await w.call({op:'revoke',key:keys[0]});await w.call({op:'reconcile',key:keys[0]});assert.equal(provider.state(keys[0]).member,false);for(const key of keys.slice(1)){assert.equal(provider.state(key).member,true);assert.equal((await snapshot(key)).subject.desired,'GRANTED')}return Promise.all(keys.map(snapshot))});
  await check('B12',async()=>{const w=await start(),c=await start(),key='B12/t/r/a';await seed(w,key);await w.call({op:'grant',key,id:'B12-grant'});await w.call({op:'revoke',key});const job=pending(w.call({op:'reconcile',key,pause:'afterObservation'}));await phase(w,key,'afterObservation');await c.call({op:'regrant',key});w.release('afterObservation');const result=await job;assert.equal(result.cleanup,'STALE');const s=await snapshot(key);assert.equal(s.subject.generation,3);assert.equal(s.subject.desired,'GRANTED');assert.equal(s.subject.academic,false);assert.equal(s.remote.member,true);
    const d=await start(),key2='B12/crash-observation/r/a';await seed(d,key2);await d.call({op:'revoke',key:key2});pending(d.call({op:'reconcile',key:key2,pause:'afterObservation'}));await phase(d,key2,'afterObservation');await d.kill(key2,'observation before cleanup CAS');const recovered=await start();await recovered.call({op:'reconcile',key:key2});
    const key3='B12/inflight-delete/r/a';await seed(c,key3);await c.call({op:'grant',key:key3,id:'B12-before-delete'});await c.call({op:'revoke',key:key3});provider.plan({key:key3,method:'DELETE',holdApply:true});const deleting=pending(c.call({op:'reconcile',key:key3}));const received=await provider.wait(e=>e.key===key3&&e.event==='received'&&e.method==='DELETE');await pEvent(received.id,'held');await recovered.call({op:'regrant',key:key3});provider.release(received.id,'apply');assert.equal((await deleting).cleanup,'STALE');assert.equal(provider.state(key3).member,false);assert.equal((await snapshot(key3)).subject.desired,'GRANTED');await recovered.call({op:'grant',key:key3,id:'B12-new-generation'});assert.equal(provider.state(key3).member,true);
    return {stale:s,restart:await assertRevoked(key2,'observed_absent'),inflightDelete:await snapshot(key3)};});
  await check('B13',async()=>{const w=await start(),key='B13/t/r/a',id='B13-grant';await seed(w,key);await w.call({op:'grant',key,id});await w.call({op:'revoke',key});for(let i=0;i<3;i++){assert.equal(await w.call({op:'complete',id}),'DUPLICATE');await w.call({op:'reconcile',key})}const s=await assertRevoked(key,'observed_absent');assert.equal(s.audit.filter(e=>e.detail.id===id&&e.event.startsWith('COMPLETION_')).length,1);assert.equal(provider.events.filter(e=>e.key===key&&e.event==='grant-applied').length,1);return s});
  await check('B14',async()=>{assert.ok(evidence.transactionObservations.length>0);assert.ok(evidence.transactionObservations.every(o=>o.xact_start===null));return {observations:evidence.transactionObservations.length,openTransactions:0,methods:[...new Set(provider.events.filter(e=>e.event==='received').map(e=>e.method))]}});
  await check('B15',async()=>{
    const results=[];const w=await start(),key='B15/mutants/r/a';await seed(w,key);
    await assert.rejects(w.call({op:'unsafeTransaction',key}),/NETWORK_WITH_OPEN_TRANSACTION/);results.push({mutant:'BEGIN-provider-COMMIT',detectedBy:'worker boundary assertion'});
    await assert.rejects(w.call({op:'unsafeTransaction',key,bypassTxGuard:true}),/PROVIDER_500/);assert.ok(provider.events.some(e=>e.key===key&&e.event==='transaction-violation'));results.push({mutant:'bypass transaction guard',detectedBy:'independent pg_stat_activity observer'});
    await w.call({op:'unsafeIntent',key,bypassIntent:true});assert.throws(()=>assert.equal(provider.events.filter(e=>e.key===key&&e.method==='PUT').length,0));results.push({mutant:'remove intent guard',detectedBy:'zero unauthorized provider requests invariant'});
    const id='B15-stale',control=await start();provider.plan({key,method:'PUT',holdReply:true});const job=pending(w.call({op:'grant',key,id,mutateCAS:true}));await pEvent(id,'held');await control.call({op:'revoke',key});provider.release(id,'reply');await job;assert.throws(()=>assert.equal(provider.state(key).member,false));const s=await snapshot(key);assert.throws(()=>assert.equal(s.subject.desired,'REVOKED'));results.push({mutant:'remove generation CAS',detectedBy:'desired remains revoked invariant'});
    await control.call({op:'revoke',key});const broken=await control.call({op:'scan',mutateWatch:true});assert.throws(()=>assert.ok(broken.includes(key)));results.push({mutant:'disable durable sweep discovery',detectedBy:'pending subject discovered invariant'});evidence.negativeControls=results;return results;
  });
  evidence.status='PASS';
}catch(error){evidence.status='FAIL';evidence.failure={name:error.name,message:String(error.message).replace(/postgres(?:ql)?:\/\/\S+/g,'[REDACTED]').slice(0,1200)};console.log('FAIL '+evidence.failure.message);process.exitCode=1;}
finally{
  for(const w of [...workers])await w.kill();
  if(provider){evidence.providerEvents=provider.events;await provider.close()}
  if(fixture){evidence.finalAudit=(await fixture.query('SELECT * FROM audit ORDER BY seq')).rows;await fixture.end()}
  if(admin)await admin.end();evidence.finishedAt=new Date().toISOString();await save();console.log(`${evidence.status}: ${evidencePath}`);if(process.connected)process.disconnect();
}
