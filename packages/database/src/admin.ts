import type { Pool, PoolClient } from 'pg';

export type AssignableInstitutionRole =
  | 'TEACHER'
  | 'STUDENT';

export type PendingAccessRequest = {
  id: string;
  userId: string;
  githubLogin: string;
  avatarUrl: string | null;
  institutionId: string;
  institutionName: string;
  createdAt: Date;
};

export type PendingAccessRequestsResult =
  | {
      status: 'OK';
      requests: PendingAccessRequest[];
    }
  | {
      status: 'FORBIDDEN';
    };

export type InstitutionMember = {
  membershipId: string;
  userId: string;
  githubLogin: string;
  avatarUrl: string | null;
  role: AssignableInstitutionRole;
  membershipStatus: 'ACTIVE';
  joinedAt: Date;
  institutionalIdentifier: string | null;
  academicIdentityStatus:
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | null;
};

export type InstitutionMembersResult =
  | {
      status: 'OK';
      members: InstitutionMember[];
    }
  | {
      status: 'FORBIDDEN';
    };

export type AccessDecisionResult =
  | {
      status: 'APPROVED';
      githubLogin: string;
      role: AssignableInstitutionRole;
    }
  | {
      status: 'DENIED';
      githubLogin: string;
    }
  | {
      status: 'FORBIDDEN';
    }
  | {
      status: 'NOT_FOUND';
    }
  | {
      status: 'ALREADY_DECIDED';
    };

async function rollback(client: PoolClient) {
  await client.query('ROLLBACK').catch(() => {});
}

async function isActiveAdmin(
  client: PoolClient,
  actorUserId: string,
  institutionId: string,
): Promise<boolean> {
  const result = await client.query({
    name: 'admin-active-membership-check',
    text: `
      SELECT 1
        FROM institution_memberships
       WHERE user_id = $1
         AND institution_id = $2
         AND role = 'ADMIN'
         AND status = 'ACTIVE'
       LIMIT 1
    `,
    values: [actorUserId, institutionId],
  });

  return result.rowCount === 1;
}

export function createAdminRepository(pool: Pool) {
  return Object.freeze({
    async listPendingAccessRequests(
      actorUserId: string,
      institutionId: string,
    ): Promise<PendingAccessRequestsResult> {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();

        const authorized = await isActiveAdmin(
          client,
          actorUserId,
          institutionId,
        );

        if (!authorized) {
          return { status: 'FORBIDDEN' };
        }

        const result = await client.query<{
          request_id: string;
          user_id: string;
          login: string;
          avatar_url: string | null;
          institution_id: string;
          institution_name: string;
          created_at: Date;
        }>({
          name: 'admin-access-requests-pending-list',
          text: `
            SELECT
              r.id AS request_id,
              r.user_id,
              g.login,
              g.avatar_url,
              i.id AS institution_id,
              i.name AS institution_name,
              r.created_at
            FROM institution_access_requests r
            JOIN github_identities g
              ON g.user_id = r.user_id
            JOIN institutions i
              ON i.id = r.institution_id
            WHERE r.institution_id = $1
              AND r.status = 'PENDING'
            ORDER BY r.created_at ASC
          `,
          values: [institutionId],
        });

        return {
          status: 'OK',
          requests: result.rows.map(row => ({
            id: row.request_id,
            userId: row.user_id,
            githubLogin: row.login,
            avatarUrl: row.avatar_url,
            institutionId: row.institution_id,
            institutionName: row.institution_name,
            createdAt: row.created_at,
          })),
        };
      } catch {
        throw new Error('ADMIN_STORAGE_UNAVAILABLE');
      } finally {
        client?.release();
      }
    },

    async listInstitutionMembers(
      actorUserId: string,
      institutionId: string,
      role: AssignableInstitutionRole,
    ): Promise<InstitutionMembersResult> {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();

        const authorized = await isActiveAdmin(
          client,
          actorUserId,
          institutionId,
        );

        if (!authorized) {
          return { status: 'FORBIDDEN' };
        }

        const result = await client.query<{
          membership_id: string;
          user_id: string;
          login: string;
          avatar_url: string | null;
          role: AssignableInstitutionRole;
          created_at: Date;
          institutional_identifier: string | null;
          academic_identity_status:
            | 'PENDING'
            | 'VERIFIED'
            | 'REJECTED'
            | null;
        }>({
          name: 'admin-institution-members-by-role',
          text: `
            SELECT
              m.id AS membership_id,
              m.user_id,
              g.login,
              g.avatar_url,
              m.role,
              m.created_at,
              a.institutional_identifier,
              a.status AS academic_identity_status
            FROM institution_memberships m
            JOIN github_identities g
              ON g.user_id = m.user_id
            LEFT JOIN academic_identities a
              ON a.user_id = m.user_id
             AND a.institution_id = m.institution_id
            WHERE m.institution_id = $1
              AND m.role = $2
              AND m.status = 'ACTIVE'
            ORDER BY m.created_at ASC
          `,
          values: [
            institutionId,
            role,
          ],
        });

        return {
          status: 'OK',
          members: result.rows.map(row => ({
            membershipId: row.membership_id,
            userId: row.user_id,
            githubLogin: row.login,
            avatarUrl: row.avatar_url,
            role: row.role,
            membershipStatus: 'ACTIVE',
            joinedAt: row.created_at,
            institutionalIdentifier:
              row.institutional_identifier,
            academicIdentityStatus:
              row.academic_identity_status,
          })),
        };
      } catch {
        throw new Error('ADMIN_STORAGE_UNAVAILABLE');
      } finally {
        client?.release();
      }
    },

    async approveAccessRequest(input: {
      actorUserId: string;
      institutionId: string;
      requestId: string;
      role: AssignableInstitutionRole;
    }): Promise<AccessDecisionResult> {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();
        await client.query('BEGIN');

        const authorized = await isActiveAdmin(
          client,
          input.actorUserId,
          input.institutionId,
        );

        if (!authorized) {
          await client.query('ROLLBACK');
          return { status: 'FORBIDDEN' };
        }

        const request = await client.query<{
          user_id: string;
          login: string;
          status: 'PENDING' | 'APPROVED' | 'DENIED';
        }>({
          name: 'admin-access-request-lock-for-approve',
          text: `
            SELECT
              r.user_id,
              g.login,
              r.status
            FROM institution_access_requests r
            JOIN github_identities g
              ON g.user_id = r.user_id
            WHERE r.id = $1
              AND r.institution_id = $2
            FOR UPDATE OF r
          `,
          values: [
            input.requestId,
            input.institutionId,
          ],
        });

        if (request.rowCount !== 1) {
          await client.query('ROLLBACK');
          return { status: 'NOT_FOUND' };
        }

        const row = request.rows[0]!;

        if (row.status !== 'PENDING') {
          await client.query('ROLLBACK');
          return { status: 'ALREADY_DECIDED' };
        }

        await client.query({
          name: 'admin-membership-create-after-approval',
          text: `
            INSERT INTO institution_memberships(
              user_id,
              institution_id,
              role
            )
            VALUES ($1, $2, $3)
          `,
          values: [
            row.user_id,
            input.institutionId,
            input.role,
          ],
        });

        await client.query({
          name: 'admin-access-request-mark-approved',
          text: `
            UPDATE institution_access_requests
               SET status = 'APPROVED',
                   assigned_role = $2,
                   decided_by_user_id = $3,
                   decided_at = now(),
                   updated_at = now()
             WHERE id = $1
          `,
          values: [
            input.requestId,
            input.role,
            input.actorUserId,
          ],
        });

        await client.query('COMMIT');

        return {
          status: 'APPROVED',
          githubLogin: row.login,
          role: input.role,
        };
      } catch {
        if (client) {
          await rollback(client);
        }

        throw new Error('ADMIN_STORAGE_UNAVAILABLE');
      } finally {
        client?.release();
      }
    },

    async denyAccessRequest(input: {
      actorUserId: string;
      institutionId: string;
      requestId: string;
    }): Promise<AccessDecisionResult> {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();
        await client.query('BEGIN');

        const authorized = await isActiveAdmin(
          client,
          input.actorUserId,
          input.institutionId,
        );

        if (!authorized) {
          await client.query('ROLLBACK');
          return { status: 'FORBIDDEN' };
        }

        const request = await client.query<{
          login: string;
          status: 'PENDING' | 'APPROVED' | 'DENIED';
        }>({
          name: 'admin-access-request-lock-for-deny',
          text: `
            SELECT
              g.login,
              r.status
            FROM institution_access_requests r
            JOIN github_identities g
              ON g.user_id = r.user_id
            WHERE r.id = $1
              AND r.institution_id = $2
            FOR UPDATE OF r
          `,
          values: [
            input.requestId,
            input.institutionId,
          ],
        });

        if (request.rowCount !== 1) {
          await client.query('ROLLBACK');
          return { status: 'NOT_FOUND' };
        }

        const row = request.rows[0]!;

        if (row.status !== 'PENDING') {
          await client.query('ROLLBACK');
          return { status: 'ALREADY_DECIDED' };
        }

        await client.query({
          name: 'admin-access-request-mark-denied',
          text: `
            UPDATE institution_access_requests
               SET status = 'DENIED',
                   assigned_role = NULL,
                   decided_by_user_id = $2,
                   decided_at = now(),
                   updated_at = now()
             WHERE id = $1
          `,
          values: [
            input.requestId,
            input.actorUserId,
          ],
        });

        await client.query('COMMIT');

        return {
          status: 'DENIED',
          githubLogin: row.login,
        };
      } catch {
        if (client) {
          await rollback(client);
        }

        throw new Error('ADMIN_STORAGE_UNAVAILABLE');
      } finally {
        client?.release();
      }
    },
  });
}
