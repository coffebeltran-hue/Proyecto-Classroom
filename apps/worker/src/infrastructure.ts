import { PgBoss, type ConstructorOptions } from 'pg-boss';

/** Connected infrastructure only. Never installs schemas or performs maintenance. */
export async function startRestrictedQueue(options: ConstructorOptions) {
  let boss: PgBoss | undefined;
  try {
    boss = new PgBoss({ ...options, migrate: false, supervise: false, schedule: false });
    boss.on('error', () => { console.error('QUEUE_INFRASTRUCTURE_ERROR'); });
    await boss.start();
    return boss;
  } catch {
    await boss?.stop({ graceful: false }).catch(() => undefined);
    throw new Error('QUEUE_INFRASTRUCTURE_UNAVAILABLE');
  }
}
