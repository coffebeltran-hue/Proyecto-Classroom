import { createHash, randomBytes } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export interface GitHubIdentityInput {
  githubUserId: bigint;
  login: string;
  avatarUrl: string | null;
}

export interface AuthenticatedUser {
  userId: string;
  githubUserId: bigint;
  login: string;
  avatarUrl: string | null;
}

export type InstitutionRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type AcademicIdentityStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

export interface UserInstitutionContext {
  id: string;
  name: string;
  slug: string;
  roles: InstitutionRole[];
  academicIdentity: {
    institutionalIdentifier: string;
    status: AcademicIdentityStatus;
  } | null;
}

async function rollback(client: PoolClient) {
  await client.query('ROLLBACK').catch(() => {});
}

export function createAuthRepository(pool: Pool) {
  return Object.freeze({
    async createOAuthAttempt(
  state: string,
  binding: string,
): Promise<void> {
  const stateHash = sha256(state);
  const bindingHash = sha256(binding);

      try {
        await pool.query({
          name: 'auth-oauth-attempt-create',
          text: `
  INSERT INTO oauth_attempts(state_hash, binding_hash, expires_at)
  VALUES ($1, $2, now() + interval '10 minutes')
`,
values: [stateHash, bindingHash],
        });
      } catch {
        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },

    async consumeOAuthAttempt(
  state: string,
  binding: string,
): Promise<boolean> {
  const stateHash = sha256(state);
  const bindingHash = sha256(binding);

      try {
        const result = await pool.query({
      name: 'auth-oauth-attempt-consume',
      text: `
        UPDATE oauth_attempts
           SET consumed_at = now()
         WHERE state_hash = $1
           AND binding_hash = $2
           AND consumed_at IS NULL
           AND expires_at > now()
        RETURNING id
          `,
          values: [stateHash, bindingHash],
    });

    return result.rowCount === 1;
  } catch {
    throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },

    async resolveGitHubIdentity(
      identity: GitHubIdentityInput,
    ): Promise<AuthenticatedUser> {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();
        await client.query('BEGIN');

        /*
         * Serialize competing callbacks for the same external identity
         * without requiring the row to exist yet.
         */
        await client.query({
          name: 'auth-github-identity-lock',
          text: `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
          values: [identity.githubUserId.toString()],
        });

        const existing = await client.query<{
          user_id: string;
        }>({
          name: 'auth-github-identity-find',
          text: `
            SELECT user_id
              FROM github_identities
             WHERE github_user_id = $1
          `,
          values: [identity.githubUserId.toString()],
        });

        let userId: string;

        if (existing.rowCount === 1) {
          userId = existing.rows[0]!.user_id;

          await client.query({
            name: 'auth-github-identity-refresh',
            text: `
              UPDATE github_identities
                 SET login = $2,
                     avatar_url = $3,
                     updated_at = now()
               WHERE github_user_id = $1
            `,
            values: [
              identity.githubUserId.toString(),
              identity.login,
              identity.avatarUrl,
            ],
          });
        } else {
          const created = await client.query<{ id: string }>({
            name: 'auth-user-create',
            text: `
              INSERT INTO users DEFAULT VALUES
              RETURNING id
            `,
          });

          userId = created.rows[0]!.id;

          await client.query({
            name: 'auth-github-identity-create',
            text: `
              INSERT INTO github_identities(
                github_user_id,
                user_id,
                login,
                avatar_url
              )
              VALUES ($1, $2, $3, $4)
            `,
            values: [
              identity.githubUserId.toString(),
              userId,
              identity.login,
              identity.avatarUrl,
            ],
          });
        }

        await client.query('COMMIT');

        return {
          userId,
          githubUserId: identity.githubUserId,
          login: identity.login,
          avatarUrl: identity.avatarUrl,
        };
      } catch {
        if (client) {
          await rollback(client);
        }

        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      } finally {
        client?.release();
      }
    },

    async createSession(userId: string): Promise<{
      secret: string;
      expiresAt: Date;
    }> {
      const secret = randomBytes(32).toString('base64url');
      const secretHash = sha256(secret);

      try {
        const result = await pool.query<{ expires_at: Date }>({
          name: 'auth-session-create',
          text: `
            INSERT INTO sessions(user_id, secret_hash, expires_at)
            VALUES ($1, $2, now() + interval '7 days')
            RETURNING expires_at
          `,
          values: [userId, secretHash],
        });

        const expiresAt = result.rows[0]?.expires_at;

        if (!(expiresAt instanceof Date)) {
          throw new Error('AUTH_SESSION_EXPIRY_INVALID');
        }

        return { secret, expiresAt };
      } catch {
        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },

    async findSession(secret: string): Promise<AuthenticatedUser | null> {
      const secretHash = sha256(secret);

      try {
        const result = await pool.query<{
          user_id: string;
          github_user_id: string;
          login: string;
          avatar_url: string | null;
        }>({
          name: 'auth-session-find',
          text: `
            SELECT
              s.user_id,
              g.github_user_id,
              g.login,
              g.avatar_url
            FROM sessions s
            JOIN github_identities g ON g.user_id = s.user_id
            WHERE s.secret_hash = $1
              AND s.revoked_at IS NULL
              AND s.expires_at > now()
          `,
          values: [secretHash],
        });

        if (result.rowCount !== 1) return null;

        const row = result.rows[0]!;

        return {
          userId: row.user_id,
          githubUserId: BigInt(row.github_user_id),
          login: row.login,
          avatarUrl: row.avatar_url,
        };
      } catch {
        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },

    async getUserAccessContext(
      userId: string,
    ): Promise<UserInstitutionContext[]> {
      try {
        const result = await pool.query<{
          institution_id: string;
          institution_name: string;
          institution_slug: string;
          role: InstitutionRole;
          institutional_identifier: string | null;
          academic_identity_status: AcademicIdentityStatus | null;
        }>({
          name: 'auth-user-access-context',
          text: `
            SELECT
              i.id AS institution_id,
              i.name AS institution_name,
              i.slug AS institution_slug,
              m.role,
              ai.institutional_identifier,
              ai.status AS academic_identity_status
            FROM institution_memberships m
            JOIN institutions i
              ON i.id = m.institution_id
            LEFT JOIN academic_identities ai
              ON ai.user_id = m.user_id
             AND ai.institution_id = m.institution_id
            WHERE m.user_id = $1
              AND m.status = 'ACTIVE'
            ORDER BY i.name, m.role
          `,
          values: [userId],
        });

        const institutions = new Map<
          string,
          UserInstitutionContext
        >();

        for (const row of result.rows) {
          let institution = institutions.get(row.institution_id);

          if (!institution) {
            institution = {
              id: row.institution_id,
              name: row.institution_name,
              slug: row.institution_slug,
              roles: [],
              academicIdentity:
                row.institutional_identifier &&
                row.academic_identity_status
                  ? {
                      institutionalIdentifier:
                        row.institutional_identifier,
                      status: row.academic_identity_status,
                    }
                  : null,
            };

            institutions.set(row.institution_id, institution);
          }

          if (!institution.roles.includes(row.role)) {
            institution.roles.push(row.role);
          }
        }

        return [...institutions.values()];
      } catch {
        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },

    async revokeSession(secret: string): Promise<void> {
      const secretHash = sha256(secret);

      try {
        await pool.query({
          name: 'auth-session-revoke',
          text: `
            UPDATE sessions
               SET revoked_at = COALESCE(revoked_at, now())
             WHERE secret_hash = $1
          `,
          values: [secretHash],
        });
      } catch {
        throw new Error('AUTH_STORAGE_UNAVAILABLE');
      }
    },
  });
}