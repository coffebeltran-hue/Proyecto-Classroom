import type { Pool } from 'pg';

export type AccessRequestEnsureResult =
  | 'CREATED'
  | 'EXISTS'
  | 'MEMBER'
  | 'INSTITUTION_NOT_FOUND';

export type InstitutionAccessRequestView = {
  id: string;
  institution: {
    id: string;
    name: string;
    slug: string;
  };
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  assignedRole: 'TEACHER' | 'STUDENT' | null;
};

export function createInstitutionAccessRepository(pool: Pool) {
  return Object.freeze({
    async ensurePendingRequest(
      userId: string,
      institutionSlug: string,
    ): Promise<AccessRequestEnsureResult> {
      try {
        const institution = await pool.query<{
          id: string;
        }>({
          name: 'access-institution-find-by-slug',
          text: `
            SELECT id
              FROM institutions
             WHERE slug = $1
             LIMIT 1
          `,
          values: [institutionSlug],
        });

        if (institution.rowCount !== 1) {
          return 'INSTITUTION_NOT_FOUND';
        }

        const institutionId = institution.rows[0]!.id;

        const membership = await pool.query({
          name: 'access-membership-exists',
          text: `
            SELECT 1
              FROM institution_memberships
             WHERE user_id = $1
               AND institution_id = $2
             LIMIT 1
          `,
          values: [userId, institutionId],
        });

        if (membership.rowCount === 1) {
          return 'MEMBER';
        }

        const existingRequest = await pool.query({
          name: 'access-request-exists',
          text: `
            SELECT 1
              FROM institution_access_requests
             WHERE user_id = $1
               AND institution_id = $2
             LIMIT 1
          `,
          values: [userId, institutionId],
        });

        if (existingRequest.rowCount === 1) {
          return 'EXISTS';
        }

        await pool.query({
          name: 'access-request-create',
          text: `
            INSERT INTO institution_access_requests(
              user_id,
              institution_id
            )
            VALUES ($1, $2)
          `,
          values: [userId, institutionId],
        });

        return 'CREATED';
      } catch {
        throw new Error('ACCESS_STORAGE_UNAVAILABLE');
      }
    },

    async findAccessRequest(
      userId: string,
      institutionSlug: string,
    ): Promise<InstitutionAccessRequestView | null> {
      try {
        const result = await pool.query<{
          request_id: string;
          institution_id: string;
          institution_name: string;
          institution_slug: string;
          status: 'PENDING' | 'APPROVED' | 'DENIED';
          assigned_role: 'TEACHER' | 'STUDENT' | null;
        }>({
          name: 'access-request-find-for-user',
          text: `
            SELECT
              r.id AS request_id,
              i.id AS institution_id,
              i.name AS institution_name,
              i.slug AS institution_slug,
              r.status,
              r.assigned_role
            FROM institution_access_requests r
            JOIN institutions i
              ON i.id = r.institution_id
            WHERE r.user_id = $1
              AND i.slug = $2
            LIMIT 1
          `,
          values: [userId, institutionSlug],
        });

        if (result.rowCount !== 1) {
          return null;
        }

        const row = result.rows[0]!;

        return {
          id: row.request_id,
          institution: {
            id: row.institution_id,
            name: row.institution_name,
            slug: row.institution_slug,
          },
          status: row.status,
          assignedRole: row.assigned_role,
        };
      } catch {
        throw new Error('ACCESS_STORAGE_UNAVAILABLE');
      }
    },
  });
}
