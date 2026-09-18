import { startRestrictedQueue } from '../apps/worker/src/infrastructure.ts';

// Credentials arrive only through the inherited environment, never argv or stdout.
try {
  const options = JSON.parse(process.env.RR02_CHILD_CONFIG);
  delete process.env.RR02_CHILD_CONFIG;
  const boss = await startRestrictedQueue(options);
  await boss.work('crash', { transactional: false }, async jobs => {
    process.stdout.write(`ACTIVE ${jobs[0].id}\n`);
    await new Promise(() => {}); // Parent forcibly terminates this owned child.
  });
} catch {
  process.stderr.write('CHILD_INFRASTRUCTURE_FAILURE\n');
  process.exitCode = 1;
}
