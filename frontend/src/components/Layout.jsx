import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/',          icon: '🏠', label: 'Dashboard'     },
  { to: '/games',     icon: '🎮', label: 'Partidos'      },
  { to: '/schedule',  icon: '📅', label: 'Calendario'    },
  { to: '/players',   icon: '👤', label: 'Jugadores'     },
  { to: '/teams',     icon: '🏆', label: 'Equipos'       },
  { to: '/standings', icon: '📊', label: 'Clasificación' },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">🏀 NBA Analytics</div>
          <div className="brand-sub">Temporada 2024–25</div>
        </div>
        <nav className="nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">NBA Analytics</header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
