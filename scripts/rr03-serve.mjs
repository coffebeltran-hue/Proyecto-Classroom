import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import { createDurableIntake } from '../packages/database/src/rr03-intake.ts';
import { createSandboxOAuth } from '../packages/github/src/index.ts';
import { createProofServer } from './rr03-server.ts';

let pool, server, webhook;
try {
  const file = resolve(process.argv[2] ?? '');
  if (!file.startsWith(resolve('.local/rr03') + '/') && !file.startsWith(resolve('.local/rr03') + '\\')) throw new Error();
  const config = JSON.parse(await readFile(file, 'utf8'));
  if (config.host !== '127.0.0.1' || config.port !== 54329 || !/^rr03_\d+_[a-f0-9]{6}_db$/.test(config.database) || config.user !== config.database.slice(0,-3) + '_api') throw new Error();
  pool = new pg.Pool(config); pool.on('error', () => {});
  await pool.query('SELECT app_id,installation_id FROM rr03_proof.installation LIMIT 1');
  const directory = `${dirname(file)}/server_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mkdir(directory, { recursive: true });
  const files = ['scripts/rr03-server.ts','scripts/rr03-serve.mjs','packages/github/src/index.ts','packages/github/src/security.ts','packages/database/src/rr03-intake.ts'];
  await writeFile(`${directory}/fingerprints.json`, JSON.stringify(Object.fromEntries(await Promise.all(files.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')]))), null, 2));
  const oauth = createSandboxOAuth();
  const options = { controlOrigin: oauth.origin, secret: process.env.GITHUB_WEBHOOK_SECRET ?? '', intake: createDurableIntake(pool), oauth, recordUser: result => writeFile(`${directory}/oauth-proof.json`, JSON.stringify({ source: 'real browser OAuth and GitHub API', result }, null, 2)) };
  server = createProofServer(options);
  webhook = createProofServer({ ...options, webhookOnly: true });
  await server.listen({ host: '127.0.0.1', port: 3002 });
  await webhook.listen({ host: '127.0.0.1', port: 3003 });
  console.log(`RR03 ready: ${oauth.origin}/rr03/oauth/start; webhook-only 127.0.0.1:3003; evidence ${directory}`);
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { void Promise.all([server.close(),webhook.close()]).then(() => pool.end()); });
} catch {
  await server?.close().catch(() => {}); await webhook?.close().catch(() => {}); await pool?.end().catch(() => {});
  console.error('RR03_SERVER_UNAVAILABLE'); process.exitCode = 1;
}
