import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const name of ['shared', 'database', 'github']) {
  const source = resolve(
    repoRoot,
    '.local',
    'vercel-api-build',
    'packages',
    name,
    'src',
  );
  const destination = resolve(repoRoot, 'packages', name, 'dist');

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}
