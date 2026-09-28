import { startIdleWorker } from './worker.js';
try {
  if (process.argv.slice(2).some(arg => arg !== '--smoke')) throw new Error('Unsupported worker argument');
  const stop = startIdleWorker(process.env.WORKER_MODE);
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log('Worker idle: no database, queue or GitHub activity');
  if (process.argv.includes('--smoke')) stop();
} catch { console.error('Worker configuration invalid: WORKER_MODE must be idle; only --smoke is supported'); process.exitCode = 1; }
