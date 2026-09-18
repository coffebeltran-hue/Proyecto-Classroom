import { workerMode } from '@classroom/shared';
export function startIdleWorker(mode: string | undefined) {
  workerMode(mode);
  const timer = setInterval(() => {}, 60_000);
  return () => clearInterval(timer);
}
