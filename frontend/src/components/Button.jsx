import { Loader2 } from 'lucide-react';

// min-h-11 = 44px : la cible tactile minimum recommandée (Apple HIG / Material Design).
// active:scale-95 donne un retour de pression sans décaler le layout autour du bouton.
export const buttonBaseClass =
  'inline-flex items-center justify-center gap-2 min-h-11 px-4 text-sm font-semibold ' +
  'transition-[transform,box-shadow] duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

const VARIANTS = {
  primary: { background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 2px rgba(15,79,69,0.25)' },
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
