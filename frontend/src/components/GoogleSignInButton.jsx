import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

// Bouton "Sign in with Google" (Google Identity Services). Le frontend récupère
// un ID token que le backend vérifie côté serveur (voir lib/googleAuth.js) —
// aucun secret Google ne transite ni ne réside côté client.
export default function GoogleSignInButton() {
  const ref = useRef(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  // Un id encore égal au placeholder de .env.example n'est pas "configuré" : Google rejette ce
  // client_id, et tente quand même d'initialiser le widget produit un rendu cassé (iframe et id
  // dupliqués, visible en audit a11y) plutôt qu'une simple absence de bouton — pas mieux pour
  // un vrai visiteur. Même dégradation propre que Turnstile/Mailjet ailleurs dans ce projet :
  // tant que ce n'est pas configuré, on n'affiche rien plutôt qu'un widget à moitié fonctionnel.
  const clientId = rawClientId && !rawClientId.startsWith('xxxxxxxxxx') ? rawClientId : null;

  useEffect(() => {
    if (!clientId) return;

    const handleCredential = async (response) => {
      try {
        const { data } = await api.post('/auth/google', { credential: response.credential });
        setSession(data);
        navigate('/');
      } catch {
        alert('Connexion Google impossible. Réessayez.');
      }
    };

    const init = () => {
      window.google?.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
      if (ref.current) window.google?.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: '100%' });
    };

    if (window.google) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [clientId, setSession, navigate]);

  if (!clientId) return null;
  return <div ref={ref} />;
}
