import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const MAX_WEBHOOK_BYTES = 256 * 1024;
export function verifyWebhook(raw: Buffer, signature: unknown, secret: string): boolean {
  if (!secret || raw.length > MAX_WEBHOOK_BYTES || typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(raw).digest(), Buffer.from(signature.slice(7), 'hex'));
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
/** Ephemeral, bounded, browser-bound and consumed before code exchange. Restart fails closed. */
export class OAuthStateStore {
  private readonly entries = new Map<string, { binding: string; verifier: string; expires: number }>();
  constructor(private readonly now = Date.now) {}
  issue() {
    for (const [key, entry] of this.entries) if (entry.expires <= this.now()) this.entries.delete(key);
    if (this.entries.size >= 100) throw new Error('OAUTH_CAPACITY');
    const state = randomBytes(32).toString('base64url');
    const binding = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    this.entries.set(digest(state), { binding: digest(binding), verifier, expires: this.now() + 300000 });
    return { state, binding, challenge: createHash('sha256').update(verifier).digest('base64url') };
  }
  consume(state: unknown, binding: unknown): string {
    if (typeof state !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(state) || typeof binding !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(binding)) throw new Error('OAUTH_STATE_INVALID');
    const key = digest(state);
    const entry = this.entries.get(key);
    this.entries.delete(key);
    if (!entry || entry.expires <= this.now() || !timingSafeEqual(Buffer.from(entry.binding, 'hex'), Buffer.from(digest(binding), 'hex'))) throw new Error('OAUTH_STATE_INVALID');
    return entry.verifier;
  }
}

export interface IntakeRecord { appId: number; installationId: number | null; deliveryId: string; event: string; digest: string; capability: 'invalidated' | 'verification-required' | null }
/** Called only after raw authentication; retains no payload or sender identity. */
export function parseIntake(raw: Buffer, delivery: unknown, event: unknown, expected: { appId: number; installationId: number }): IntakeRecord {
  if (typeof delivery !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(delivery) || typeof event !== 'string' || !/^[a-z_]{1,80}$/.test(event)) throw new Error('WEBHOOK_HEADERS_INVALID');
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw.toString('utf8')); } catch { throw new Error('WEBHOOK_JSON_INVALID'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('WEBHOOK_JSON_INVALID');
  const install = payload.installation as { id?: unknown; app_id?: unknown } | undefined;
  if (install !== undefined && (!install || typeof install !== 'object' || install.id !== expected.installationId || (install.app_id !== undefined && install.app_id !== expected.appId))) throw new Error('WEBHOOK_AUTHORITY_MISMATCH');
  if ((event === 'installation' || event === 'installation_repositories') && !install) throw new Error('WEBHOOK_AUTHORITY_MISMATCH');
  const capability = event === 'installation' && ['suspend', 'deleted'].includes(String(payload.action)) ? 'invalidated' : event === 'installation' || event === 'installation_repositories' ? 'verification-required' : null;
  return { appId: expected.appId, installationId: install ? expected.installationId : null, deliveryId: delivery, event, digest: createHash('sha256').update(raw).digest('hex'), capability };
}
