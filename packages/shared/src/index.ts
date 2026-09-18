export interface Liveness { status: 'alive'; scope: 'process' }
export const liveness: Liveness = { status: 'alive', scope: 'process' };
export function port(value: string | undefined, fallback = 3001): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error('Invalid PORT');
  return Number(value);
}
export function databaseUrl(value: string | undefined): string {
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1) || url.search || url.hash || (url.port && Number(url.port) < 1)) throw new Error();
    return value;
  } catch { throw new Error('Invalid DATABASE_URL'); }
}
export function workerMode(value: string | undefined): 'idle' {
  if (value !== undefined && value !== 'idle') throw new Error('Invalid WORKER_MODE: only idle is supported');
  return 'idle';
}
