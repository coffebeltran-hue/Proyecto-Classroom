import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  rmSync,
} from 'node:fs';

const output = '.local/vercel-api-build';

rmSync(output, {
  recursive: true,
  force: true,
});

execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '-p',
    'tsconfig.vercel-api.json',
    '--noCheck',
  ],
  {
    stdio: 'inherit',
  },
);

for (const name of [
  'packages/shared',
  'packages/database',
  'packages/github',
]) {
  mkdirSync(`${name}/dist`, {
    recursive: true,
  });

  cpSync(
    `${output}/${name}/src`,
    `${name}/dist`,
    {
      recursive: true,
    },
  );
}

console.log('Vercel API dependencies built successfully.');
