import { cpSync, mkdirSync, rmSync } from 'node:fs';

for (const name of ['shared', 'database', 'github']) {
  const source = `.local/vercel-api-build/packages/${name}/src`;
  const destination = `packages/${name}/dist`;

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}
