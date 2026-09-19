import { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';
import TurnstileWidget from '../components/TurnstileWidget';
import Button from '../components/Button';

const inputClass = 'px-3 py-2.5 rounded-lg min-h-11';
const inputStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' };

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', website: '' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const onVerify = useCallback((token) => setTurnstileToken(token), []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, turnstileToken });
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Inscription impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: 'var(--accent-gradient)' }}>
        <Ticket size={19} color="#fff" />
      </div>
      <h1 className="text-xl font-bold mb-6 text-center">Créer un compte</h1>

      <div className="card p-6">
        <GoogleSignInButton />
        <div className="my-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>ou</div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="register-name">Nom</label>
          <input
            id="register-name" type="text"
            required placeholder="Nom" autoComplete="name" value={form.name} onChange={update('name')}
            className={inputClass} style={inputStyle}
          />
          <label className="sr-only" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email" required placeholder="Email" autoComplete="email" value={form.email} onChange={update('email')}
            className={inputClass} style={inputStyle}
          />
          <label className="sr-only" htmlFor="register-password">Mot de passe</label>
          <input
            id="register-password"
            type="password" required minLength={8} placeholder="Mot de passe (8 caractères min)" autoComplete="new-password"
            value={form.password} onChange={update('password')}
            className={inputClass} style={inputStyle}
          />

          {/* Honeypot anti-bot : invisible et inatteignable au clavier pour un humain, mais
              présent dans le DOM — un bot qui remplit tous les champs s'y fait piéger
              (voir auth.controller.register côté backend). Ne pas mettre display:none, que
              certains bots savent détecter et ignorer. aria-label pour les analyseurs
              statiques d'accessibilité : aria-hidden retire déjà le champ de l'arbre pour les
              vrais lecteurs d'écran, ce label n'est donc jamais annoncé à un humain. */}
          <input
            type="text" name="website" value={form.website} onChange={update('website')}
            tabIndex={-1} autoComplete="off" aria-hidden="true" aria-label="Ne pas remplir"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />

          <TurnstileWidget onVerify={onVerify} />

          {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
          <Button type="submit" loading={submitting}>Créer mon compte</Button>
        </form>
      </div>

      <p className="text-sm mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Déjà inscrit ? <Link to="/connexion" className="font-medium" style={{ color: 'var(--accent-ink)' }}>Connectez-vous</Link>
      </p>
    </div>
  );
}
