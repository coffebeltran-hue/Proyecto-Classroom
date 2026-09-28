import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDurableIntake } from '../packages/database/src/rr03-intake.ts';
import { createProofServer } from './rr03-server.ts';

const run = `rr03_${Date.now()}_${randomBytes(3).toString('hex')}`;
const directory = `.local/rr03/${run}`;
await mkdir(directory, { recursive: true });
const names = Object.fromEntries(['db','owner','migration','api'].map(key => [key, `${run}_${key}`]));
const evidence = { source: 'real isolated PostgreSQL; synthetic signed webhook HTTP injection; simulated OAuth', run, names, status: 'running', checks: [] };
const save = () => writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2));
const ident = value => { assert.match(value, /^[a-z_][a-z0-9_]*$/); return `"${value}"`; };
const passwords = { migration: randomBytes(24).toString('hex'), api: randomBytes(24).toString('hex') };
const clients = [];
let pool, server;
const check = async (name, fn) => { await fn(); evidence.checks.push({ name, status: 'pass' }); await save(); console.log(`PASS ${name}`); };
await save();
try {
  const files = ['scripts/rr03-local-proof.mjs','scripts/rr03-server.ts','packages/database/src/rr03-intake.ts','packages/database/rr03/schema.ts','packages/database/rr03/migrations/0000_real_miek.sql','packages/github/src/security.ts','packages/github/src/index.ts','node_modules/@octokit/oauth-methods/dist-src/exchange-web-flow-code.js','node_modules/drizzle-orm/pg-core/dialect.js','package-lock.json'];
  evidence.fingerprints = Object.fromEntries(await Promise.all(files.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')])));
  const env = parseEnv(await readFile('.local/postgres/connection.env', 'utf8'));
  const url = new URL(env.DATABASE_URL);
  assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '54329');
  const base = { host: url.hostname, port: Number(url.port), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), connectionTimeoutMillis: 2500, statement_timeout: 5000, query_timeout: 6000 };
  const connect = async (database, role, extra = {}) => { const client = new pg.Client({ ...base, database, ...(role ? { user: names[role], password: passwords[role] } : {}), ...extra }); clients.push(client); client.on('error', () => {}); await client.connect(); return client; };
  const admin = await connect('postgres');
  evidence.versions = { node: process.version, postgres: (await admin.query('SHOW server_version')).rows[0].server_version };
  await check('isolated-restricted-provision', async () => {
    for (const role of ['owner','migration','api']) await admin.query(`CREATE ROLE ${ident(names[role])} ${passwords[role] ? `LOGIN PASSWORD '${passwords[role]}'` : 'NOLOGIN'} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT`);
    await admin.query(`GRANT ${ident(names.owner)} TO ${ident(names.migration)}`);
    await admin.query(`CREATE DATABASE ${ident(names.db)} OWNER ${ident(names.owner)} TEMPLATE template0`);
    await admin.query(`REVOKE ALL ON DATABASE ${ident(names.db)} FROM PUBLIC`);
    await admin.query(`GRANT CONNECT ON DATABASE ${ident(names.db)} TO ${ident(names.migration)},${ident(names.api)}`);
    const db = await connect(names.db);
    await db.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await db.query(`ALTER DEFAULT PRIVILEGES FOR ROLE ${ident(names.owner)} REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`);
    const migration = await connect(names.db, 'migration', { options: `-c role=${names.owner}` });
    await migrate(drizzle(migration), { migrationsFolder: 'packages/database/rr03/migrations' });
    await migration.query(`GRANT USAGE ON SCHEMA rr03_proof TO ${ident(names.api)}`);
    await migration.query(`GRANT SELECT,INSERT ON rr03_proof.receipt TO ${ident(names.api)}`);
    await migration.query(`GRANT SELECT ON rr03_proof.installation TO ${ident(names.api)}`);
    await migration.query(`GRANT UPDATE(capability) ON rr03_proof.installation TO ${ident(names.api)}`);
    await migration.query('INSERT INTO rr03_proof.installation VALUES($1,$2,$3,$4)', [4990040,162753561,330894124,'verification-required']);
    await admin.query(`ALTER ROLE ${ident(names.api)} IN DATABASE ${ident(names.db)} SET search_path=pg_catalog`);
    const runtime = { ...base, database: names.db, user: names.api, password: passwords.api, max: 6 };
    pool = new pg.Pool(runtime); pool.on('error', () => {});
    // Ignored local-only runtime credential, never written to evidence or stdout.
    await writeFile(`${directory}/runtime.json`, JSON.stringify(runtime), { mode: 0o600 });
    const denied = async sql => assert.rejects(pool.query(sql), error => error.code === '42501');
    for (const sql of ['CREATE TABLE rr03_proof.forbidden(id int)', 'CREATE TABLE public.forbidden(id int)', 'CREATE TEMP TABLE forbidden(id int)', `CREATE DATABASE ${ident(run + '_forbidden')}`, `CREATE ROLE ${ident(run + '_forbidden')}`, `SET ROLE ${ident(names.owner)}`, 'DELETE FROM rr03_proof.receipt', 'UPDATE rr03_proof.receipt SET status=\'forbidden\'', 'UPDATE rr03_proof.installation SET account_id=0', 'SELECT * FROM drizzle.__drizzle_migrations']) await denied(sql);
    assert.equal((await pool.query('SHOW search_path')).rows[0].search_path, 'pg_catalog');
    const ownerRoles = await admin.query('SELECT rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=ANY($1)', [[names.owner,names.api]]);
    assert.ok(ownerRoles.rows.every(row => !row.rolsuper && !row.rolcreatedb && !row.rolcreaterole && !row.rolbypassrls));
    assert.equal(ownerRoles.rows.find(row => row.rolname === names.owner).rolcanlogin, false);
    assert.equal((await admin.query('SELECT count(*)::int AS n FROM pg_auth_members WHERE member=$1::regrole', [names.api])).rows[0].n, 0);
  });
  const secret = randomBytes(32).toString('hex');
  server = createProofServer({ secret, intake: createDurableIntake(pool), oauth: { authorize: () => 'https://github.com/login/oauth/authorize', complete: async () => { throw new Error('SIMULATED_UNUSED'); }, invalidate() {} }, recordUser: async () => {} });
  const send = (body, delivery, event = 'installation', signature) => server.inject({ method: 'POST', url: '/rr03/webhooks/github', headers: { 'content-type': 'application/json', 'x-github-event': event, 'x-github-delivery': delivery, 'x-hub-signature-256': signature ?? `sha256=${createHmac('sha256',secret).update(body).digest('hex')}` }, payload: body });
  await check('concurrent-durable-dedup-and-conflict', async () => {
    const body = JSON.stringify({ action: 'suspend', installation: { id: 162753561 } });
    const replies = await Promise.all(Array.from({ length: 12 }, () => send(body,'concurrent')));
    assert.ok(replies.every(reply => reply.statusCode === 200));
    assert.equal(replies.filter(reply => reply.json().status === 'accepted').length, 1);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM rr03_proof.receipt')).rows[0].n, 1);
    assert.equal((await pool.query('SELECT capability FROM rr03_proof.installation')).rows[0].capability, 'invalidated');
    assert.equal((await send(body,'concurrent','installation_repositories')).statusCode, 409);
    assert.equal((await send(body + ' ','concurrent')).statusCode, 409);
    assert.equal((await send(JSON.stringify({ action: 'unsuspend', installation: { id: 162753561 } }),'unsuspend')).statusCode, 200);
    assert.equal((await pool.query('SELECT capability FROM rr03_proof.installation')).rows[0].capability, 'verification-required');
  });
  await check('auth-before-parse-and-no-invalid-receipts', async () => {
    const before = (await pool.query('SELECT count(*)::int AS n FROM rr03_proof.receipt')).rows[0].n;
    assert.equal((await send('{','bad-json')).statusCode, 400);
    assert.equal((await send('{','bad-signature','ping','sha256=' + '0'.repeat(64))).statusCode, 401);
    assert.equal((await send('{}','malformed','ping','invalid')).statusCode, 401);
    assert.equal((await server.inject({ method: 'POST', url: '/rr03/webhooks/github', payload: '{}' })).statusCode, 401);
    assert.equal((await send(JSON.stringify({ installation: { id: 1 } }),'wrong-install')).statusCode, 400);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM rr03_proof.receipt')).rows[0].n, before);
  });
  await check('db-down-nonack', async () => {
    const deadPool = new pg.Pool({ host: '127.0.0.1', port: 1, user: 'rr03_simulated_unavailable', database: 'rr03_unavailable', connectionTimeoutMillis: 500 });
    const dead = createProofServer({ secret, intake: createDurableIntake(deadPool), oauth: { authorize: () => '', complete: async () => null, invalidate() {} }, recordUser: async () => {} });
    try {
      const payload = '{}';
      const reply = await dead.inject({ method: 'POST', url: '/rr03/webhooks/github', payload, headers: { 'content-type': 'application/json', 'x-github-event': 'ping', 'x-github-delivery': 'db-down', 'x-hub-signature-256': `sha256=${createHmac('sha256',secret).update(payload).digest('hex')}` } });
      assert.equal(reply.statusCode, 503); assert.deepEqual(reply.json(), { code: 'INTAKE_UNAVAILABLE' });
    } finally { await dead.close(); await deadPool.end(); }
  });
  evidence.status = 'pass';
} catch (error) {
  evidence.status = 'fail'; evidence.error = { code: ['ECONNREFUSED','42501','23505'].includes(error?.code) ? error.code : 'LOCAL_PROOF_FAILED' }; process.exitCode = 1;
} finally {
  await server?.close(); await pool?.end(); for (const client of clients) await client.end().catch(() => {});
  await save(); console.log(`RR03 ${evidence.status}: ${directory}/evidence.json`);
}
