import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Vue d’ensemble', end: true },
  { to: '/admin/offres', label: 'Offres' },
  { to: '/admin/reservations', label: 'Réservations' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/parametres', label: 'Paramètres' },
];

export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Administration</h1>
      <nav className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ to, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className="text-sm font-medium px-3.5 min-h-11 rounded-lg inline-flex items-center transition-colors"
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
