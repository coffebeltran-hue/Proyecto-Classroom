import { bigint, pgSchema, text, primaryKey, timestamp } from 'drizzle-orm/pg-core';
export const proof = pgSchema('rr03_proof');
export const installations = proof.table('installation', {
  appId: bigint('app_id', { mode: 'number' }).notNull(),
  installationId: bigint('installation_id', { mode: 'number' }).notNull(),
  accountId: bigint('account_id', { mode: 'number' }).notNull(),
  capability: text('capability').notNull(),
}, table => [primaryKey({ columns: [table.appId, table.installationId] })]);
export const receipts = proof.table('receipt', {
  appId: bigint('app_id', { mode: 'number' }).notNull(),
  deliveryId: text('delivery_id').notNull(),
  installationId: bigint('installation_id', { mode: 'number' }),
  event: text('event').notNull(),
  digest: text('digest').notNull(),
  status: text('status').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.appId, table.deliveryId] })]);
