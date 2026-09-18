import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { PgBoss, getConstructionPlans } from 'pg-boss';
import { startRestrictedQueue } from '../apps/worker/src/infrastructure.ts';

const run = `rr02_${Date.now()}_${randomBytes(3).toString('hex')}`;
const directory = path.resolve('.local/rr02', run);
await mkdir(directory, { recursive: true });
const names = Object.fromEntries(['db', 'restore', 'owner', 'qowner', 'migration', 'maintenance', 'api', 'worker'].map(k => [k, `${run}_${k}`]));
const evidence = { run, names, checks: [], status: 'running' };
const save = () => writeFile(path.join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2));
await save();
const deadline = setTimeout(() => {
  evidence.status = 'fail'; evidence.error = { code: 'PROOF_DEADLINE' };
  void save().finally(() => { console.error('RR02 PROOF_DEADLINE'); process.exit(1); });
}, 180000);
const ident = value => { assert.match(value, /^[a-z_][a-z0-9_]*$/); return `"${value}"`; };
const safeError = error => ({ code: /^[A-Z0-9_]{2,40}$/.test(error?.code ?? '') ? error.code : 'PROOF_FAILURE' });
const resources = new Set();
const passwords = Object.fromEntries(['migration', 'maintenance', 'api', 'worker'].map(k => [k, randomBytes(24).toString('hex')]));
let base;
const connect = async (database, role, extra = {}) => {
  const client = new pg.Client({ ...base, database, ...(role ? { user: names[role], password: passwords[role] } : {}), connectionTimeoutMillis: 2500, statement_timeout: 8000, query_timeout: 9000, application_name: run, ...extra });
  resources.add(client);
  client.on('error', () => {});
  try { await client.connect(); return client; } catch (error) { await client.end().catch(() => {}); resources.delete(client); throw error; }
};
const check = async (name, fn) => { try { const details = await fn(); evidence.checks.push({ name, status: 'pass', details }); await save(); console.log(`PASS ${name}`); } catch (error) { evidence.checks.push({ name, status: 'fail', ...safeError(error) }); await save(); throw error; } };
const denied = async (client, sql) => { await assert.rejects(client.query(sql), e => e.code === '42501'); };
const waitFor = async fn => { const end = Date.now() + 25000; do { if (await fn()) return; await new Promise(r => setTimeout(r, 200)); } while (Date.now() < end); throw Object.assign(new Error(), { code: 'WAIT_TIMEOUT' }); };
const queue = async (database, role, owner = false, schema = 'pgboss') => {
  const boss = await startRestrictedQueue({ ...base, database, user: names[role], password: passwords[role], schema, ...(owner ? { options: `-c role=${names.qowner}` } : {}), max: 2, connectionTimeoutMillis: 2500, statement_timeout: 8000, query_timeout: 9000, pollingIntervalSeconds: 0.5 });
  resources.add(boss); return boss;
};
const stop = async boss => { await boss.stop({ graceful: false }); resources.delete(boss); };
const binary = async (name, args, database) => {
  const executable = path.resolve(process.env.RR02_PG_BIN ?? '.local/runtimes/postgresql-18.6/pgsql/bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, timeout: 45000, env: { ...process.env, PGHOST: base.host, PGPORT: String(base.port), PGUSER: base.user, PGPASSWORD: base.password, PGDATABASE: database }, stdio: ['ignore', 'pipe', 'pipe'] });
    let bytes = 0; child.stdout.on('data', chunk => { bytes += chunk.length; }); child.stderr.on('data', chunk => { bytes += chunk.length; });
    child.on('error', () => reject(Object.assign(new Error(), { code: 'SUBPROCESS_UNAVAILABLE' })));
    child.on('close', code => resolve({ code, outputBytes: bytes }));
  });
  assert.equal(result.code, 0); return result;
};
try {
  const envText = process.env.RR02_ADMIN_URL ? '' : await readFile('.local/postgres/connection.env', 'utf8');
  const url = new URL(process.env.RR02_ADMIN_URL ?? envText.trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, ''));
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname));
  base = { host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) };
  const admin = await connect('postgres');
  await check('fingerprints', async () => {
    const files = ['package-lock.json', 'scripts/rr02-proof.mjs', 'scripts/rr02-crash-child.mjs', 'apps/worker/src/infrastructure.ts', 'node_modules/pg-boss/dist/contractor.js', 'node_modules/pg-boss/dist/plans.js', 'node_modules/drizzle-orm/pg-core/dialect.js', 'packages/database/rr02/migrations/0000_slow_leech.sql'];
    const packages = Object.fromEntries(await Promise.all(['pg','pg-boss','drizzle-orm','drizzle-kit'].map(async name => [name, JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8')).version])));
    const schema = JSON.parse(await readFile('node_modules/pg-boss/package.json', 'utf8')).pgboss.schema;
    assert.equal(schema, 42);
    return { node: process.version, postgres: (await admin.query('show server_version')).rows[0], files: Object.fromEntries(await Promise.all(files.map(async f => [f, createHash('sha256').update(await readFile(f)).digest('hex')]))), packages, schema };
  });
  await check('provision', async () => {
    for (const role of ['owner', 'qowner', 'migration', 'maintenance', 'api', 'worker']) {
      await admin.query(`CREATE ROLE ${ident(names[role])} ${passwords[role] ? `LOGIN PASSWORD '${passwords[role]}'` : 'NOLOGIN'} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT`);
    }
    await admin.query(`GRANT ${ident(names.owner)} TO ${ident(names.migration)}`);
    await admin.query(`GRANT ${ident(names.qowner)} TO ${ident(names.maintenance)}`);
    for (const db of [names.db, names.restore]) {
      await admin.query(`CREATE DATABASE ${ident(db)} OWNER ${ident(names.owner)} TEMPLATE template0`);
      await admin.query(`REVOKE ALL ON DATABASE ${ident(db)} FROM PUBLIC`);
      await admin.query(`GRANT CONNECT ON DATABASE ${ident(db)} TO ${['migration','maintenance','api','worker'].map(k => ident(names[k])).join(',')}`);
      const c = await connect(db);
      await c.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
      await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(names.owner)} REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`);
      await c.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(names.qowner)} REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`);
      if (db === names.db) await c.query(`GRANT CREATE ON DATABASE ${ident(db)} TO ${ident(names.qowner)}`);
      for (const role of ['migration','maintenance','api','worker']) await admin.query(`ALTER ROLE ${ident(names[role])} IN DATABASE ${ident(db)} SET search_path = pg_catalog`);
    }
  });
  const migration = await connect(names.db, 'migration', { options: `-c role=${names.owner}` });
  const db = await connect(names.db);
  await check('migration-first-replay-rollback', async () => {
    const folder = 'packages/database/rr02/migrations';
    await migration.query('SELECT pg_advisory_lock(820020)');
    try {
      await migrate(drizzle(migration), { migrationsFolder: folder });
      const before = (await migration.query('SELECT * FROM drizzle.__drizzle_migrations')).rows;
      await migrate(drizzle(migration), { migrationsFolder: folder });
      assert.deepEqual((await migration.query('SELECT * FROM drizzle.__drizzle_migrations')).rows, before);
      const bad = path.join(directory, 'failed-migration'); await cp(folder, bad, { recursive: true });
      const journal = JSON.parse(await readFile(path.join(bad, 'meta/_journal.json'), 'utf8'));
      journal.entries.push({ idx: 1, version: '7', when: journal.entries[0].when + 1, tag: '0001_failure', breakpoints: true });
      await writeFile(path.join(bad, 'meta/_journal.json'), JSON.stringify(journal));
      await writeFile(path.join(bad, '0001_failure.sql'), 'CREATE TABLE rr02_proof.partial (id integer);\n--> statement-breakpoint\nSELECT 1/0;');
      await assert.rejects(migrate(drizzle(migration), { migrationsFolder: bad }));
      assert.equal((await migration.query("SELECT to_regclass('rr02_proof.partial') AS object")).rows[0].object, null);
      assert.deepEqual((await migration.query('SELECT * FROM drizzle.__drizzle_migrations')).rows, before);
      return { journalRows: before.length, journalHash: before[0].hash, releaseGuard: 'advisory serialization; immutable reviewed migration hash captured; Drizzle does not validate historical hash drift' };
    } finally { await migration.query('SELECT pg_advisory_unlock(820020)'); }
  });
  await check('queue-provision', async () => {
    await db.query(`SET ROLE ${ident(names.qowner)}`);
    await db.query(getConstructionPlans('pgboss'));
    await db.query('RESET ROLE');
    await db.query(`REVOKE CREATE ON DATABASE ${ident(names.db)} FROM ${ident(names.qowner)}`);
    const ownerBoss = await queue(names.db, 'maintenance', true);
    for (const name of ['lifecycle','retry','duplicate','crash','timeout','restore']) await ownerBoss.createQueue(name, { retryLimit: 1, retryDelay: 0, expireInSeconds: 1 });
    await stop(ownerBoss);
    const functions = (await db.query("SELECT proname, prosecdef FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='pgboss' ORDER BY proname")).rows;
    assert.ok(functions.every(f => !f.prosecdef));
    await db.query('REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss FROM PUBLIC');
    await db.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(names.qowner)} REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`);
    await db.query(`GRANT USAGE ON SCHEMA pgboss TO ${ident(names.worker)}`);
    await db.query(`GRANT SELECT ON pgboss.version,pgboss.queue TO ${ident(names.worker)}`);
    await db.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON pgboss.job,pgboss.job_common TO ${ident(names.worker)}`);
    await db.query(`GRANT EXECUTE ON FUNCTION pgboss.job_now() TO ${ident(names.worker)}`);
    await db.query(`GRANT USAGE ON SCHEMA rr02_proof TO ${ident(names.api)},${ident(names.worker)}`);
    await db.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA rr02_proof TO ${ident(names.api)},${ident(names.worker)}`);
    await db.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(names.owner)} IN SCHEMA rr02_proof GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO ${ident(names.api)},${ident(names.worker)}`);
    return { functions, functionSecurity: 'all invoker; executing DDL functions still requires owner privileges' };
  });
  await check('runtime-boundaries', async () => {
    for (const role of ['api', 'worker']) {
      const c = await connect(names.db, role);
      await c.query('INSERT INTO rr02_proof.marker VALUES ($1,$2)', [role === 'api' ? 1 : 2, 'synthetic']);
      await c.query('UPDATE rr02_proof.marker SET value=$1 WHERE id=$2', ['proof', role === 'api' ? 1 : 2]);
      assert.equal((await c.query('SELECT count(*)::int AS n FROM rr02_proof.marker')).rows[0].n, role === 'api' ? 1 : 2);
      await c.query('DELETE FROM rr02_proof.marker WHERE id=999');
      for (const sql of ['CREATE TABLE rr02_proof.forbidden(id int)', 'CREATE TABLE public.forbidden(id int)', `CREATE DATABASE ${ident(run + '_forbidden')}`, `CREATE ROLE ${ident(run + '_forbidden')}`, `SET ROLE ${ident(names.owner)}`, `SET ROLE ${ident(names.qowner)}`]) await denied(c, sql);
      await denied(c, 'ALTER TABLE rr02_proof.marker ADD COLUMN forbidden integer');
      await denied(c, 'DROP TABLE rr02_proof.marker');
      if (role === 'api') await denied(c, 'SELECT * FROM pgboss.job');
      else {
        await denied(c, 'UPDATE pgboss.version SET version=41');
        await denied(c, "SELECT pgboss.job_table_run('SELECT 1')");
      }
      assert.equal((await c.query('SHOW search_path')).rows[0].search_path, 'pg_catalog');
    }
    const roles = (await db.query('SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=ANY($1)', [[names.api,names.worker]])).rows;
    assert.ok(roles.every(r => Object.entries(r).every(([k,v]) => k === 'rolname' || v === false)));
    const owners = (await db.query("SELECT n.nspname,c.relname,pg_get_userbyid(c.relowner) AS owner,c.relacl::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('rr02_proof','drizzle','pgboss') ORDER BY 1,2")).rows;
    assert.ok(owners.every(o => o.owner === (o.nspname === 'pgboss' ? names.qowner : names.owner)));
    const defaults = (await db.query('SELECT pg_get_userbyid(defaclrole) AS owner, defaclnamespace::regnamespace::text AS schema,defaclobjtype,defaclacl::text FROM pg_default_acl WHERE defaclrole=ANY($1::regrole[]) ORDER BY 1,2,3', [[names.owner,names.qowner]])).rows;
    const publicGrants = (await db.query("SELECT count(*)::int AS n FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a WHERE n.nspname IN ('public','rr02_proof','drizzle','pgboss') AND a.grantee=0")).rows[0].n;
    assert.equal(publicGrants, 0);
    const publicDatabase = (await db.query("SELECT count(*)::int AS n FROM pg_database d CROSS JOIN LATERAL aclexplode(coalesce(d.datacl,acldefault('d',d.datdba))) a WHERE d.datname=$1 AND a.grantee=0", [names.db])).rows[0].n;
    const publicFunctions = (await db.query("SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE n.nspname='pgboss' AND a.grantee=0")).rows[0].n;
    assert.equal(publicDatabase, 0); assert.equal(publicFunctions, 0);
    for (const role of [names.api,names.worker]) {
      assert.equal((await db.query("SELECT has_database_privilege($1,$2,'CREATE') AS create,has_database_privilege($1,$2,'TEMP') AS temp", [role,names.db])).rows[0].create, false);
      assert.equal((await db.query("SELECT has_database_privilege($1,$2,'TEMP') AS temp", [role,names.db])).rows[0].temp, false);
    }
    assert.equal((await db.query('SELECT count(*)::int AS n FROM pg_auth_members WHERE member=ANY($1::regrole[])', [[names.api,names.worker]])).rows[0].n, 0);
    assert.equal(defaults.length, 3);
    return { roles, owners, defaults, publicSchemaGrants: publicGrants, publicDatabaseGrants: publicDatabase, publicFunctionGrants: publicFunctions };
  });
  let worker = await queue(names.db, 'worker');
  const maint = await queue(names.db, 'maintenance', true);
  await check('worker-cannot-create-queue', async () => {
    await assert.rejects(worker.createQueue('forbidden'), e => e.code === '42501');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pgboss.queue WHERE name='forbidden'")).rows[0].n, 0);
  });
  await check('queue-work-complete-retry-duplicates-restart', async () => {
    await worker.work('lifecycle', { transactional: false }, async jobs => { assert.deepEqual(jobs[0].data, { synthetic: true }); });
    const id = await worker.send('lifecycle', { synthetic: true });
    await waitFor(async () => (await worker.getJobById('lifecycle', id))?.state === 'completed');
    let attempts = 0;
    await worker.work('retry', { transactional: false }, async () => { if (++attempts === 1) throw new Error('SYNTHETIC_FAILURE'); });
    const retry = await worker.send('retry', { synthetic: true });
    await waitFor(async () => (await worker.getJobById('retry', retry))?.state === 'completed');
    assert.equal(attempts, 2);
    const ordinary = await Promise.all([worker.send('duplicate', { synthetic: true }),worker.send('duplicate', { synthetic: true })]);
    assert.ok(ordinary[0] && ordinary[1] && ordinary[0] !== ordinary[1]);
    const singleton = await worker.send('duplicate', {}, { singletonKey: 'proof', singletonSeconds: 60 });
    const duplicate = await worker.send('duplicate', {}, { singletonKey: 'proof', singletonSeconds: 60 });
    assert.ok(singleton); assert.equal(duplicate, null);
    await worker.stop({ graceful: true, timeout: 5000 }); resources.delete(worker); worker = await queue(names.db, 'worker');
    assert.equal((await worker.getJobById('lifecycle', id)).state, 'completed');
    return { attempts, ordinaryDuplicatesAccepted: true, singletonDuplicate: duplicate, gracefulStop: true };
  });
  await check('maintenance-and-crash-expiration-redelivery', async () => {
    const id = await worker.send('crash', { synthetic: true });
    const child = spawn(process.execPath, ['--import','tsx','scripts/rr02-crash-child.mjs'], { windowsHide: true, env: { ...process.env, RR02_CHILD_CONFIG: JSON.stringify({ ...base, database: names.db, user: names.worker, password: passwords.worker, application_name: run + '_crash', connectionTimeoutMillis: 2500, pollingIntervalSeconds: 0.5 }) }, stdio: ['ignore','pipe','pipe'] });
    let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); }); child.stderr.on('data', () => {});
    let childError = false; child.on('error', () => { childError = true; });
    const closed = new Promise(resolve => child.on('close', resolve));
    let callbackConnections;
    try {
      await waitFor(() => { assert.equal(childError, false); return output.includes(`ACTIVE ${id}`); });
      callbackConnections = (await db.query('SELECT state,xact_start FROM pg_stat_activity WHERE application_name=$1', [run + '_crash'])).rows;
      assert.ok(callbackConnections.length);
      assert.ok(callbackConnections.every(c => c.state === 'idle' && c.xact_start === null));
    }
    finally { child.kill('SIGKILL'); await closed; }
    assert.equal((await worker.getJobById('crash', id)).state, 'active');
    await new Promise(r => setTimeout(r, 1500));
    await maint.supervise('crash');
    const redelivered = await worker.fetch('crash'); assert.equal(redelivered[0]?.id, id);
    await worker.complete('crash', id);
    const commands = await maint.getReindexCommands({ force: true }); assert.ok(commands.length);
    const restricted = await connect(names.db, 'worker');
    await denied(restricted, commands[0]);
    const owner = await connect(names.db, 'maintenance', { options: `-c role=${names.qowner}` });
    for (const command of commands) await owner.query(command);
    return { redeliveredId: id, reindexes: commands.length, profile: 'NOLOGIN queue owner via maintenance SET ROLE', crashModel: 'forcibly terminated child process during real work callback', callbackConnections };
  });
  await check('handler-timeout-retry', async () => {
    let attempts = 0;
    await worker.work('timeout', { transactional: false }, async () => { if (++attempts === 1) await new Promise(() => {}); });
    const id = await worker.send('timeout', { synthetic: true });
    await waitFor(async () => (await worker.getJobById('timeout', id))?.state === 'completed');
    assert.equal(attempts, 2);
    return { attempts, expirationSeconds: 1, note: 'timeouts do not cancel arbitrary external side effects; synthetic callback only' };
  });
  await check('fail-closed-bootstrap-and-sanitized-connectivity', async () => {
    await assert.rejects(queue(names.db, 'worker', false, 'rr02_missing'), { message: 'QUEUE_INFRASTRUCTURE_UNAVAILABLE' });
    assert.equal((await db.query("SELECT to_regnamespace('rr02_missing') AS n")).rows[0].n, null);
    await db.query('UPDATE pgboss.version SET version=41');
    try { await assert.rejects(queue(names.db, 'worker'), { message: 'QUEUE_INFRASTRUCTURE_UNAVAILABLE' }); assert.equal((await db.query('SELECT version FROM pgboss.version')).rows[0].version, 41); }
    finally { await db.query('UPDATE pgboss.version SET version=42'); }
    for (const override of [{ password: randomBytes(24).toString('hex') }, { port: 1 }]) {
      await assert.rejects(startRestrictedQueue({ ...base, database: names.db, user: names.worker, password: passwords.worker, application_name: run + '_negative', ...override, connectionTimeoutMillis: 1000 }), { message: 'QUEUE_INFRASTRUCTURE_UNAVAILABLE' });
    }
    await waitFor(async () => (await db.query('SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name=$1', [run + '_negative'])).rows[0].n === 0);
  });
  await check('logical-dump-restore-ownership-acl-and-restart', async () => {
    const job = await worker.send('restore', { synthetic: true });
    await stop(worker); await stop(maint);
    const snapshot = async c => ({ marker: (await c.query('SELECT * FROM rr02_proof.marker ORDER BY id')).rows, journal: (await c.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY id')).rows, jobs: (await c.query('SELECT id,name,state,data FROM pgboss.job ORDER BY id')).rows, acl: (await c.query("SELECT n.nspname,c.relname,pg_get_userbyid(c.relowner) AS owner,c.relacl::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('rr02_proof','drizzle','pgboss') ORDER BY 1,2")).rows, defaults: (await c.query('SELECT pg_get_userbyid(defaclrole) AS owner,defaclnamespace::regnamespace::text AS schema,defaclobjtype,defaclacl::text FROM pg_default_acl ORDER BY 1,2,3')).rows });
    const before = await snapshot(db);
    const dump = path.join(directory, 'proof.dump');
    const backup = await binary('pg_dump', ['--format=custom', '--file', dump], names.db);
    const restore = await binary('pg_restore', ['--exit-on-error', '--dbname', names.restore, dump], names.restore);
    const restored = await connect(names.restore); assert.deepEqual(await snapshot(restored), before);
    worker = await queue(names.restore, 'worker');
    await worker.work('restore', { transactional: false }, async jobs => { assert.deepEqual(jobs[0].data, { synthetic: true }); });
    await waitFor(async () => (await worker.getJobById('restore', job))?.state === 'completed');
    await stop(worker);
    return { backup, restore, dump, markerRows: before.marker.length, journalRows: before.journal.length, queueRows: before.jobs.length, sameClusterRolesPreserved: true, scope: 'logical restore only; no PITR, provider, RPO or RTO proof' };
  });
  evidence.status = 'pass';
} catch (error) {
  evidence.status = 'fail'; evidence.error = safeError(error); process.exitCode = 1;
} finally {
  for (const resource of resources) { try { if (resource instanceof PgBoss) await resource.stop({ graceful: false }); else await resource.end(); } catch {} }
  clearTimeout(deadline);
  await save(); console.log(`RR02 ${evidence.status}: ${directory}`);
}
