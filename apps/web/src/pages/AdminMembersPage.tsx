import { useCallback, useEffect, useState } from 'react';

type MemberRole = 'TEACHER' | 'STUDENT';

type InstitutionMember = {
  membershipId: string;
  userId: string;
  githubLogin: string;
  avatarUrl: string | null;
  role: MemberRole;
  membershipStatus: 'ACTIVE';
  joinedAt: string;
  institutionalIdentifier: string | null;
  academicIdentityStatus:
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | null;
};

type AdminMembersPageProps = {
  institutionId: string;
  institutionName: string;
  role: MemberRole;
};

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      members: InstitutionMember[];
    }
  | {
      status: 'error';
      message: string;
    };

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function identityLabel(
  status: InstitutionMember['academicIdentityStatus'],
) {
  switch (status) {
    case 'VERIFIED':
      return 'Identidad verificada';

    case 'PENDING':
      return 'Identidad pendiente';

    case 'REJECTED':
      return 'Identidad rechazada';

    default:
      return 'Sin identidad académica';
  }
}

export function AdminMembersPage({
  institutionId,
  institutionName,
  role,
}: AdminMembersPageProps) {
  const [state, setState] = useState<LoadState>({
    status: 'loading',
  });

  const loadMembers = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const response = await fetch(
        `/admin/institutions/${institutionId}/members?role=${role}`,
        {
          credentials: 'same-origin',
        },
      );

      if (!response.ok) {
        throw new Error('Member listing failed');
      }

      const body = (await response.json()) as {
        members: InstitutionMember[];
      };

      setState({
        status: 'ready',
        members: body.members,
      });
    } catch {
      setState({
        status: 'error',
        message:
          'No pudimos cargar los miembros de esta institución.',
      });
    }
  }, [institutionId, role]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const isTeacher = role === 'TEACHER';

  const title = isTeacher
    ? 'Profesores'
    : 'Estudiantes';

  const singular = isTeacher
    ? 'profesor'
    : 'estudiante';

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="page-kicker">
            ADMINISTRACIÓN
          </p>

          <h1>{title}</h1>

          <p>
            Miembros activos de {institutionName} con rol de{' '}
            {singular}.
          </p>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="page-kicker">
              MIEMBROS ACTIVOS
            </p>

            <h2>{title} registrados</h2>
          </div>

          {state.status === 'ready' && (
            <span className="request-count">
              {state.members.length}{' '}
              {state.members.length === 1
                ? singular
                : title.toLowerCase()}
            </span>
          )}
        </div>

        {state.status === 'loading' && (
          <div className="admin-loading">
            <div className="loader" />
            <span>Cargando miembros…</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="admin-error-state">
            <strong>
              No pudimos cargar {title.toLowerCase()}.
            </strong>

            <span>{state.message}</span>

            <button
              type="button"
              onClick={() => void loadMembers()}
            >
              Reintentar
            </button>
          </div>
        )}

        {state.status === 'ready' &&
          state.members.length === 0 && (
            <div className="empty-admin-state large">
              <div className="empty-admin-letter">
                {isTeacher ? 'P' : 'E'}
              </div>

              <strong>
                No hay {title.toLowerCase()} activos
              </strong>

              <p>
                Los usuarios aparecerán aquí después de
                aprobar su solicitud con este rol.
              </p>
            </div>
          )}

        {state.status === 'ready' &&
          state.members.length > 0 && (
            <div className="member-list">
              {state.members.map(member => (
                <article
                  className="member-row"
                  key={member.membershipId}
                >
                  <div className="member-user">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                      />
                    ) : (
                      <div className="request-avatar">
                        {member.githubLogin
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <strong>
                        @{member.githubLogin}
                      </strong>

                      <span>
                        Ingresó{' '}
                        {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="member-role">
                    <span className="status-pill active">
                      {isTeacher
                        ? 'Profesor'
                        : 'Estudiante'}
                    </span>
                  </div>

                  <div className="member-identity">
                    <strong>
                      {member.institutionalIdentifier ??
                        'Sin identificador'}
                    </strong>

                    <span>
                      {identityLabel(
                        member.academicIdentityStatus,
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
