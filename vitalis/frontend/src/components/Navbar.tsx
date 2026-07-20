import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '◎' },
  { to: '/workouts', label: 'Workouts', icon: '⟡' },
  { to: '/nutrition', label: 'Nutrition', icon: '❁' },
  { to: '/assistant', label: 'Assistant', icon: '✦' },
  { to: '/profile', label: 'Profile', icon: '◐' }
];

export default function Navbar() {
  const { mode, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    <>
      <header
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Vitalis</span>
        </div>
        <nav style={{ display: 'none', gap: 6 }} className="desktop-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `pill${isActive ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={toggle} aria-label="Toggle theme" style={{ padding: '10px 14px' }}>
            {mode === 'light' ? '☾' : '☀'}
          </button>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '10px 14px' }}>
            Log out
          </button>
        </div>
      </header>

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .mobile-tabbar { display: none !important; }
        }
      `}</style>

      <nav
        className="mobile-tabbar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 6px calc(10px + env(safe-area-inset-bottom))',
          background: 'var(--surface)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
          zIndex: 20
        }}
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontSize: 11,
              fontWeight: 600,
              color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
              padding: '4px 10px'
            })}
          >
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
