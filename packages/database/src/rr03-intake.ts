import type { Pool } from 'pg';
import type { IntakeRecord } from '../../github/src/security.js';

/** Experimental RR03 infrastructure only. No network operations inside this transaction. */
export function createDurableIntake(pool: Pool) {
  return async (receipt: IntakeRecord): Promise<'accepted' | 'duplicate' | 'conflict'> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query({ name: 'rr03-receipt-insert', text: "INSERT INTO rr03_proof.receipt(app_id,delivery_id,installation_id,event,digest,status) VALUES($1,$2,$3,$4,$5,'received') ON CONFLICT(app_id,delivery_id) DO NOTHING RETURNING delivery_id", values: [receipt.appId,receipt.deliveryId,receipt.installationId,receipt.event,receipt.digest] });
      if (!inserted.rowCount) {
        const existing = await client.query({ name: 'rr03-receipt-find', text: 'SELECT digest,event FROM rr03_proof.receipt WHERE app_id=$1 AND delivery_id=$2', values: [receipt.appId,receipt.deliveryId] });
        await client.query('COMMIT');
        return existing.rows[0]?.digest === receipt.digest && existing.rows[0]?.event === receipt.event ? 'duplicate' : 'conflict';
      }
      if (receipt.capability && receipt.installationId) await client.query({ name: 'rr03-invalidate', text: 'UPDATE rr03_proof.installation SET capability=$1 WHERE app_id=$2 AND installation_id=$3', values: [receipt.capability,receipt.appId,receipt.installationId] });
      await client.query('COMMIT');
      return 'accepted';
    } catch {
      await client.query('ROLLBACK').catch(() => {});
      throw new Error('INTAKE_UNAVAILABLE');
    } finally { client.release(); }
  };
}
