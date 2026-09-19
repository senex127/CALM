import { Link, useNavigate } from 'react-router-dom';
import { Dice5, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button, { buttonBaseClass, primaryButtonStyle } from './Button';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ borderColor: 'var(--border)', background: 'var(--header-bg)' }}
    >
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg" style={{ color: 'var(--accent-ink)', fontFamily: 'var(--font-display)' }}>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
            <Dice5 size={17} color="#fff" strokeWidth={2.2} />
          </span>
          Comme à la Maison
        </Link>

        {/* Desktop / tablette — la navigation principale passe dans la barre du bas sur mobile */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/offres" style={{ color: 'var(--text-secondary)' }}>Offres</Link>
          <Link to="/a-propos" style={{ color: 'var(--text-secondary)' }}>À propos</Link>
          {user && <Link to="/mes-reservations" style={{ color: 'var(--text-secondary)' }}>Mes réservations</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin" style={{ color: 'var(--text-secondary)' }}>Admin</Link>}
          {user && <NotificationBell />}
          {user ? (
            <Button variant="secondary" onClick={handleLogout} className="min-h-0 py-1.5">Déconnexion</Button>
          ) : (
            <>
              <Link to="/connexion" style={{ color: 'var(--text-secondary)' }}>Connexion</Link>
              <Link to="/inscription" className={buttonBaseClass} style={primaryButtonStyle}>
                Créer un compte
              </Link>
            </>
          )}
        </div>

        {/* Mobile — seule l'action de session reste en haut, la navigation est dans la barre du bas */}
        <div className="flex md:hidden items-center gap-1">
          {user ? (
            <>
              <NotificationBell />
              <button
                onClick={handleLogout} aria-label="Déconnexion"
                className="min-h-11 min-w-11 flex items-center justify-center rounded-lg active:scale-95 transition-transform"
              >
                <LogOut size={20} color="var(--text-secondary)" />
              </button>
            </>
          ) : (
            <Link to="/inscription" className={buttonBaseClass} style={primaryButtonStyle}>
              S’inscrire
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
