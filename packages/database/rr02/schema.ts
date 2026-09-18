import { integer, pgSchema, text } from 'drizzle-orm/pg-core';

// Disposable operational fixture; never imported by application startup.
export const proof = pgSchema('rr02_proof');
export const marker = proof.table('marker', {
  id: integer('id').primaryKey(),
  value: text('value').notNull(),
});
