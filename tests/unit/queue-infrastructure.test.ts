import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), on: vi.fn(), constructor: vi.fn() }));
vi.mock('pg-boss', () => ({
  PgBoss: class {
    constructor(options: unknown) { mocks.constructor(options); }
    start = mocks.start;
    stop = mocks.stop;
    on = mocks.on;
  },
}));
import { startRestrictedQueue } from '../../apps/worker/src/infrastructure.js';

beforeEach(() => { vi.resetAllMocks(); mocks.start.mockResolvedValue(undefined); mocks.stop.mockResolvedValue(undefined); });

it('forces restricted startup even if a caller enables schema mutation or background maintenance', async () => {
  await startRestrictedQueue({ database: 'fixture', migrate: true, supervise: true, schedule: true });
  expect(mocks.constructor).toHaveBeenCalledWith({ database: 'fixture', migrate: false, supervise: false, schedule: false });
  expect(mocks.start).toHaveBeenCalledOnce();
});

it('closes failed startup and discards raw connection details, including cleanup errors', async () => {
  mocks.start.mockRejectedValue(new Error('postgres://user:secret@localhost/private'));
  mocks.stop.mockRejectedValue(new Error('secret cleanup details'));
  await expect(startRestrictedQueue({ database: 'fixture' })).rejects.toThrow(/^QUEUE_INFRASTRUCTURE_UNAVAILABLE$/);
  expect(mocks.stop).toHaveBeenCalledWith({ graceful: false });
});

it('reports asynchronous errors using a fixed sanitized diagnostic', async () => {
  const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await startRestrictedQueue({ database: 'fixture' });
    const listener = mocks.on.mock.calls[0][1] as (error: Error) => void;
    listener(new Error('credential-bearing raw error'));
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith('QUEUE_INFRASTRUCTURE_ERROR');
  } finally { diagnostic.mockRestore(); }
});
