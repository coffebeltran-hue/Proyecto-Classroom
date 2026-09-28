import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { proveSandboxAuthority, sanitizeProviderError } from '../packages/github/src/index.ts';

const directory = `.local/rr03/provider_${Date.now()}_${randomBytes(3).toString('hex')}`;
await mkdir(directory, { recursive: true });
const evidence = { source: 'real GitHub API', status: 'running', checks: [], fingerprints: {} };
const save = () => writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2));
await save();
try {
  for (const file of ['package-lock.json', 'packages/github/src/index.ts', 'scripts/rr03-provider-proof.mjs', 'node_modules/octokit/dist-src/index.js', 'node_modules/@octokit/auth-app/dist-src/get-app-authentication.js', 'node_modules/@octokit/auth-app/dist-src/get-installation-authentication.js']) {
    evidence.fingerprints[file] = createHash('sha256').update(await readFile(file)).digest('hex');
  }
  evidence.versions = { node: process.version, octokit: JSON.parse(await readFile('node_modules/octokit/package.json', 'utf8')).version };
  await save();
  await proveSandboxAuthority(async (step, detail) => { evidence.checks.push({ step, status: 'pass', ...detail }); await save(); console.log(`PASS ${step}`); });
  evidence.status = 'pass';
} catch (error) {
  evidence.status = 'fail';
  evidence.error = sanitizeProviderError(error);
  process.exitCode = 1;
} finally {
  await save();
  console.log(`RR03 ${evidence.status}: ${directory}/evidence.json`);
}
