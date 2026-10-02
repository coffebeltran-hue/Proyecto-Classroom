import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const institutionRoleEnum = pgEnum('institution_role', [
  'ADMIN',
  'TEACHER',
  'STUDENT',
]);

export const academicIdentityStatusEnum = pgEnum(
  'academic_identity_status',
  ['PENDING', 'VERIFIED', 'REJECTED'],
);

export const institutionMembershipStatusEnum = pgEnum(
  'institution_membership_status',
  ['ACTIVE', 'SUSPENDED', 'REVOKED'],
);

export const institutionAccessRequestStatusEnum = pgEnum(
  'institution_access_request_status',
  ['PENDING', 'APPROVED', 'DENIED'],
);

export const institutionAccessRoleEnum = pgEnum(
  'institution_access_role',
  ['TEACHER', 'STUDENT'],
);

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
export const institutions = pgTable(
  'institutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('institutions_slug_unique').on(table.slug),
  ],
);

export const academicIdentities = pgTable(
  'academic_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id),

    institutionalIdentifier: text('institutional_identifier').notNull(),

    status: academicIdentityStatusEnum('status').notNull().default('PENDING'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('academic_identities_user_institution_unique').on(
      table.userId,
      table.institutionId,
    ),
    uniqueIndex('academic_identities_identifier_unique').on(
      table.institutionId,
      table.institutionalIdentifier,
    ),
    index('academic_identities_institution_idx').on(table.institutionId),
  ],
);

export const institutionMemberships = pgTable(
  'institution_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id),

    role: institutionRoleEnum('role').notNull(),
    status: institutionMembershipStatusEnum('status').notNull().default('ACTIVE'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('institution_memberships_user_institution_role_unique').on(
      table.userId,
      table.institutionId,
      table.role,
    ),
    index('institution_memberships_institution_idx').on(table.institutionId),
    index('institution_memberships_user_idx').on(table.userId),
  ],
);


export const institutionAccessRequests = pgTable(
  'institution_access_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id),

    status: institutionAccessRequestStatusEnum('status')
      .notNull()
      .default('PENDING'),

    assignedRole: institutionAccessRoleEnum('assigned_role'),

    decidedByUserId: uuid('decided_by_user_id')
      .references(() => users.id),

    decidedAt: timestamp('decided_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      'institution_access_requests_user_institution_unique',
    ).on(
      table.userId,
      table.institutionId,
    ),
    index(
      'institution_access_requests_institution_status_idx',
    ).on(
      table.institutionId,
      table.status,
    ),
    index(
      'institution_access_requests_user_idx',
    ).on(table.userId),

    check(
      'institution_access_requests_decision_shape_check',
      sql`
        (
          (
            ${table.status} = 'PENDING'
            AND ${table.assignedRole} IS NULL
            AND ${table.decidedByUserId} IS NULL
            AND ${table.decidedAt} IS NULL
          )
          OR
          (
            ${table.status} = 'APPROVED'
            AND ${table.assignedRole} IS NOT NULL
            AND ${table.decidedByUserId} IS NOT NULL
            AND ${table.decidedAt} IS NOT NULL
          )
          OR
          (
            ${table.status} = 'DENIED'
            AND ${table.assignedRole} IS NULL
            AND ${table.decidedByUserId} IS NOT NULL
            AND ${table.decidedAt} IS NOT NULL
          )
        )
      `,
    ),
  ],
);
