import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc'], { stdio: 'inherit' });
for (const name of ['apps/api', 'apps/worker', 'packages/shared', 'packages/database', 'packages/github']) {
  mkdirSync(`${name}/dist`, { recursive: true });
  cpSync(`.local/build/${name}/src`, `${name}/dist`, { recursive: true });
}
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'apps/web/vite.config.ts'], { stdio: 'inherit' });
