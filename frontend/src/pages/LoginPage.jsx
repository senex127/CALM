import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Button from '../components/Button';

const inputClass = 'px-3 py-2.5 rounded-lg min-h-11';
const inputStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: 'var(--accent-gradient)' }}>
        <Ticket size={19} color="#fff" />
      </div>
      <h1 className="text-xl font-bold mb-6 text-center">Connexion</h1>

      <div className="card p-6">
        <GoogleSignInButton />
        <div className="my-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>ou</div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email" required placeholder="Email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass} style={inputStyle}
          />
          <label className="sr-only" htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            type="password" required placeholder="Mot de passe" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass} style={inputStyle}
          />
          {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
          <Button type="submit" loading={submitting}>Se connecter</Button>
        </form>
      </div>

      <p className="text-sm mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Pas encore de compte ? <Link to="/inscription" className="font-medium" style={{ color: 'var(--accent-ink)' }}>Inscrivez-vous</Link>
      </p>
    </div>
  );
}
