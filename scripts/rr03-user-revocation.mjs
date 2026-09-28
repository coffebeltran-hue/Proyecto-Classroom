import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import { createUserRevocationProbe } from '../packages/github/src/index.ts';
import { createDurableIntake } from '../packages/database/src/rr03-intake.ts';
import { createProofServer } from './rr03-server.ts';
import { createRevocationServer } from './rr03-revocation-server.ts';

let pool, local, webhook, probe, terminal, closing;
const close = () => closing ??= (async () => { probe?.dispose(); terminal?.close(); await local?.close(); await webhook?.close(); await pool?.end(); })();
try {
  const file = resolve(process.argv[2] ?? '');
  if (!file.startsWith(resolve('.local/rr03') + '/') && !file.startsWith(resolve('.local/rr03') + '\\')) throw new Error();
  const config = JSON.parse(await readFile(file,'utf8'));
  if (config.host !== '127.0.0.1' || config.port !== 54329 || !/^rr03_\d+_[a-f0-9]{6}_db$/.test(config.database) || config.user !== config.database.slice(0,-3) + '_api') throw new Error();
  pool = new pg.Pool(config); pool.on('error', () => {});
  await pool.query('SELECT 1 FROM rr03_proof.installation LIMIT 1');
  const directory = `.local/rr03/user-revocation_${Date.now()}_${randomBytes(3).toString('hex')}`;
  await mkdir(directory, { recursive: true });
  const files = ['packages/github/src/index.ts','packages/github/src/security.ts','scripts/rr03-user-revocation.mjs','scripts/rr03-revocation-server.ts','scripts/rr03-server.ts','packages/database/src/rr03-intake.ts','tests/unit/rr03-revocation.test.ts','node_modules/octokit/dist-src/index.js','package-lock.json'];
  const fingerprints = Object.fromEntries(await Promise.all(files.map(async file => [file,createHash('sha256').update(await readFile(file)).digest('hex')])));
  await writeFile(`${directory}/manifest.json`, JSON.stringify({ node: process.version, octokit: JSON.parse(await readFile('node_modules/octokit/package.json','utf8')).version, files: fingerprints },null,2));
  await writeFile(`${directory}/evidence.json`,'[]');
  const observations = [];
  let save = Promise.resolve();
  probe = createUserRevocationProbe(async observation => {
    observations.push(observation);
    save = save.then(() => writeFile(`${directory}/evidence.json`, JSON.stringify(observations,null,2)));
    await save;
    console.log(`${observation.status} ${observation.at}`);
  });
  local = createRevocationServer(probe);
  // This isolated receiver records revocation hints but deliberately preserves the
  // experimental static user token until the operator's same-token GET /user probe.
  webhook = createProofServer({ webhookOnly: true, secret: process.env.GITHUB_WEBHOOK_SECRET ?? '', intake: createDurableIntake(pool), oauth: { authorize: () => '', complete: async () => null, invalidate() {} }, recordUser: async () => {} });
  await local.listen({ host: '127.0.0.1', port: 3002 });
  await webhook.listen({ host: '127.0.0.1', port: 3003 });
  console.log(`RR03 revocation ready: http://127.0.0.1:3002/rr03/oauth/start; evidence ${directory}/evidence.json`);
  console.log('After baseline-200-token-held: report readiness and keep this process open (15 minute maximum hold). Do not press Enter until instructed after manual revocation. No repeat OAuth.');
  terminal = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  let invoked = false;
  terminal.on('line', () => {
    if (invoked) return;
    invoked = true;
    void probe.probeAfterManualRevocation().catch(() => { console.log('probe-unavailable'); }).finally(close);
  });
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { void close(); });
} catch {
  await close().catch(() => {}); console.error('RR03_REVOCATION_UNAVAILABLE'); process.exitCode = 1;
}
