import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const githubIdentities = pgTable(
  'github_identities',
  {
    githubUserId: bigint('github_user_id', { mode: 'bigint' }).primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    login: text('login').notNull(),
    avatarUrl: text('avatar_url'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('github_identities_user_id_unique').on(table.userId),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    secretHash: text('secret_hash').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('sessions_secret_hash_unique').on(table.secretHash),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const oauthAttempts = pgTable(
  'oauth_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    stateHash: text('state_hash').notNull(),
    bindingHash: text('binding_hash').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('oauth_attempts_state_hash_unique').on(table.stateHash),
    index('oauth_attempts_expires_at_idx').on(table.expiresAt),
  ],
);