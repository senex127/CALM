import { NavLink } from 'react-router-dom';
import { Home, Package, Ticket, ShieldCheck, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function BottomNav() {
  const user = useAuthStore((s) => s.user);

  const items = [
    { to: '/', label: 'Accueil', Icon: Home, end: true },
    { to: '/offres', label: 'Offres', Icon: Package },
    user
      ? { to: '/mes-reservations', label: 'Réservations', Icon: Ticket }
      : { to: '/connexion', label: 'Connexion', Icon: LogIn },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', Icon: ShieldCheck }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex md:hidden z-40 px-2 pt-1.5"
      style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      aria-label="Navigation principale"
    >
      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex-1 flex flex-col items-center justify-center gap-1 min-h-11 py-1">
          {({ isActive }) => (
            <>
              <span
                className="flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-150"
                style={{ background: isActive ? 'var(--accent-subtle)' : 'transparent' }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} color={isActive ? 'var(--accent-ink)' : 'var(--text-muted)'} />
              </span>
              <span className="text-[10.5px] font-medium" style={{ color: isActive ? 'var(--accent-ink)' : 'var(--text-muted)' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
