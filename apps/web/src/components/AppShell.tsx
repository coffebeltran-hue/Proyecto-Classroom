import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AdminPage =
  | 'home'
  | 'users'
  | 'teachers'
  | 'students'
  | 'institution';

type AppShellProps = {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  githubLogin: string;
  avatarUrl: string | null;
  institutionName: string;
  roles: string[];
  loggingOut: boolean;
  onLogout: () => void;
  children: ReactNode;
};

type NavItem = {
  id: AdminPage;
  label: string;
  icon: ReactNode;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1H15v-6H9v6H4.1A1.1 1.1 0 0 1 3 19.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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

function TeacherIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m3 8 9-5 9 5-9 5-9-5Zm4 2.2V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.8M21 8v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8h5M19.5 5.5v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstitutionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 21h18M5 21V9h14v12M3 9l9-6 9 6M9 13h2M13 13h2M9 17h2M13 17h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Inicio', icon: <HomeIcon /> },
  { id: 'users', label: 'Usuarios', icon: <UsersIcon /> },
  { id: 'teachers', label: 'Profesores', icon: <TeacherIcon /> },
  { id: 'students', label: 'Estudiantes', icon: <StudentIcon /> },
  {
    id: 'institution',
    label: 'Institución',
    icon: <InstitutionIcon />,
  },
];

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem('vmat-theme');

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'dark'
    : 'light';
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppShell({
  activePage,
  onNavigate,
  githubLogin,
  avatarUrl,
  institutionName,
  roles,
  loggingOut,
  onLogout,
  children,
}: AppShellProps) {
  const [theme, setTheme] = useState<Theme>(
    getInitialTheme,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('vmat-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(current =>
      current === 'light' ? 'dark' : 'light',
    );
  }

  const primaryRole = roles.includes('ADMIN')
    ? 'Administrador'
    : roles.includes('TEACHER')
      ? 'Profesor'
      : roles.includes('STUDENT')
        ? 'Estudiante'
        : 'Sin rol';

  return (
    <div className="vmat-shell">
      <aside className="vmat-sidebar">
        <div className="vmat-brand">
          <div className="vmat-logo">V</div>

          <div>
            <strong>VMAT</strong>
            <span>Classroom</span>
          </div>
        </div>

        <nav className="vmat-nav" aria-label="Navegación principal">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={
                activePage === item.id
                  ? 'vmat-nav-item active'
                  : 'vmat-nav-item'
              }
              onClick={() => onNavigate(item.id)}
            >
              <span className="vmat-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="vmat-sidebar-bottom">
          <div className="sidebar-institution">
            <span>INSTITUCIÓN</span>
            <strong>{institutionName}</strong>
          </div>

          <div className="sidebar-user">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <div className="sidebar-avatar">
                {githubLogin.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="sidebar-user-copy">
              <strong>{githubLogin}</strong>
              <span>{primaryRole}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="vmat-workspace">
        <header className="vmat-topbar">
          <div className="topbar-context">
            <span>VMAT</span>
            <strong>{institutionName}</strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
              }
              title={
                theme === 'light'
                  ? 'Modo oscuro'
                  : 'Modo claro'
              }
            >
              <ThemeIcon theme={theme} />
            </button>

            <div className="topbar-role">
              <span className="role-dot" />
              {primaryRole}
            </div>

            <div className="topbar-profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <div className="topbar-avatar">
                  {githubLogin.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <strong>{githubLogin}</strong>
                <span>GitHub conectado</span>
              </div>
            </div>

            <button
              type="button"
              className="topbar-logout"
              onClick={onLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Cerrando…' : 'Salir'}
            </button>
          </div>
        </header>

        <main className="vmat-content">{children}</main>
      </div>
    </div>
  );
}
