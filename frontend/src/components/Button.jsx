import { Loader2 } from 'lucide-react';

// min-h-11 = 44px : la cible tactile minimum recommandée (Apple HIG / Material Design).
// active:scale-95 donne un retour de pression sans décaler le layout autour du bouton.
export const buttonBaseClass =
  'btn-face inline-flex items-center justify-center gap-2 min-h-11 px-6 text-sm font-semibold ' +
  'transition-[transform,box-shadow] duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

// Style du bouton principal du vrai site (commealamaison-puteaux.fr) : dégradé bleu vif →
// marine, contour de 3px dans le marine, et ce coin coupé caractéristique (deux angles
// arrondis, deux droits) plutôt qu'un rectangle classique — exporté pour que les <Link>
// stylés en CTA ailleurs (Navbar, HomePage, AdminOffersPage...) suivent exactement le même
// look que <Button variant="primary">, sans dupliquer ces valeurs à chaque endroit.
export const primaryButtonStyle = {
  backgroundImage: 'var(--accent-gradient)',
  backgroundColor: 'transparent',
  color: '#fff',
  border: '3px solid var(--accent)',
  borderRadius: '25px 0 25px 0',
  boxShadow: 'none',
};

const VARIANTS = {
  primary: primaryButtonStyle,
  danger: { background: 'var(--status-refused)', color: '#fff', borderRadius: 'var(--radius-md)' },
  secondary: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)' },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)' },
};

export default function Button({ variant = 'primary', loading = false, disabled, children, className = '', style, ...props }) {
  return (
    <button
      className={`${buttonBaseClass} ${className}`}
      style={{ ...VARIANTS[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
