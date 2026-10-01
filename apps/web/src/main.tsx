import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

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

function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [loggingOut, setLoggingOut] = useState(false);

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

        const body = (await response.json()) as { user: CurrentUser };
        setAuth({ status: 'authenticated', user: body.user });
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
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

      if (!response.ok) throw new Error('Logout failed');

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
        <div className="loader" />
        <p className="muted">Cargando VMAT…</p>
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
            Gestiona cursos, entregas y repositorios desde un solo lugar.
          </p>

          <a className="github-button" href="/auth/github">
            <GitHubIcon />
            Continuar con GitHub
          </a>

          <p className="auth-note">
            GitHub se utiliza para autenticar tu cuenta. Tu identidad académica
            se vincula por separado.
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
            Comprueba que la API esté ejecutándose e inténtalo nuevamente.
          </p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </main>
    );
  }

  const { user } = auth;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">V</div>
          <strong>VMAT</strong>
        </div>

        <nav>
          <a className="nav-item active" href="#dashboard">
            <span>⌂</span>
            Inicio
          </a>
          <a className="nav-item disabled" href="#courses">
            <span>□</span>
            Cursos
          </a>
          <a className="nav-item disabled" href="#assignments">
            <span>✓</span>
            Actividades
          </a>
          <a className="nav-item disabled" href="#repositories">
            <span>⌘</span>
            Repositorios
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="environment-dot" />
          Desarrollo local
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">DASHBOARD</p>
            <h1>Hola, {user.github.login}</h1>
          </div>

          <div className="profile">
            {user.github.avatarUrl ? (
              <img src={user.github.avatarUrl} alt="" />
            ) : (
              <div className="avatar-placeholder">
                {user.github.login.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <strong>{user.github.login}</strong>
              <span>GitHub conectado</span>
            </div>
          </div>
        </header>

        <section className="hero-panel">
          <div>
            <span className="status-pill success">GitHub conectado</span>
            <h2>Tu espacio de trabajo está listo.</h2>
            <p>
              La autenticación de VMAT ya está conectada con GitHub y mantiene
              una sesión segura en el servidor.
            </p>
          </div>

          <div className="github-orb">
            <GitHubIcon />
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CUENTA</p>
                <h2>Identidad</h2>
              </div>
              <span className="status-pill success">Activa</span>
            </div>

            <div className="identity-row">
              {user.github.avatarUrl && (
                <img src={user.github.avatarUrl} alt="" />
              )}
              <div>
                <strong>@{user.github.login}</strong>
                <span>GitHub ID · {user.github.id}</span>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">INSTITUCIÓN</p>
                <h2>Identidad académica</h2>
              </div>
              <span className="status-pill pending">Pendiente</span>
            </div>

            <p className="muted">
              Tu cuenta de GitHub está autenticada, pero todavía no ha sido
              vinculada con una identidad académica.
            </p>

            <button className="secondary-button" disabled>
              Vincular identidad
            </button>
          </article>

          <article className="panel wide">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CURSOS</p>
                <h2>Tus aulas</h2>
              </div>
            </div>

            <div className="empty-state">
              <div className="empty-icon">+</div>
              <strong>Aún no tienes cursos vinculados</strong>
              <span>
                Los cursos aparecerán aquí cuando tu identidad académica esté
                configurada.
              </span>
            </div>
          </article>
        </section>

        <footer className="account-footer">
          <span>
            Sesión iniciada como <strong>@{user.github.login}</strong>
          </span>

          <button
            className="logout-button"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
