type AdminHomePageProps = {
  institutionName: string;
  githubLogin: string;
};

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m8.8 12 2.1 2.1 4.5-4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.07.07l2-2A5 5 0 0 0 12 4l-1.15 1.15M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminHomePage({
  institutionName,
  githubLogin,
}: AdminHomePageProps) {
  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="page-kicker">ADMINISTRACIÓN</p>
          <h1>Panel institucional</h1>
          <p>
            Gestiona el acceso y los roles académicos de {institutionName}.
          </p>
        </div>

        <span className="admin-badge">
          <span />
          Administrador
        </span>
      </section>

      <section className="admin-summary-grid">
        <article className="summary-card">
          <div className="summary-icon">
            <ShieldIcon />
          </div>

          <div>
            <span className="summary-label">Tu acceso</span>
            <strong>Administrador activo</strong>
            <p>
              Tu cuenta tiene permisos administrativos dentro de esta
              institución.
            </p>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon">
            <LinkIcon />
          </div>

          <div>
            <span className="summary-label">Autenticación</span>
            <strong>GitHub conectado</strong>
            <p>@{githubLogin}</p>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon">
            <UsersIcon />
          </div>

          <div>
            <span className="summary-label">Usuarios</span>
            <strong>Gestión institucional</strong>
            <p>
              Desde aquí podrás asignar los roles de profesor y estudiante.
            </p>
          </div>
        </article>
      </section>

      <section className="admin-main-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="page-kicker">CONFIGURACIÓN INICIAL</p>
              <h2>Prepara tu institución</h2>
            </div>
          </div>

          <div className="setup-list">
            <div className="setup-item complete">
              <div className="setup-state">✓</div>
              <div>
                <strong>Institución creada</strong>
                <span>{institutionName}</span>
              </div>
            </div>

            <div className="setup-item complete">
              <div className="setup-state">✓</div>
              <div>
                <strong>Administrador configurado</strong>
                <span>@{githubLogin}</span>
              </div>
            </div>

            <div className="setup-item">
              <div className="setup-state">3</div>
              <div>
                <strong>Agregar profesores y estudiantes</strong>
                <span>
                  Los usuarios aparecerán cuando inicien sesión con GitHub y
                  luego podrán recibir un rol académico.
                </span>
              </div>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="page-kicker">IDENTIDADES</p>
              <h2>Roles académicos</h2>
            </div>
          </div>

          <div className="empty-admin-state">
            <div className="empty-admin-icon">
              <UsersIcon />
            </div>

            <strong>Gestiona los usuarios desde VMAT</strong>

            <p>
              Las cuentas se autentican con GitHub, pero los permisos
              académicos se asignan por separado desde la institución.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
