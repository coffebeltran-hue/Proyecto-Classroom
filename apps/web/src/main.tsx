import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  AppShell,
  type AdminPage,
} from './components/AppShell';
import { AdminHomePage } from './pages/AdminHomePage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminMembersPage } from './pages/AdminMembersPage';

import './style.css';

type InstitutionRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
type AcademicIdentityStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

type CurrentUser = {
  id: string;
  github: {
    id: string;
    login: string;
    avatarUrl: string | null;
  };
  academicIdentity: null | {
    displayName?: string;
  };
  institutions: Array<{
    id: string;
    name: string;
    slug: string;
    roles: InstitutionRole[];
    academicIdentity: null | {
      institutionalIdentifier: string;
      status: AcademicIdentityStatus;
    };
  }>;
  accessRequest: null | {
    id: string;
    institution: {
      id: string;
      name: string;
      slug: string;
    };
    status: 'PENDING' | 'APPROVED' | 'DENIED';
    assignedRole: 'TEACHER' | 'STUDENT' | null;
  };
};

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'error' };

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"
      />
    </svg>
  );
}

function EmptyAdminPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="page-kicker">ADMINISTRACIÓN</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="admin-panel">
        <div className="empty-admin-state large">
          <div className="empty-admin-letter">
            {title.charAt(0)}
          </div>

          <strong>Aún no hay información para mostrar</strong>

          <p>
            Esta sección se conectará con datos reales de VMAT.
          </p>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
  });

  const [loggingOut, setLoggingOut] = useState(false);
  const [activePage, setActivePage] =
    useState<AdminPage>('home');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/me', {
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async response => {
        if (response.status === 401) {
          setAuth({ status: 'anonymous' });
          return;
        }

        if (!response.ok) {
          throw new Error('Unable to load session');
        }

        const body = (await response.json()) as {
          user: CurrentUser;
        };

        setAuth({
          status: 'authenticated',
          user: body.user,
        });
      })
      .catch(error => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setAuth({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  async function logout() {
    setLoggingOut(true);

    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setAuth({ status: 'anonymous' });
    } catch {
      setAuth({ status: 'error' });
    } finally {
      setLoggingOut(false);
    }
  }

  if (auth.status === 'loading') {
    return (
      <main className="center-screen">
        <div>
          <div className="loader" />
          <p className="muted">Cargando VMAT…</p>
        </div>
      </main>
    );
  }

  if (auth.status === 'anonymous') {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">V</div>

          <p className="eyebrow">VMAT CLASSROOM</p>

          <h1>Tu aula, conectada con GitHub.</h1>

          <p className="auth-description">
            Gestiona cursos, entregas y repositorios desde un
            solo lugar.
          </p>

          <a
            className="github-button"
            href="/auth/github"
          >
            <GitHubIcon />
            Continuar con GitHub
          </a>

          <p className="auth-note">
            GitHub autentica tu cuenta. Los permisos académicos
            se gestionan de forma independiente en VMAT.
          </p>
        </section>
      </main>
    );
  }

  if (auth.status === 'error') {
    return (
      <main className="center-screen">
        <div className="error-card">
          <p className="eyebrow">VMAT</p>
          <h1>No pudimos cargar tu sesión.</h1>

          <p className="muted">
            Comprueba que la API esté ejecutándose e inténtalo
            nuevamente.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const { user } = auth;
  const institution = user.institutions[0];
  const accessRequest = user.accessRequest;

  if (!institution && accessRequest?.status === 'PENDING') {
    return (
      <main className="center-screen">
        <div className="error-card">
          <p className="eyebrow">VMAT</p>
          <h1>Solicitud pendiente</h1>

          <p className="muted">
            Tu cuenta de GitHub está autenticada. Tu solicitud
            para ingresar a {accessRequest.institution.name}{' '}
            está esperando la aprobación de un administrador.
          </p>

          <span className="status-pill pending">
            Pendiente de aprobación
          </span>

          <div>
            <button
              type="button"
              className="logout-button"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut
                ? 'Cerrando sesión…'
                : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!institution && accessRequest?.status === 'DENIED') {
    return (
      <main className="center-screen">
        <div className="error-card">
          <p className="eyebrow">VMAT</p>
          <h1>Acceso no autorizado</h1>

          <p className="muted">
            Tu solicitud para ingresar a{' '}
            {accessRequest.institution.name} fue denegada.
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut
              ? 'Cerrando sesión…'
              : 'Cerrar sesión'}
          </button>
        </div>
      </main>
    );
  }

  if (!institution) {
    return (
      <main className="center-screen">
        <div className="error-card">
          <p className="eyebrow">VMAT</p>
          <h1>Cuenta sin institución</h1>

          <p className="muted">
            Tu cuenta está autenticada, pero no tiene una
            institución ni una solicitud de acceso asociada.
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut
              ? 'Cerrando sesión…'
              : 'Cerrar sesión'}
          </button>
        </div>
      </main>
    );
  }

  if (!institution.roles.includes('ADMIN')) {
    return (
      <main className="center-screen">
        <div className="error-card">
          <p className="eyebrow">VMAT</p>
          <h1>Perfil académico registrado</h1>

          <p className="muted">
            Esta cuenta pertenece a {institution.name}, pero la
            interfaz para su rol todavía no está habilitada en
            esta etapa del desarrollo.
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut
              ? 'Cerrando sesión…'
              : 'Cerrar sesión'}
          </button>
        </div>
      </main>
    );
  }

  function renderAdminPage() {
    switch (activePage) {
      case 'users':
        return (
          <AdminUsersPage
            institutionId={institution.id}
            institutionName={institution.name}
          />
        );

      case 'teachers':
        return (
          <AdminMembersPage
            institutionId={institution.id}
            institutionName={institution.name}
            role="TEACHER"
          />
        );

      case 'students':
        return (
          <AdminMembersPage
            institutionId={institution.id}
            institutionName={institution.name}
            role="STUDENT"
          />
        );

      case 'institution':
        return (
          <EmptyAdminPage
            title="Institución"
            description="Consulta y administra la configuración institucional."
          />
        );

      case 'home':
      default:
        return (
          <AdminHomePage
            institutionName={institution.name}
            githubLogin={user.github.login}
          />
        );
    }
  }

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      githubLogin={user.github.login}
      avatarUrl={user.github.avatarUrl}
      institutionName={institution.name}
      roles={institution.roles}
      loggingOut={loggingOut}
      onLogout={logout}
    >
      {renderAdminPage()}
    </AppShell>
  );
}

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
